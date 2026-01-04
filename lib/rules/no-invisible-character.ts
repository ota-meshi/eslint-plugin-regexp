import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { AST } from "eslint"
import type {
    RegExpContextForLiteral,
    RegExpContextForSource,
} from "../utils/index.ts"
import { createRule, defineRegexpVisitor, isInvisible } from "../utils/index.ts"
import { toCharSetSource } from "../utils/refa.ts"

export default createRule("no-invisible-character", {
    meta: {
        docs: {
            description: "disallow invisible raw character",
            category: "Best Practices",
            recommended: true,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected:
                "Unexpected invisible character. Use '{{instead}}' instead.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const sourceCode = context.sourceCode

        function createLiteralVisitor({
            node,
            flags,
            getRegexpLocation,
            fixReplaceNode,
        }: RegExpContextForLiteral): RegExpVisitor.Handlers {
            return {
                onCharacterEnter(cNode) {
                    if (cNode.raw === " ") {
                        return
                    }
                    if (cNode.raw.length === 1 && isInvisible(cNode.value)) {
                        const instead = toCharSetSource(cNode.value, flags)
                        context.report({
                            node,
                            loc: getRegexpLocation(cNode),
                            messageId: "unexpected",
                            data: {
                                instead,
                            },
                            fix: fixReplaceNode(cNode, instead),
                        })
                    }
                },
            }
        }

        /**
         * Verify a given string literal.
         */
        function verifyString({ node, flags }: RegExpContextForSource): void {
            const text = sourceCode.getText(node)

            let index = 0
            for (const c of text) {
                if (c === " ") {
                    continue
                }
                const cp = c.codePointAt(0)!
                if (isInvisible(cp)) {
                    const instead = toCharSetSource(cp, flags)
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
            createSourceVisitor(regexpContext) {
                if (regexpContext.node.type === "Literal") {
                    verifyString(regexpContext)
                }
                return {} // no visit
            },
        })
    },
})
