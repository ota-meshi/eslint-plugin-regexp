import type { RegExpVisitor } from "regexpp/visitor"
import type { Rule } from "eslint"
import type { CharacterClass, Node as RegExpNode } from "regexpp/ast"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor, isRegexpLiteral } from "../utils"
import { matchesAllCharacters } from "regexp-ast-analysis"

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
            unexpected: "Unexpected using '{{expr}}' to match any character.",
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
        function* fix(
            fixer: Rule.RuleFixer,
            { node, flags, getRegexpRange, fixerApplyEscape }: RegExpContext,
            regexpNode: RegExpNode,
        ) {
            if (!preference) {
                return
            }
            if (preference === OPTION_DOTALL) {
                if (!flags.dotAll) {
                    // since we can't just add flags, we cannot fix this
                    return
                }
                if (!isRegexpLiteral(node)) {
                    // Flag conflicts may be unavoidable and will not be autofix.
                    return
                }
            }
            const range = getRegexpRange(regexpNode)
            if (range == null) {
                return
            }

            if (
                regexpNode.type === "CharacterClass" &&
                preference.startsWith("[") &&
                preference.endsWith("]")
            ) {
                yield fixer.replaceTextRange(
                    [range[0] + 1, range[1] - 1],
                    fixerApplyEscape(preference.slice(1, -1)),
                )
                return
            }

            const replacement = preference === OPTION_DOTALL ? "." : preference
            yield fixer.replaceTextRange(range, fixerApplyEscape(replacement))

            if (preference === OPTION_DOTALL) {
                // Autofix to dotAll depends on the flag.
                // Modify the entire regular expression literal to avoid conflicts due to flag changes.

                // Mark regular expression flag changes to avoid conflicts due to flag changes.
                const afterRange: [number, number] = [range[1], node.range![1]]
                yield fixer.replaceTextRange(
                    afterRange,
                    sourceCode.text.slice(...afterRange),
                )
            }
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
                                expr: ".",
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
                                expr: ccNode.raw,
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
