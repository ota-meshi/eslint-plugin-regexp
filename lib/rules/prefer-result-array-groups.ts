import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { Expression, Super } from "estree"
import type * as TS from "typescript"
import type { ObjectOption } from "../types.ts"
import type { RegExpContext } from "../utils/index.ts"
import { createRule, defineRegexpVisitor } from "../utils/index.ts"
import {
    getTypeScriptTools,
    isAny,
    isClassOrInterface,
    isUnionOrIntersection,
    isNull,
} from "../utils/ts-util.ts"
import { isOpeningBracketToken } from "@eslint-community/eslint-utils"

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
            unexpected:
                "Unexpected indexed access for the named capturing group '{{ name }}' from regexp result array.",
        },
        type: "suggestion",
    },
    create(context) {
        const strictTypes =
            (context.options[0] as ObjectOption)?.strictTypes ?? true
        const sourceCode = context.sourceCode

        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { getAllCapturingGroups, getCapturingGroupReferences } =
                regexpContext

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
                            data: {
                                name: cgNode.name,
                            },
                            fix:
                                memberNode && memberNode.computed
                                    ? (fixer) => {
                                          const tokens =
                                              sourceCode.getTokensBetween(
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

                                          const kind = getRegExpArrayTypeKind(
                                              memberNode.object,
                                          )
                                          if (kind === "unknown") {
                                              // Using TypeScript but I can't identify the type or it's not a RegExpXArray type.
                                              return null
                                          }
                                          const needNonNull =
                                              kind === "RegExpXArray"

                                          return fixer.replaceTextRange(
                                              [
                                                  openingBracket.range[0],
                                                  memberNode.range![1],
                                              ],
                                              `${
                                                  memberNode.optional ? "" : "."
                                              }groups${
                                                  needNonNull ? "!" : ""
                                              }.${cgNode.name}`,
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

        type RegExpArrayTypeKind =
            | "RegExpXArray" // RegExpMatchArray or RegExpExecArray
            | "any"
            | "unknown" // It's cannot autofix

        /** Gets the type kind of the given node. */
        function getRegExpArrayTypeKind(
            node: Expression | Super,
        ): RegExpArrayTypeKind | null {
            const { tsNodeMap, checker, usedTS, hasFullTypeInformation } =
                getTypeScriptTools(context)
            if (!usedTS) {
                // Not using TypeScript.
                return null
            }
            if (!hasFullTypeInformation) {
                // The user has not given the type information to ESLint. So we don't know if this can be autofix.
                return "unknown"
            }
            const tsNode = tsNodeMap.get(node)
            const tsType =
                (tsNode && checker?.getTypeAtLocation(tsNode)) || null
            if (!tsType) {
                // The node type cannot be determined.
                return "unknown"
            }

            if (isAny(tsType)) {
                return "any"
            }
            if (isRegExpMatchArrayOrRegExpExecArray(tsType)) {
                return "RegExpXArray"
            }
            if (isUnionOrIntersection(tsType)) {
                if (
                    tsType.types.every(
                        (t) =>
                            isRegExpMatchArrayOrRegExpExecArray(t) || isNull(t),
                    )
                ) {
                    // e.g. (RegExpExecArray | null)
                    return "RegExpXArray"
                }
            }
            return "unknown"
        }

        /** Checks whether given type is RegExpMatchArray or RegExpExecArray or not */
        function isRegExpMatchArrayOrRegExpExecArray(tsType: TS.Type) {
            if (isClassOrInterface(tsType)) {
                const name = tsType.symbol.escapedName
                return name === "RegExpMatchArray" || name === "RegExpExecArray"
            }
            return false
        }
    },
})
