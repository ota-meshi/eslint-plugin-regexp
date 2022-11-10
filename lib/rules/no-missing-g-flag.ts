import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import type { ExpressionReference } from "../utils/ast-utils"
import {
    extractExpressionReferences,
    isKnownMethodCall,
} from "../utils/ast-utils"
import { createTypeTracker } from "../utils/type-tracker"

/**
 * Parse option
 */
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
            // TODO Switch to recommended in the major version.
            // recommended: true,
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
            missingGlobalFlag:
                "The pattern given to the argument of `String#{{method}}()` requires the `g` flag, but is missing it.",
        },
        type: "problem",
    },
    create(context) {
        const { strictTypes } = parseOption(context.options[0])
        const typeTracer = createTypeTracker(context)

        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { regexpNode, flags, ownsFlags } = regexpContext

            if (flags.global || !ownsFlags) {
                return {}
            }

            for (const ref of extractExpressionReferences(
                regexpNode,
                context,
            )) {
                verifyExpressionReference(ref, regexpContext)
            }
            return {}
        }

        /**
         * Verify RegExp reference
         */
        function verifyExpressionReference(
            ref: ExpressionReference,
            { regexpNode, fixReplaceFlags, flagsString }: RegExpContext,
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

            /** Build fixer */
            function buildFixer() {
                if (node.arguments[0] !== regexpNode) {
                    // It can only be safely auto-fixed if it is defined directly in the argument.
                    return null
                }
                return fixReplaceFlags(`${flagsString || ""}g`, false)
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})