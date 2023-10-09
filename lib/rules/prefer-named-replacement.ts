import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

export default createRule("prefer-named-replacement", {
    meta: {
        docs: {
            description: "enforce using named replacement",
            category: "Stylistic Issues",
            recommended: false,
        },
        fixable: "code",
        schema: [
            {
                type: "object",
                properties: {
                    strictTypes: { type: "boolean" },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            unexpected: "Unexpected indexed reference in replacement string.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const strictTypes = context.options[0]?.strictTypes ?? true
        const sourceCode = context.sourceCode

        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, getAllCapturingGroups, getCapturingGroupReferences } =
                regexpContext

            const capturingGroups = getAllCapturingGroups()
            if (!capturingGroups.length) {
                return {}
            }

            for (const ref of getCapturingGroupReferences({ strictTypes })) {
                if (
                    ref.type === "ReplacementRef" &&
                    ref.kind === "index" &&
                    ref.range
                ) {
                    const cgNode = capturingGroups[ref.ref - 1]
                    if (cgNode && cgNode.name) {
                        context.report({
                            node,
                            loc: {
                                start: sourceCode.getLocFromIndex(ref.range[0]),
                                end: sourceCode.getLocFromIndex(ref.range[1]),
                            },
                            messageId: "unexpected",
                            fix(fixer) {
                                return fixer.replaceTextRange(
                                    ref.range!,
                                    `$<${cgNode.name}>`,
                                )
                            },
                        })
                    }
                }
            }

            return {}
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
