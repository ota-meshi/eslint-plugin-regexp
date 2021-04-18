import type { RegExpVisitor } from "regexpp/visitor"
import type { Character, CharacterClassRange } from "regexpp/ast"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import {
    getAllowedCharRanges,
    getAllowedCharValueSchema,
    inRange,
} from "../utils/char-ranges"

export default createRule("prefer-range", {
    meta: {
        docs: {
            description: "enforce using character class range",
            // TODO In the major version
            // recommended: true,
            recommended: false,
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
                "Unexpected multiple adjacent characters. Use '{{range}}' instead.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const allowedRanges = getAllowedCharRanges(
            context.options[0]?.target,
            context,
        )
        const sourceCode = context.getSourceCode()

        type CharacterGroup = {
            min: Character
            max: Character
            nodes: (Character | CharacterClassRange)[]
        }

        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, getRegexpRange } = regexpContext

            /** Get report location ranges */
            function getReportRanges(
                nodes: (Character | CharacterClassRange)[],
            ): [number, number][] | null {
                const ranges: [number, number][] = []
                for (const reportNode of nodes) {
                    const reportRange = getRegexpRange(reportNode)
                    if (!reportRange) {
                        return null
                    }
                    const range = ranges.find(
                        (r) => r[0] <= reportRange[1] && reportRange[0] <= r[1],
                    )
                    if (range) {
                        range[0] = Math.min(range[0], reportRange[0])
                        range[1] = Math.max(range[1], reportRange[1])
                    } else {
                        ranges.push([...reportRange])
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
                        const group = groups.find(
                            (gp) =>
                                gp.min.value - 1 <= data.max.value &&
                                data.min.value <= gp.max.value + 1,
                        )
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
                        if (
                            group.max.value - group.min.value > 1 &&
                            group.nodes.length > 1
                        ) {
                            const ranges = getReportRanges(group.nodes)
                            const newText = `${group.min.raw}-${group.max.raw}`
                            for (const range of ranges || [node.range!]) {
                                context.report({
                                    node,
                                    loc: {
                                        start: sourceCode.getLocFromIndex(
                                            range[0],
                                        ),
                                        end: sourceCode.getLocFromIndex(
                                            range[1],
                                        ),
                                    },
                                    messageId: "unexpected",
                                    data: {
                                        range: newText,
                                    },
                                    fix: ranges
                                        ? (fixer) => {
                                              return ranges.map((r, index) => {
                                                  if (index === 0) {
                                                      return fixer.replaceTextRange(
                                                          r,
                                                          newText,
                                                      )
                                                  }
                                                  return fixer.removeRange(r)
                                              })
                                          }
                                        : undefined,
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
