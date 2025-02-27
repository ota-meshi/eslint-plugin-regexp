import type { ObjectOption } from "../types"
import type { RegExpContext, UnparsableRegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import type { ExpressionReference } from "../utils/ast-utils"
import {
    extractExpressionReferences,
    isKnownMethodCall,
} from "../utils/ast-utils"
import { createTypeTracker } from "../utils/type-tracker"

function parseOption(
    userOption:
        | {
              strictTypes?: boolean
          }
        | undefined,
) {
    let strictTypes = true
    if (userOption) {
        if (userOption.strictTypes != null) {
            strictTypes = userOption.strictTypes
        }
    }

    return {
        strictTypes,
    }
}

export default createRule("no-missing-g-flag", {
    meta: {
        docs: {
            description:
                "disallow missing `g` flag in patterns used in `String#matchAll` and `String#replaceAll`",
            category: "Possible Errors",
            recommended: true,
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
            missingGlobalFlag:
                "The pattern given to the argument of `String#{{method}}()` requires the `g` flag, but is missing it.",
        },
        type: "problem",
    },
    create(context) {
        const { strictTypes } = parseOption(context.options[0] as ObjectOption)
        const typeTracer = createTypeTracker(context)

        /** The logic of this rule */
        function visit(regexpContext: RegExpContext | UnparsableRegExpContext) {
            const { regexpNode, flags, flagsString } = regexpContext

            if (
                flags.global ||
                // We were unable to determine which flags were used.
                flagsString == null
            ) {
                return
            }

            for (const ref of extractExpressionReferences(
                regexpNode,
                context,
            )) {
                verifyExpressionReference(ref, regexpContext)
            }
        }

        function verifyExpressionReference(
            ref: ExpressionReference,
            {
                regexpNode,
                fixReplaceFlags,
                flagsString,
            }: RegExpContext | UnparsableRegExpContext,
        ): void {
            if (ref.type !== "argument") {
                // It is not used for function call arguments.
                return
            }
            const node = ref.callExpression
            if (
                // It is not specified in the first argument.
                node.arguments[0] !== ref.node ||
                // It is not replaceAll() and matchAll().
                !isKnownMethodCall(node, {
                    matchAll: 1,
                    replaceAll: 2,
                })
            ) {
                return
            }
            if (
                strictTypes
                    ? !typeTracer.isString(node.callee.object)
                    : !typeTracer.maybeString(node.callee.object)
            ) {
                // The callee object is not a string.
                return
            }
            context.report({
                node: ref.node,
                messageId: "missingGlobalFlag",
                data: {
                    method: node.callee.property.name,
                },
                fix: buildFixer(),
            })

            function buildFixer() {
                if (
                    node.arguments[0] !== regexpNode ||
                    ((regexpNode.type === "NewExpression" ||
                        regexpNode.type === "CallExpression") &&
                        regexpNode.arguments[1] &&
                        regexpNode.arguments[1].type !== "Literal")
                ) {
                    // It can only be safely auto-fixed if it is defined directly in the argument.
                    return null
                }
                return fixReplaceFlags(`${flagsString!}g`, false)
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor(regexpContext) {
                visit(regexpContext)
                return {}
            },
            visitInvalid: visit,
            visitUnknown: visit,
        })
    },
})
