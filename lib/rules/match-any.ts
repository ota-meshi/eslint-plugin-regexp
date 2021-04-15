import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import type { Rule } from "eslint"
import type { CharacterClass, Node as RegExpNode } from "regexpp/ast"
import {
    createRule,
    defineRegexpVisitor,
    getRegexpLocation,
    getRegexpRange,
    fixerApplyEscape,
    parseFlags,
} from "../utils"
import type { ReadonlyFlags } from "regexp-ast-analysis"
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
        function fix(
            fixer: Rule.RuleFixer,
            node: Expression,
            regexpNode: RegExpNode,
            flags: ReadonlyFlags,
        ) {
            if (!preference) {
                return null
            }
            if (preference === OPTION_DOTALL && !flags.dotAll) {
                // since we can't just add flags, we cannot fix this
                return null
            }
            const range = getRegexpRange(sourceCode, node, regexpNode)
            if (range == null) {
                return null
            }

            if (
                regexpNode.type === "CharacterClass" &&
                preference.startsWith("[") &&
                preference.endsWith("]")
            ) {
                return fixer.replaceTextRange(
                    [range[0] + 1, range[1] - 1],
                    fixerApplyEscape(preference.slice(1, -1), node),
                )
            }

            const replacement = preference === OPTION_DOTALL ? "." : preference
            return fixer.replaceTextRange(
                range,
                fixerApplyEscape(replacement, node),
            )
        }

        /**
         * Create visitor
         * @param node
         */
        function createVisitor(
            node: Expression,
            _pattern: string,
            flagsStr: string,
        ): RegExpVisitor.Handlers {
            const flags = parseFlags(flagsStr)

            return {
                onCharacterSetEnter(csNode) {
                    if (
                        csNode.kind === "any" &&
                        flags.dotAll &&
                        !allows.has(OPTION_DOTALL)
                    ) {
                        context.report({
                            node,
                            loc: getRegexpLocation(sourceCode, node, csNode),
                            messageId: "unexpected",
                            data: {
                                expr: ".",
                            },
                            fix(fixer) {
                                return fix(fixer, node, csNode, flags)
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
                            loc: getRegexpLocation(sourceCode, node, ccNode),
                            messageId: "unexpected",
                            data: {
                                expr: ccNode.raw,
                            },
                            fix(fixer) {
                                return fix(fixer, node, ccNode, flags)
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
