import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils"
import { isEscapeSequence, createRule, defineRegexpVisitor } from "../utils"
import GraphemeSplitter from "grapheme-splitter"
import type { ReadonlyFlags } from "regexp-ast-analysis"
import { mention, mentionChar } from "../utils/mention"
import type {
    CharacterClass,
    CharacterClassElement,
    Quantifier,
} from "@eslint-community/regexpp/ast"
import type { PatternRange } from "../utils/ast-utils/pattern-source"
import type { Rule } from "eslint"

const splitter = new GraphemeSplitter()

/** Returns whether the given string starts with a valid surrogate pair. */
function startsWithSurrogate(s: string): boolean {
    if (s.length < 2) {
        return false
    }
    const h = s.charCodeAt(0)
    const l = s.charCodeAt(1)
    return h >= 0xd800 && h <= 0xdbff && l >= 0xdc00 && l <= 0xdfff
}

type Problem = "Multi" | "Surrogate"

/**
 * Returns the problem (if any) with the given grapheme.
 */
function getProblem(grapheme: string, flags: ReadonlyFlags): Problem | null {
    if (
        grapheme.length > 2 ||
        (grapheme.length === 2 && !startsWithSurrogate(grapheme))
    ) {
        return "Multi"
    } else if (!flags.unicode && startsWithSurrogate(grapheme)) {
        return "Surrogate"
    }
    return null
}

/** Returns the last grapheme of the quantified element. */
function getGraphemeBeforeQuant(quant: Quantifier): string {
    const alt = quant.parent

    // find the start index of the first character left of
    // this quantifier
    let start = quant.start
    for (let i = alt.elements.indexOf(quant) - 1; i >= 0; i--) {
        const e = alt.elements[i]
        if (e.type === "Character" && !isEscapeSequence(e.raw)) {
            start = e.start
        } else {
            break
        }
    }

    const before = alt.raw.slice(
        start - alt.start,
        quant.element.end - alt.start,
    )

    const graphemes = splitter.splitGraphemes(before)
    const grapheme = graphemes[graphemes.length - 1]

    return grapheme
}

interface GraphemeProblem {
    readonly grapheme: string
    readonly problem: Problem
    readonly start: number
    readonly end: number
    /** A sorted list of all unique elements that overlap with this grapheme */
    readonly elements: CharacterClassElement[]
}

/** Returns all grapheme problem in the given character class. */
function getGraphemeProblems(
    cc: CharacterClass,
    flags: ReadonlyFlags,
): GraphemeProblem[] {
    let offset = cc.negate ? 2 : 1

    const graphemes = splitter.splitGraphemes(cc.raw.slice(offset, -1))
    const problems: GraphemeProblem[] = []

    for (const grapheme of graphemes) {
        const problem = getProblem(grapheme, flags)
        if (problem !== null) {
            const start = offset + cc.start
            const end = start + grapheme.length

            problems.push({
                grapheme,
                problem,
                start,
                end,
                elements: cc.elements.filter(
                    (e) => e.start < end && e.end > start,
                ),
            })
        }
        offset += grapheme.length
    }

    return problems
}

/** Returns a fix for the given problems (if possible). */
function getGraphemeProblemsFix(
    problems: readonly GraphemeProblem[],
    cc: CharacterClass,
): string | null {
    if (cc.negate) {
        // we can't fix a negated character class
        return null
    }

    if (
        !problems.every(
            (p) =>
                p.start === p.elements[0].start &&
                p.end === p.elements[p.elements.length - 1].end,
        )
    ) {
        // the graphemes don't line up with character class elements
        return null
    }

    // The prefix of graphemes
    const prefix = problems
        .map((p) => p.grapheme)
        .sort((a, b) => b.length - a.length)
        .join("|")

    // The rest of the character class
    let ccRaw = cc.raw
    for (let i = problems.length - 1; i >= 0; i--) {
        const { start, end } = problems[i]
        ccRaw = ccRaw.slice(0, start - cc.start) + ccRaw.slice(end - cc.start)
    }
    if (ccRaw.startsWith("[^")) {
        ccRaw = `[\\${ccRaw.slice(1)}`
    }

    let fix = prefix
    let singleAlternative = problems.length === 1
    if (ccRaw !== "[]") {
        fix += `|${ccRaw}`
        singleAlternative = false
    }

    if (singleAlternative && cc.parent.type === "Alternative") {
        return fix
    }

    if (cc.parent.type === "Alternative" && cc.parent.elements.length === 1) {
        // The character class is the only
        return fix
    }

    return `(?:${fix})`
}

export default createRule("no-misleading-unicode-character", {
    meta: {
        docs: {
            description:
                "disallow multi-code-point characters in character classes and quantifiers",
            category: "Possible Errors",
            recommended: true,
        },
        schema: [
            {
                type: "object",
                properties: {
                    fixable: { type: "boolean" },
                },
                additionalProperties: false,
            },
        ],
        fixable: "code",
        hasSuggestions: true,
        messages: {
            characterClass:
                "The character(s) {{ graphemes }} are all represented using multiple {{ unit }}.{{ uFlag }}",
            quantifierMulti:
                "The character {{ grapheme }} is represented using multiple Unicode code points. The quantifier only applies to the last code point {{ last }} and not to the whole character.",
            quantifierSurrogate:
                "The character {{ grapheme }} is represented using a surrogate pair. The quantifier only applies to the tailing surrogate {{ last }} and not to the whole character.",

            // suggestions

            fixCharacterClass:
                "Move the character(s) {{ graphemes }} outside the character class.",
            fixQuantifier: "Wrap a group around {{ grapheme }}.",
        },
        type: "problem",
    },
    create(context) {
        const fixable = context.options[0]?.fixable ?? false

        function makeFix(
            fix: Rule.ReportFixer,
            messageId: string,
            data?: Record<string, string>,
        ): Partial<Rule.ReportDescriptorOptions> {
            if (fixable) {
                return { fix }
            }
            return {
                suggest: [{ messageId, data, fix }],
            }
        }

        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const {
                node,
                patternSource,
                flags,
                getRegexpLocation,
                fixReplaceNode,
            } = regexpContext

            return {
                onCharacterClassEnter(ccNode) {
                    const problems = getGraphemeProblems(ccNode, flags)
                    if (problems.length === 0) {
                        return
                    }

                    const range: PatternRange = {
                        start: problems[0].start,
                        end: problems[problems.length - 1].end,
                    }

                    const fix = getGraphemeProblemsFix(problems, ccNode)

                    const graphemes = problems
                        .map((p) => mention(p.grapheme))
                        .join(", ")
                    const uFlag = problems.every(
                        (p) => p.problem === "Surrogate",
                    )

                    context.report({
                        node,
                        loc: getRegexpLocation(range),
                        messageId: "characterClass",
                        data: {
                            graphemes,
                            unit: flags.unicode ? "code points" : "char codes",
                            uFlag: uFlag ? " Use the `u` flag." : "",
                        },
                        ...makeFix(
                            fixReplaceNode(ccNode, () => fix),
                            "fixCharacterClass",
                            { graphemes },
                        ),
                    })
                },
                onQuantifierEnter(qNode) {
                    if (qNode.element.type !== "Character") {
                        return
                    }

                    const grapheme = getGraphemeBeforeQuant(qNode)

                    const problem = getProblem(grapheme, flags)
                    if (problem === null) {
                        return
                    }

                    context.report({
                        node,
                        loc: getRegexpLocation(qNode),
                        messageId: `quantifier${problem}`,
                        data: {
                            grapheme: mention(grapheme),
                            last: mentionChar(qNode.element),
                        },
                        ...makeFix(
                            (fixer) => {
                                const range = patternSource.getReplaceRange({
                                    start: qNode.element.end - grapheme.length,
                                    end: qNode.element.end,
                                })
                                if (!range) {
                                    return null
                                }

                                return range.replace(fixer, `(?:${grapheme})`)
                            },
                            "fixQuantifier",
                            { grapheme: mention(grapheme) },
                        ),
                    })
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
