import type { RegExpVisitor } from "regexpp/visitor"
import type { Alternative, Pattern, Quantifier } from "regexpp/ast"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import { UsageOfPattern } from "../utils/get-usage-of-pattern"
import type { ParsedLiteral } from "scslre"
import { analyse } from "scslre"
import type { Descendant } from "regexp-ast-analysis"
import {
    isPotentiallyEmpty,
    getMatchingDirection,
    getFirstConsumedCharAfter,
} from "regexp-ast-analysis"
import type { NoParentNode, Expression } from "refa"
import {
    visitAst,
    JS,
    transform,
    combineTransformers,
    Transformers,
} from "refa"

interface Report {
    quant: Quantifier
    attack: string
}

/**
 * Create a parsed literal object as required by the scslre library.
 */
function getParsedLiteral(
    context: RegExpContext,
    ignoreSticky: boolean,
): ParsedLiteral {
    const { flags, flagsString, patternAst } = context

    return {
        pattern: patternAst,
        flags: {
            type: "Flags",
            raw: flagsString ?? "",
            parent: null,
            start: NaN,
            end: NaN,
            dotAll: flags.dotAll ?? false,
            global: flags.global ?? false,
            hasIndices: flags.hasIndices ?? false,
            ignoreCase: flags.ignoreCase ?? false,
            multiline: flags.multiline ?? false,
            sticky: !ignoreSticky && (flags.sticky ?? false),
            unicode: flags.unicode ?? false,
        },
    }
}

/**
 * Removes duplicates from the given reports.
 */
function dedupeReports(reports: Iterable<Report>): Report[] {
    const seen = new Set<Quantifier>()
    const result: Report[] = []

    for (const r of reports) {
        if (!seen.has(r.quant)) {
            result.push(r)
            seen.add(r.quant)
        }
    }

    return result
}

/**
 * Returns all quantifiers that are reachable from the start of the
 * given node without consuming or asserting any characters.
 */
function* findReachableQuantifiers(
    node: Descendant<Pattern> | Alternative,
): Iterable<Quantifier> {
    switch (node.type) {
        case "CapturingGroup":
        case "Group":
        case "Pattern": {
            for (const a of node.alternatives) {
                yield* findReachableQuantifiers(a)
            }
            break
        }

        case "Assertion": {
            if (node.kind === "lookahead" || node.kind === "lookbehind") {
                for (const a of node.alternatives) {
                    yield* findReachableQuantifiers(a)
                }
            }
            break
        }

        case "Quantifier": {
            yield node
            break
        }

        case "Alternative": {
            const dir = getMatchingDirection(node)
            for (let i = 0; i < node.elements.length; i++) {
                const elementIndex =
                    dir === "ltr" ? i : node.elements.length - 1 - i
                const element = node.elements[elementIndex]

                yield* findReachableQuantifiers(element)

                if (!isPotentiallyEmpty(element)) {
                    break
                }
            }
            break
        }

        default:
            break
    }
}

const TRANFORMER_OPTIONS: Transformers.CreationOptions = {
    ignoreAmbiguity: true,
    ignoreOrder: true,
}
const PASS_1 = combineTransformers([
    Transformers.inline(TRANFORMER_OPTIONS),
    Transformers.removeDeadBranches(TRANFORMER_OPTIONS),
    Transformers.unionCharacters(TRANFORMER_OPTIONS),
    Transformers.moveUpEmpty(TRANFORMER_OPTIONS),
    Transformers.nestedQuantifiers(TRANFORMER_OPTIONS),
    Transformers.removeUnnecessaryAssertions(TRANFORMER_OPTIONS),
    Transformers.applyAssertions(TRANFORMER_OPTIONS),
])
const PASS_2 = combineTransformers([
    Transformers.inline(TRANFORMER_OPTIONS),
    Transformers.removeDeadBranches(TRANFORMER_OPTIONS),
    Transformers.replaceAssertions({
        ...TRANFORMER_OPTIONS,
        replacement: "empty-set",
    }),
])

export default createRule("no-super-linear-move", {
    meta: {
        docs: {
            description: "disallow quantifiers that cause quadratic moves",
            category: "Possible Errors",
            recommended: false,
        },
        schema: [
            {
                type: "object",
                properties: {
                    report: {
                        enum: ["certain", "potential"],
                    },
                    ignoreSticky: {
                        type: "boolean",
                    },
                    ignorePartial: {
                        type: "boolean",
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            unexpected:
                "Any attack string {{attack}} plus some rejecting suffix will cause quadratic runtime because of this quantifier.",
        },
        type: "problem",
    },
    create(context) {
        const reportUncertain =
            (context.options[0]?.report ?? "certain") === "potential"
        const ignoreSticky = context.options[0]?.ignoreSticky ?? false
        const ignorePartial = context.options[0]?.ignorePartial ?? true

        /** Returns reports reported by scslre. */
        function getScslreReports(
            regexpContext: RegExpContext,
            assumeRejectingSuffix: boolean,
        ): Iterable<Report> {
            const { flags } = regexpContext

            const result = analyse(getParsedLiteral(regexpContext, true), {
                reportTypes: { Move: true, Self: false, Trade: false },
                assumeRejectingSuffix,
            })

            return result.reports.map<Report>((r) => {
                if (r.type !== "Move") {
                    throw new Error("Unexpected report type")
                }

                return {
                    quant: r.quant,
                    attack: `/${r.character.literal.source}+/${
                        flags.ignoreCase ? "i" : ""
                    }`,
                }
            })
        }

        /**
         * Returns reports found using a simple quantifier approach.
         *
         * The main idea of the approach implemented here is the follows: If
         * there is a star quantifier q that can consume a non-empty word w
         * without asserting characters outside of w and that can be reached
         * without consuming or asserting characters, then we can construct an
         * attack string w^n.
         *
         * Example: /(?:ab){2,}:/
         * Here, q is `(?:ab){2,}` and w is `ab`. By repeating "ab", we can
         * create attack strings for which the regex will take O(n^2) time to
         * move across.
         */
        function* getSimpleReports(
            regexpContext: RegExpContext,
            assumeRejectingSuffix: boolean,
        ): Iterable<Report> {
            const { patternAst, flags } = regexpContext

            const parser = JS.Parser.fromAst(
                getParsedLiteral(regexpContext, true),
            )

            for (const q of findReachableQuantifiers(patternAst)) {
                if (q.max !== Infinity) {
                    // we are only interested in star quantifiers
                    continue
                }
                if (
                    q.element.type === "Assertion" ||
                    q.element.type === "Backreference"
                ) {
                    // these elements cannot consume characters
                    continue
                }

                let e: NoParentNode<Expression> = parser.parseElement(
                    q.element,
                    {
                        assertions: "parse",
                        backreferences: "disable",
                    },
                ).expression
                // apply and remove all assertions
                e = transform(PASS_1, e)
                e = transform(PASS_2, e)

                if (e.alternatives.length === 0) {
                    // there are no possible attack strings
                    continue
                }

                let hasCharacters = false
                visitAst(e, {
                    onCharacterClassEnter() {
                        hasCharacters = true
                    },
                })

                if (!hasCharacters) {
                    // the element is empty
                    // repeating this doesn't make sense for attack strings
                    continue
                }

                if (!assumeRejectingSuffix) {
                    // Let's try to filter out some false positives.
                    //
                    // The basic idea here is that if there is a path after
                    // the quantifier that can reach the end of the pattern
                    // without consuming or assertion characters, then it is
                    // not possible to find a rejecting suffix.
                    //
                    // This is actually not enough and will cause some false
                    // positives (e.g. `/(?:abc)*a/`) but it's the best I can
                    // think of right now.
                    const after = getFirstConsumedCharAfter(
                        q,
                        getMatchingDirection(q),
                        flags,
                    )
                    if (after.empty && after.look.char.isAll) {
                        // it is not possible to find a rejecting suffix
                        continue
                    }
                }

                const attack = `/${
                    JS.toLiteral({
                        type: "Quantifier",
                        alternatives: e.alternatives,
                        min: 1,
                        max: Infinity,
                        lazy: false,
                    }).source
                }/${flags.ignoreCase ? "i" : ""}`

                yield { quant: q, attack }
            }
        }

        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const {
                node,
                flags,
                getRegexpLocation,
                getUsageOfPattern,
            } = regexpContext

            if (ignoreSticky && flags.sticky) {
                return {}
            }

            const usage = getUsageOfPattern()

            if (ignorePartial && usage === UsageOfPattern.partial) {
                return {}
            }

            const assumeRejectingSuffix =
                reportUncertain && usage !== UsageOfPattern.whole

            for (const report of dedupeReports([
                ...getSimpleReports(regexpContext, assumeRejectingSuffix),
                ...getScslreReports(regexpContext, assumeRejectingSuffix),
            ])) {
                context.report({
                    node,
                    loc: getRegexpLocation(report.quant),
                    messageId: "unexpected",
                    data: { attack: report.attack },
                })
            }

            return {}
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
