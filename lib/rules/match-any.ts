import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import type { Rule } from "eslint"
import type {
    CharacterClass,
    EscapeCharacterSet,
    UnicodePropertyCharacterSet,
    Node as RegExpNode,
    CharacterClassRange,
} from "regexpp/ast"
import {
    createRule,
    defineRegexpVisitor,
    FLAG_DOTALL,
    getRegexpLocation,
    getRegexpRange,
    fixerApplyEscape,
} from "../utils"

const OPTION_SS1 = "[\\s\\S]" as const
const OPTION_SS2 = "[\\S\\s]" as const
const OPTION_CARET = "[^]" as const
const OPTION_DOTALL = "dotAll" as const

/**
 * Get the key of the given CharacterSet node
 * @param node
 */
function getCharacterSetKey(
    node: EscapeCharacterSet | UnicodePropertyCharacterSet,
) {
    if (node.kind === "property") {
        return `\\p{${
            node.kind +
            (node.value == null ? node.key : `${node.key}=${node.value}`)
        }}`
    }

    return node.kind
}

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
            unexpected: 'Unexpected using "{{expr}}" to match any character.',
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const sourceCode = context.getSourceCode()
        const allowList: (
            | "[\\s\\S]"
            | "[\\S\\s]"
            | "[^]"
            | "dotAll"
        )[] = context.options[0]?.allows ?? [OPTION_SS1, OPTION_DOTALL]

        const allows: Set<"[\\s\\S]" | "[\\S\\s]" | "[^]" | "dotAll"> = new Set(
            allowList,
        )

        const prefer = (allowList[0] !== OPTION_DOTALL && allowList[0]) || null

        /**
         * Fix source code
         * @param fixer
         */
        function fix(
            fixer: Rule.RuleFixer,
            node: Expression,
            regexpNode: RegExpNode,
        ) {
            if (!prefer) {
                return null
            }
            const range = getRegexpRange(sourceCode, node, regexpNode)
            if (range == null) {
                return null
            }

            if (
                regexpNode.type === "CharacterClass" &&
                prefer.startsWith("[") &&
                prefer.endsWith("]")
            ) {
                return fixer.replaceTextRange(
                    [range[0] + 1, range[1] - 1],
                    fixerApplyEscape(prefer.slice(1, -1), node),
                )
            }

            return fixer.replaceTextRange(range, fixerApplyEscape(prefer, node))
        }

        /**
         * Create visitor
         * @param node
         */
        function createVisitor(
            node: Expression,
            _pattern: string,
            flags: string,
        ): RegExpVisitor.Handlers {
            let characterClassData: {
                node: CharacterClass
                charSets: Map<
                    string,
                    EscapeCharacterSet | UnicodePropertyCharacterSet
                >
                reported: boolean
            } | null = null
            return {
                onCharacterSetEnter(csNode) {
                    if (csNode.kind === "any") {
                        if (flags.includes(FLAG_DOTALL)) {
                            if (!allows.has(OPTION_DOTALL)) {
                                context.report({
                                    node,
                                    loc: getRegexpLocation(
                                        sourceCode,
                                        node,
                                        csNode,
                                    ),
                                    messageId: "unexpected",
                                    data: {
                                        expr: ".",
                                    },
                                    fix(fixer) {
                                        return fix(fixer, node, csNode)
                                    },
                                })
                            }
                        }
                        return
                    }
                    if (characterClassData && !characterClassData.reported) {
                        const key = getCharacterSetKey(csNode)
                        const alreadyCharSet = characterClassData.charSets.get(
                            key,
                        )
                        if (
                            alreadyCharSet != null &&
                            alreadyCharSet.negate === !csNode.negate
                        ) {
                            const ccNode = characterClassData.node
                            if (
                                !ccNode.negate &&
                                ccNode.elements.length === 2 &&
                                alreadyCharSet.kind === "space"
                            ) {
                                if (!alreadyCharSet.negate) {
                                    if (allows.has(OPTION_SS1)) {
                                        return
                                    }
                                } else {
                                    if (allows.has(OPTION_SS2)) {
                                        return
                                    }
                                }
                            }
                            context.report({
                                node,
                                loc: getRegexpLocation(
                                    sourceCode,
                                    node,
                                    ccNode,
                                ),
                                messageId: "unexpected",
                                data: {
                                    expr: ccNode.raw,
                                },
                                fix(fixer) {
                                    return fix(fixer, node, ccNode)
                                },
                            })
                            characterClassData.reported = true
                        } else {
                            characterClassData.charSets.set(key, csNode)
                        }
                    }
                },
                onCharacterClassRangeEnter(ccrNode: CharacterClassRange) {
                    if (
                        ccrNode.min.value === 0 &&
                        ccrNode.max.value === 65535
                    ) {
                        if (
                            characterClassData &&
                            !characterClassData.reported
                        ) {
                            const ccNode = characterClassData.node
                            context.report({
                                node,
                                loc: getRegexpLocation(
                                    sourceCode,
                                    node,
                                    ccNode,
                                ),
                                messageId: "unexpected",
                                data: {
                                    expr: ccNode.raw,
                                },
                                fix(fixer) {
                                    return fix(fixer, node, ccNode)
                                },
                            })
                            characterClassData.reported = true
                        }
                    }
                },
                onCharacterClassEnter(ccNode: CharacterClass) {
                    if (ccNode.elements.length === 0) {
                        if (ccNode.negate && !allows.has(OPTION_CARET)) {
                            context.report({
                                node,
                                loc: getRegexpLocation(
                                    sourceCode,
                                    node,
                                    ccNode,
                                ),
                                messageId: "unexpected",
                                data: {
                                    expr: "[^]",
                                },
                                fix(fixer) {
                                    return fix(fixer, node, ccNode)
                                },
                            })
                        }
                        return
                    }
                    characterClassData = {
                        node: ccNode,
                        charSets: new Map(),
                        reported: false,
                    }
                },
                onCharacterClassLeave() {
                    characterClassData = null
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
