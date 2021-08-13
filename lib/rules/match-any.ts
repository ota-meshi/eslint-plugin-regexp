import type { RegExpVisitor } from "regexpp/visitor"
import type { Rule } from "eslint"
import type { CharacterClass, Node as RegExpNode } from "regexpp/ast"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import { isRegexpLiteral } from "../utils/ast-utils/utils"
import { matchesAllCharacters } from "regexp-ast-analysis"
import { mention } from "../utils/mention"

const OPTION_SS1 = "[\\s\\S]" as const
const OPTION_SS2 = "[\\S\\s]" as const
const OPTION_CARET = "[^]" as const
const OPTION_DOTALL = "dotAll" as const
type Allowed =
    | typeof OPTION_SS1
    | typeof OPTION_SS2
    | typeof OPTION_CARET
    | typeof OPTION_DOTALL

export default createRule("match-any", {
    meta: {
        docs: {
            description: "enforce match any character style",
            category: "Stylistic Issues",
            recommended: true,
        },
        fixable: "code",
        schema: [
            {
                type: "object",
                properties: {
                    allows: {
                        type: "array",
                        items: {
                            type: "string",
                            enum: [
                                OPTION_SS1,
                                OPTION_SS2,
                                OPTION_CARET,
                                OPTION_DOTALL,
                            ],
                        },
                        uniqueItems: true,
                        minItems: 1,
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            unexpected: "Unexpected using {{expr}} to match any character.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const sourceCode = context.getSourceCode()
        const allowList: Allowed[] = context.options[0]?.allows ?? [
            OPTION_SS1,
            OPTION_DOTALL,
        ]
        const allows = new Set<string>(allowList)

        const preference: Allowed | null = allowList[0] || null

        /**
         * Fix source code
         * @param fixer
         */
        function fix(
            fixer: Rule.RuleFixer,
            { node, flags, patternSource }: RegExpContext,
            regexpNode: RegExpNode,
        ): null | Rule.Fix | Rule.Fix[] {
            if (!preference) {
                return null
            }

            if (preference === OPTION_DOTALL) {
                if (!flags.dotAll) {
                    // since we can't just add flags, we cannot fix this
                    return null
                }
                if (!isRegexpLiteral(node)) {
                    // Flag conflicts may be unavoidable and will not be autofix.
                    return null
                }

                const range = patternSource.getReplaceRange(regexpNode)
                if (range == null) {
                    return null
                }

                // Autofix to dotAll depends on the flag.
                // Modify the entire regular expression literal to avoid conflicts due to flag changes.
                const afterRange: [number, number] = [
                    range.range[1],
                    node.range![1],
                ]

                return [
                    range.replace(fixer, "."),
                    // Mark regular expression flag changes to avoid conflicts due to flag changes.
                    fixer.replaceTextRange(
                        afterRange,
                        sourceCode.text.slice(...afterRange),
                    ),
                ]
            }

            if (
                regexpNode.type === "CharacterClass" &&
                preference.startsWith("[") &&
                preference.endsWith("]")
            ) {
                // We know that the first and last character are the same,
                // so we only change the contents of the character class.
                // This will avoid unnecessary conflicts between fixes.
                const range = patternSource.getReplaceRange({
                    start: regexpNode.start + 1,
                    end: regexpNode.end - 1,
                })
                return range?.replace(fixer, preference.slice(1, -1)) ?? null
            }

            const range = patternSource.getReplaceRange(regexpNode)
            return range?.replace(fixer, preference) ?? null
        }

        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, flags, getRegexpLocation } = regexpContext

            return {
                onCharacterSetEnter(csNode) {
                    if (
                        csNode.kind === "any" &&
                        flags.dotAll &&
                        !allows.has(OPTION_DOTALL)
                    ) {
                        context.report({
                            node,
                            loc: getRegexpLocation(csNode),
                            messageId: "unexpected",
                            data: {
                                expr: mention(csNode),
                            },
                            fix(fixer) {
                                return fix(fixer, regexpContext, csNode)
                            },
                        })
                    }
                },
                onCharacterClassEnter(ccNode: CharacterClass) {
                    if (
                        matchesAllCharacters(ccNode, flags) &&
                        !allows.has(ccNode.raw as never)
                    ) {
                        context.report({
                            node,
                            loc: getRegexpLocation(ccNode),
                            messageId: "unexpected",
                            data: {
                                expr: mention(ccNode),
                            },
                            fix(fixer) {
                                return fix(fixer, regexpContext, ccNode)
                            },
                        })
                    }
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
