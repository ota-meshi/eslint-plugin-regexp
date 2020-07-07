import type { RegExpLiteral, Literal } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import type { AST } from "eslint"
import {
    createRule,
    defineRegexpVisitor,
    getRegexpLocation,
    invisibleEscape,
    getRegexpRange,
    isInvisible,
} from "../utils"

export default createRule("no-invisible-character", {
    meta: {
        docs: {
            description: "disallow invisible raw character",
            recommended: true,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected:
                'Unexpected invisible character. Use "{{instead}}" instead.',
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const sourceCode = context.getSourceCode()

        /**
         * Create visitor
         * @param node
         */
        function createLiteralVisitor(
            node: RegExpLiteral,
        ): RegExpVisitor.Handlers {
            return {
                onCharacterEnter(cNode) {
                    if (cNode.raw === " ") {
                        return
                    }
                    if (cNode.raw.length === 1 && isInvisible(cNode.value)) {
                        const instead = invisibleEscape(
                            String.fromCodePoint(cNode.value),
                        )
                        context.report({
                            node,
                            loc: getRegexpLocation(sourceCode, node, cNode),
                            messageId: "unexpected",
                            data: {
                                instead,
                            },
                            fix(fixer) {
                                const range = getRegexpRange(
                                    sourceCode,
                                    node,
                                    cNode,
                                )

                                return fixer.replaceTextRange(range, instead)
                            },
                        })
                    }
                },
            }
        }

        /**
         * Verify a given string literal.
         * @param node
         */
        function verifyString(node: Literal): void {
            const text = sourceCode.getText(node)

            let index = 0
            for (const c of text) {
                const cp = c.codePointAt(0)!
                if (isInvisible(cp)) {
                    const instead = invisibleEscape(cp)
                    const range: AST.Range = [
                        node.range![0] + index,
                        node.range![0] + index + c.length,
                    ]
                    context.report({
                        node,
                        loc: {
                            start: sourceCode.getLocFromIndex(range[0]),
                            end: sourceCode.getLocFromIndex(range[1]),
                        },
                        messageId: "unexpected",
                        data: {
                            instead,
                        },
                        fix(fixer) {
                            return fixer.replaceTextRange(range, instead)
                        },
                    })
                }
                index += c.length
            }
        }

        return defineRegexpVisitor(context, {
            createLiteralVisitor,
            createSourceVisitor(node) {
                if (node.type === "Literal") {
                    verifyString(node)
                }
                return {} // no visit
            },
        })
    },
})
