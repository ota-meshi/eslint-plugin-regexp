import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import type {
    CapturingGroup,
    Character,
    CharacterClass,
    CharacterSet,
    Group,
    LookaroundAssertion,
    Pattern,
} from "regexpp/ast"
import {
    createRule,
    defineRegexpVisitor,
    fixerApplyEscape,
    getRegexpLocation,
    getRegexpRange,
} from "../utils"

export default createRule("prefer-character-class", {
    meta: {
        docs: {
            description: "enforce using character class",
            // TODO In the major version
            // recommended: true,
            recommended: false,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected:
                "Unexpected the disjunction of single element alternatives. Use character class '[...]' instead.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const sourceCode = context.getSourceCode()

        /**
         * Create visitor
         * @param node
         */
        function createVisitor(node: Expression): RegExpVisitor.Handlers {
            /** Verify alternatives */
            function verify(
                regexpNode:
                    | Group
                    | CapturingGroup
                    | Pattern
                    | LookaroundAssertion,
            ) {
                if (regexpNode.alternatives.length <= 1) {
                    return
                }
                const elements: (
                    | Character
                    | CharacterSet
                    | CharacterClass
                )[] = []
                for (const alt of regexpNode.alternatives) {
                    if (alt.elements.length !== 1) {
                        return
                    }
                    const element = alt.elements[0]
                    if (element.type === "CharacterSet") {
                        if (element.kind === "any") {
                            return
                        }
                    } else if (
                        element.type !== "Character" &&
                        element.type !== "CharacterClass"
                    ) {
                        return
                    }
                    elements.push(element)
                }

                context.report({
                    node,
                    loc: getRegexpLocation(sourceCode, node, regexpNode),
                    messageId: "unexpected",
                    fix(fixer) {
                        let replaceRange: [number, number] | null = null
                        let newText = ""
                        for (const element of elements) {
                            const range = getRegexpRange(
                                sourceCode,
                                node,
                                element,
                            )
                            if (!range) {
                                return null
                            }
                            if (!replaceRange) {
                                replaceRange = [...range]
                            } else {
                                replaceRange[1] = range[1]
                            }
                            const text =
                                element.type === "CharacterClass"
                                    ? element.raw.slice(1, -1)
                                    : element.raw
                            if (text.startsWith("-")) {
                                newText += fixerApplyEscape("\\", node)
                            }
                            newText += fixerApplyEscape(text, node)
                        }
                        return fixer.replaceTextRange(
                            replaceRange!,
                            `[${newText}]`,
                        )
                    },
                })
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
