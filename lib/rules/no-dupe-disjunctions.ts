import type { RegExpVisitor } from "regexpp/visitor"
import type {
    Alternative,
    CapturingGroup,
    Group,
    LookaroundAssertion,
    Pattern,
    Quantifier,
} from "regexpp/ast"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import { isCoveredNode, isEqualNodes } from "../utils/regexp-ast"
import type { Expression, FiniteAutomaton, ReadonlyNFA } from "refa"
import {
    combineTransformers,
    Transformers,
    DFA,
    NFA,
    JS,
    visitAst,
    transform,
} from "refa"
import type { ReadonlyFlags } from "regexp-ast-analysis"
import {
    getMatchingDirection,
    getEffectiveMaximumRepetition,
} from "regexp-ast-analysis"
import { RegExpParser } from "regexpp"

type ParentNode = Group | CapturingGroup | Pattern | LookaroundAssertion

/**
 * Check has after pattern
 */
function hasNothingAfterNode(node: ParentNode): boolean {
    const md = getMatchingDirection(node)

    for (
        let p:
            | Group
            | Pattern
            | CapturingGroup
            | LookaroundAssertion
            | Quantifier
            | Alternative = node;
        ;
        p = p.parent
    ) {
        if (p.type === "Assertion" || p.type === "Pattern") {
            return true
        }

        if (p.type !== "Alternative") {
            const parent: Quantifier | Alternative = p.parent
            if (parent.type === "Quantifier") {
                if (parent.max > 1) {
                    return false
                }
            } else {
                const lastIndex: number =
                    md === "ltr" ? parent.elements.length - 1 : 0
                if (parent.elements[lastIndex] !== p) {
                    return false
                }
            }
        }
    }
}

/**
 * Returns whether the given RE AST contains assertions.
 */
function containsAssertions(expression: Expression): boolean {
    try {
        visitAst(expression, {
            onAssertionEnter() {
                throw new Error()
            },
        })
        return false
    } catch (error) {
        return true
    }
}

const creationOption: Transformers.CreationOptions = {
    ignoreAmbiguity: true,
    ignoreOrder: true,
}
const assertionTransformer = combineTransformers([
    Transformers.applyAssertions(creationOption),
    Transformers.removeUnnecessaryAssertions(creationOption),
    Transformers.inline(creationOption),
    Transformers.removeDeadBranches(creationOption),
])

/**
 * Create an NFA from the given element.
 */
function toNFA(parser: JS.Parser, element: JS.ParsableElement): NFA {
    try {
        const { expression, maxCharacter } = parser.parseElement(element, {
            backreferences: "disable",
            assertions: "parse",
        })

        let e
        if (containsAssertions(expression)) {
            e = transform(assertionTransformer, expression)
        } else {
            e = expression
        }

        return NFA.fromRegex(e, { maxCharacter }, { assertions: "disable" })
    } catch (error) {
        return NFA.empty({
            maxCharacter: parser.ast.flags.unicode ? 0x10ffff : 0xffff,
        })
    }
}

/**
 * Unions all given NFAs
 */
function unionAll(nfas: readonly ReadonlyNFA[]): ReadonlyNFA {
    if (nfas.length === 0) {
        throw new Error("Cannot union 0 NFAs.")
    } else if (nfas.length === 1) {
        return nfas[0]
    }

    const total = nfas[0].copy()
    for (let i = 1; i < nfas.length; i++) {
        total.union(nfas[i])
    }
    return total
}

/**
 * Returns whether one NFA is a subset of another.
 */
function isSubsetOf(
    superset: ReadonlyNFA,
    subset: ReadonlyNFA,
): boolean | null {
    try {
        const a = DFA.fromIntersection(superset, subset)
        const b = DFA.fromFA(subset)
        a.minimize()
        b.minimize()
        return a.structurallyEqual(b)
    } catch (error) {
        return null
    }
}

const enum SubsetRelation {
    none,
    leftEqualRight,
    leftSubsetOfRight,
    leftSupersetOfRight,
    unknown,
}

/**
 * Returns the subset relation
 */
function getSubsetRelation(
    left: ReadonlyNFA,
    right: ReadonlyNFA,
): SubsetRelation {
    try {
        const inter = DFA.fromIntersection(left, right)
        inter.minimize()

        const l = DFA.fromFA(left)
        l.minimize()

        const r = DFA.fromFA(right)
        r.minimize()

        const subset = l.structurallyEqual(inter)
        const superset = r.structurallyEqual(inter)

        if (subset && superset) {
            return SubsetRelation.leftEqualRight
        } else if (subset) {
            return SubsetRelation.leftSubsetOfRight
        } else if (superset) {
            return SubsetRelation.leftSupersetOfRight
        }
        return SubsetRelation.none
    } catch (error) {
        return SubsetRelation.unknown
    }
}

/**
 * Returns the regex source of the given FA.
 */
function faToSource(fa: FiniteAutomaton, flags: ReadonlyFlags): string {
    try {
        return JS.toLiteral(fa.toRegex(), { flags }).source
    } catch (error) {
        return "<ERROR>"
    }
}

interface ResultBase {
    alternative: Alternative
    others: Alternative[]
}
interface DuplicateResult extends ResultBase {
    type: "Duplicate"
    others: [Alternative]
}
interface SubsetResult extends ResultBase {
    type: "Subset"
}
interface PrefixSubsetResult extends ResultBase {
    type: "PrefixSubset"
}
interface SupersetResult extends ResultBase {
    type: "Superset"
}
interface OverlapResult extends ResultBase {
    type: "Overlap"
    overlap: NFA
}
type Result =
    | DuplicateResult
    | SubsetResult
    | PrefixSubsetResult
    | SupersetResult
    | OverlapResult

interface Options {
    parser: JS.Parser
    hasNothingAfter: boolean
    fastAst: boolean
    noNfa: boolean
    ignoreOverlap: boolean
}

/**
 * Tries to find duplication in the given alternatives
 */
function* findDuplicationAstFast(
    alternatives: Alternative[],
    { toCharSet }: RegExpContext,
): Iterable<Result> {
    // eslint-disable-next-line func-style -- x
    const shortCircuit: Parameters<typeof isEqualNodes>[3] = (a) => {
        return a.type === "CapturingGroup" ? false : null
    }

    for (let i = 0; i < alternatives.length; i++) {
        const alternative = alternatives[i]

        for (let j = 0; j < i; j++) {
            const other = alternatives[j]

            if (isEqualNodes(other, alternative, toCharSet, shortCircuit)) {
                yield { type: "Duplicate", alternative, others: [other] }
            }
        }
    }
}

/**
 * Tries to find duplication in the given alternatives
 */
function* findDuplicationAst(
    alternatives: Alternative[],
    context: RegExpContext,
    hasNothingAfter: boolean,
): Iterable<Result> {
    const { flags, toCharSet } = context

    const isCoveredOptions: Parameters<typeof isCoveredNode>[2] = {
        flags,
        canOmitRight: hasNothingAfter,
        toCharSet,
    }
    const isCoveredOptionsNoPrefix: Parameters<typeof isCoveredNode>[2] = {
        flags,
        canOmitRight: false,
        toCharSet,
    }

    for (let i = 0; i < alternatives.length; i++) {
        const alternative = alternatives[i]

        for (let j = 0; j < i; j++) {
            const other = alternatives[j]

            if (isCoveredNode(other, alternative, isCoveredOptions)) {
                if (isEqualNodes(other, alternative, toCharSet)) {
                    yield {
                        type: "Duplicate",
                        alternative,
                        others: [other],
                    }
                } else if (
                    hasNothingAfter &&
                    !isCoveredNode(other, alternative, isCoveredOptionsNoPrefix)
                ) {
                    yield {
                        type: "PrefixSubset",
                        alternative,
                        others: [other],
                    }
                } else {
                    yield { type: "Subset", alternative, others: [other] }
                }
            }
        }
    }
}

/**
 * Tries to find duplication in the given alternatives.
 *
 * It will search for prefix duplications. I.e. the alternative `ab` in `a|ab`
 * is a duplicate of `a` because if `ab` accepts, `a` will have already accepted
 * the input string. This makes `ab` effectively useless.
 *
 * This operation will modify the given NFAs.
 */
function* findPrefixDuplicationNfa(
    alternatives: [NFA, Alternative][],
): Iterable<Result> {
    if (alternatives.length === 0) {
        return
    }

    // For two alternatives `A|B`, `B` is useless if `B` is a subset of `A[^]*`

    const all = NFA.all({ maxCharacter: alternatives[0][0].maxCharacter })

    for (let i = 1; i < alternatives.length; i++) {
        const [nfa, alternative] = alternatives[i]

        const overlapping = alternatives
            .slice(0, i)
            .filter(([otherNfa]) => !nfa.isDisjointWith(otherNfa))

        if (overlapping.length >= 1) {
            const othersNfa = unionAll(overlapping.map(([n]) => n))
            const others = overlapping.map(([, a]) => a)

            // Only checking for a subset relation is sufficient here.
            // Duplicates are VERY unlikely. (Who would use alternatives
            // like `a|a[^]*`?)

            if (isSubsetOf(othersNfa, nfa)) {
                yield { type: "PrefixSubset", alternative, others }
            } else {
                // The else case is interesting.
                // It means that _some_ of the paths in the current alternative are useless.
                // TODO: Decide whether this should be reported as well.
            }
        }

        nfa.append(all)
    }
}

/**
 * Tries to find duplication in the given alternatives.
 */
function* findDuplicationNfa(
    alternatives: Alternative[],
    { hasNothingAfter, parser, ignoreOverlap }: Options,
): Iterable<Result> {
    const previous: [NFA, Alternative][] = []
    for (let i = 0; i < alternatives.length; i++) {
        const alternative = alternatives[i]
        const nfa = toNFA(parser, alternative)

        const overlapping = previous.filter(
            ([otherNfa]) => !nfa.isDisjointWith(otherNfa),
        )

        if (overlapping.length >= 1) {
            const othersNfa = unionAll(overlapping.map(([n]) => n))
            const others = overlapping.map(([, a]) => a)

            const relation = getSubsetRelation(nfa, othersNfa)
            switch (relation) {
                case SubsetRelation.leftEqualRight:
                    if (others.length === 1) {
                        // only return "duplicate" if there is only one other
                        // alternative
                        yield {
                            type: "Duplicate",
                            alternative,
                            others: [others[0]],
                        }
                    } else {
                        yield { type: "Subset", alternative, others }
                    }
                    break

                case SubsetRelation.leftSubsetOfRight:
                    yield { type: "Subset", alternative, others }
                    break

                case SubsetRelation.leftSupersetOfRight:
                    yield { type: "Superset", alternative, others }
                    break

                case SubsetRelation.none:
                case SubsetRelation.unknown:
                    // TODO: we might want to report cases where the relation
                    // couldn't be determined
                    if (!ignoreOverlap) {
                        yield {
                            type: "Overlap",
                            alternative,
                            others,
                            overlap: NFA.fromIntersection(nfa, othersNfa),
                        }
                    }
                    break

                default:
                    throw new Error(relation)
            }
        }

        previous.push([nfa, alternative])
    }

    if (hasNothingAfter) {
        yield* findPrefixDuplicationNfa(previous)
    }
}

/**
 * Tries to find duplication in the given alternatives
 */
function* findDuplication(
    alternatives: Alternative[],
    context: RegExpContext,
    options: Options,
): Iterable<Result> {
    // AST-based approach
    if (options.fastAst) {
        yield* findDuplicationAstFast(alternatives, context)
    } else {
        yield* findDuplicationAst(
            alternatives,
            context,
            options.hasNothingAfter,
        )
    }

    // NFA-based approach
    if (!options.noNfa) {
        yield* findDuplicationNfa(alternatives, options)
    }
}

const RESULT_TYPE_ORDER: Result["type"][] = [
    "Duplicate",
    "Subset",
    "PrefixSubset",
    "Superset",
    "Overlap",
]

/**
 * Returns an array of the given results that is sorted by result type from
 * most important to least important.
 */
function sortResultTypes(unsorted: Iterable<Result>): Result[] {
    return [...unsorted].sort(
        (a, b) =>
            RESULT_TYPE_ORDER.indexOf(a.type) -
            RESULT_TYPE_ORDER.indexOf(b.type),
    )
}

/**
 * Returns an array of the given results that is sorted by result type from
 * most important to least important.
 */
function deduplicateResults(results: readonly Result[]): Result[] {
    const seen = new Set<Alternative>()
    return results.filter(({ alternative }) => {
        if (seen.has(alternative)) {
            return false
        }
        seen.add(alternative)
        return true
    })
}

export default createRule("no-dupe-disjunctions", {
    meta: {
        docs: {
            description: "disallow duplicate disjunctions",
            // TODO In the major version
            // recommended: true,
            recommended: false,
        },
        schema: [
            {
                type: "object",
                properties: {
                    disallowNeverMatch: { type: "boolean" },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            duplicate: "Unexpected duplicate alternative.{{exp}}",
            subset:
                "Unexpected useless alternative. This alternative is a subset of '{{others}}' and can be removed.{{exp}}",
            prefixSubset:
                // TODO: better message
                "Unexpected useless alternative. This alternative is already covered by '{{others}}' and can be removed.",
            // TODO: better message
            superset: "superset others: '{{others}}' TODO:.{{exp}}",
            overlap:
                "Unexpected overlap. This alternative overlaps with '{{others}}'. The overlap is '{{expr}}'.{{exp}}",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        // TODO: options

        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const {
                patternAst,
                flagsString,
                flags,
                node,
                getRegexpLocation,
            } = regexpContext

            const parser = JS.Parser.fromAst({
                pattern: patternAst,
                flags: new RegExpParser().parseFlags(
                    flagsString?.replace(/[^gimsuy]/g, "") ?? "",
                ),
            })

            /** Verify group node */
            function verify(parentNode: ParentNode) {
                const rawResults = findDuplication(
                    parentNode.alternatives,
                    regexpContext,
                    {
                        fastAst: false,
                        noNfa: false,
                        ignoreOverlap: false,
                        hasNothingAfter: hasNothingAfterNode(parentNode),
                        parser,
                    },
                )

                const results = deduplicateResults(sortResultTypes(rawResults))

                results.forEach(report)
            }

            /** Report the given result. */
            function report(result: Result) {
                const exp =
                    getEffectiveMaximumRepetition(result.alternative) > 10
                        ? " This ambiguity is likely to cause exponential backtracking."
                        : ""

                const others = result.others.map((a) => a.raw).join("|")

                switch (result.type) {
                    case "Duplicate":
                        context.report({
                            node,
                            loc: getRegexpLocation(result.alternative),
                            messageId: "duplicate",
                            data: { exp, others },
                        })
                        break

                    case "Subset":
                        context.report({
                            node,
                            loc: getRegexpLocation(result.alternative),
                            messageId: "subset",
                            data: { exp, others },
                        })
                        break

                    case "PrefixSubset":
                        context.report({
                            node,
                            loc: getRegexpLocation(result.alternative),
                            messageId: "prefixSubset",
                            data: { exp, others },
                        })
                        break

                    case "Superset":
                        context.report({
                            node,
                            loc: getRegexpLocation(result.alternative),
                            messageId: "superset",
                            data: { exp, others },
                        })
                        break

                    case "Overlap":
                        context.report({
                            node,
                            loc: getRegexpLocation(result.alternative),
                            messageId: "overlap",
                            data: {
                                exp,
                                others,
                                expr: faToSource(result.overlap, flags),
                            },
                        })
                        break

                    default:
                        throw new Error(result)
                }
            }

            return {
                onPatternEnter: verify,
                onGroupEnter: verify,
                onCapturingGroupEnter: verify,
                onAssertionEnter(aNode) {
                    if (
                        aNode.kind === "lookahead" ||
                        aNode.kind === "lookbehind"
                    ) {
                        verify(aNode)
                    }
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
