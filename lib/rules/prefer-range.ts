import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type {
    Character,
    CharacterClassRange,
} from "@eslint-community/regexpp/ast"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import {
    getAllowedCharRanges,
    getAllowedCharValueSchema,
    inRange,
} from "../utils/char-ranges"
import type { PatternReplaceRange } from "../utils/ast-utils/pattern-source"
import { mention } from "../utils/mention"

export default createRule("prefer-range", {
    meta: {
        docs: {
            description: "enforce using character class range",
            category: "Best Practices",
            recommended: true,
        },
        fixable: "code",
        schema: [
            {
                type: "object",
                properties: {
                    target: getAllowedCharValueSchema(),
                },
                additionalProperties: false,
            },
        ],
        messages: {
            unexpected:
                "Unexpected multiple adjacent characters. Use {{range}} instead.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const allowedRanges = getAllowedCharRanges(
            context.options[0]?.target,
            context,
        )
        const sourceCode = context.sourceCode

        type CharacterGroup = {
            min: Character
            max: Character
            nodes: (Character | CharacterClassRange)[]
        }

        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, patternSource } = regexpContext

            /** Get report location ranges */
            function getReportRanges(
                nodes: (Character | CharacterClassRange)[],
            ): PatternReplaceRange[] | null {
                const ranges: PatternReplaceRange[] = []
                for (const reportNode of nodes) {
                    const reportRange =
                        patternSource.getReplaceRange(reportNode)
                    if (!reportRange) {
                        return null
                    }
                    const range = ranges.find(
                        (r) =>
                            r.range[0] <= reportRange.range[1] &&
                            reportRange.range[0] <= r.range[1],
                    )
                    if (range) {
                        range.range[0] = Math.min(
                            range.range[0],
                            reportRange.range[0],
                        )
                        range.range[1] = Math.max(
                            range.range[1],
                            reportRange.range[1],
                        )
                    } else {
                        ranges.push(reportRange)
                    }
                }
                return ranges
            }

            return {
                onCharacterClassEnter(ccNode) {
                    const groups: CharacterGroup[] = []
                    for (const element of ccNode.elements) {
                        let data: { min: Character; max: Character }
                        if (element.type === "Character") {
                            if (inRange(allowedRanges, element.value)) {
                                data = { min: element, max: element }
                            } else {
                                continue
                            }
                        } else if (element.type === "CharacterClassRange") {
                            if (
                                inRange(
                                    allowedRanges,
                                    element.min.value,
                                    element.max.value,
                                )
                            ) {
                                data = { min: element.min, max: element.max }
                            } else {
                                continue
                            }
                        } else {
                            continue
                        }

                        const group = groups.find((gp) => {
                            const adjacent =
                                gp.min.value - 1 <= data.max.value &&
                                data.min.value <= gp.max.value + 1

                            if (!adjacent) {
                                // the ranges have to be adjacent
                                return false
                            }

                            // the bounds of the union of the two ranges
                            const min = Math.min(gp.min.value, data.min.value)
                            const max = Math.max(gp.max.value, data.max.value)

                            // the union has to be an allowed range as well
                            return inRange(allowedRanges, min, max)
                        })

                        if (group) {
                            if (data.min.value < group.min.value) {
                                group.min = data.min
                            }
                            if (group.max.value < data.max.value) {
                                group.max = data.max
                            }
                            group.nodes.push(element)
                        } else {
                            groups.push({
                                ...data,
                                nodes: [element],
                            })
                        }
                    }

                    for (const group of groups) {
                        const charCount = group.max.value - group.min.value + 1
                        if (charCount >= 4 && group.nodes.length > 1) {
                            const newText = `${group.min.raw}-${group.max.raw}`
                            const ranges = getReportRanges(group.nodes)
                            if (!ranges) {
                                context.report({
                                    node,
                                    loc: node.loc!,
                                    messageId: "unexpected",
                                    data: { range: mention(newText) },
                                })
                                continue
                            }

                            for (const range of ranges) {
                                context.report({
                                    node,
                                    loc: range.getAstLocation(sourceCode),
                                    messageId: "unexpected",
                                    data: { range: mention(newText) },
                                    fix: (fixer) => {
                                        return ranges.map((r, index) => {
                                            if (index === 0) {
                                                return r.replace(fixer, newText)
                                            }
                                            return r.remove(fixer)
                                        })
                                    },
                                })
                            }
                        }
                    }
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
