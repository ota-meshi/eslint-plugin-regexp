import type { RegExpVisitor } from "regexpp/visitor"
import { isOpeningBracketToken } from "eslint-utils"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

export default createRule("prefer-result-array-groups", {
    meta: {
        docs: {
            description: "enforce using result array `groups`",
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
            unexpected: "Unexpected indexed access from regexp result array.",
        },
        type: "suggestion",
    },
    create(context) {
        const strictTypes = context.options[0]?.strictTypes ?? true
        const sourceCode = context.getSourceCode()

        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const {
                getAllCapturingGroups,
                getCapturingGroupReferences,
            } = regexpContext

            const capturingGroups = getAllCapturingGroups()
            if (!capturingGroups.length) {
                return {}
            }

            for (const ref of getCapturingGroupReferences({ strictTypes })) {
                if (
                    ref.type === "ArrayRef" &&
                    ref.kind === "index" &&
                    ref.ref != null
                ) {
                    const cgNode = capturingGroups[ref.ref - 1]
                    if (cgNode && cgNode.name) {
                        const memberNode =
                            ref.prop.type === "member" ? ref.prop.node : null
                        context.report({
                            node: ref.prop.node,
                            messageId: "unexpected",
                            fix:
                                memberNode && memberNode.computed
                                    ? (fixer) => {
                                          const tokens = sourceCode.getTokensBetween(
                                              memberNode.object,
                                              memberNode.property,
                                          )
                                          let openingBracket = tokens.pop()
                                          while (
                                              openingBracket &&
                                              !isOpeningBracketToken(
                                                  openingBracket,
                                              )
                                          ) {
                                              openingBracket = tokens.pop()
                                          }
                                          if (!openingBracket) {
                                              // unknown ast
                                              return null
                                          }
                                          return fixer.replaceTextRange(
                                              [
                                                  openingBracket.range![0],
                                                  memberNode.range![1],
                                              ],
                                              `${
                                                  memberNode.optional ? "" : "."
                                              }groups.${cgNode.name}`,
                                          )
                                      }
                                    : null,
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
