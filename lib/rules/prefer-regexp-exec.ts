import type { CallExpression, Expression } from "estree"
import {
    findVariable,
    getStaticValue,
    getStringIfConstant,
    isKnownMethodCall,
} from "../utils/ast-utils/index.ts"
import { createRule } from "../utils/index.ts"
import { createTypeTracker } from "../utils/type-tracker/index.ts"

// Inspired by https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/prefer-regexp-exec.md
export default createRule("prefer-regexp-exec", {
    meta: {
        docs: {
            description:
                "enforce that `RegExp#exec` is used instead of `String#match` if no global flag is provided",
            category: "Best Practices",
            recommended: false,
        },
        schema: [],
        messages: {
            disallow: "Use the `RegExp#exec()` method instead.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const typeTracer = createTypeTracker(context)

        /**
         * Checks whether the given expression is a reference to the global `RegExp`.
         */
        function isGlobalRegExpReference(node: Expression): boolean {
            if (node.type !== "Identifier" || node.name !== "RegExp") {
                return false
            }
            const variable = findVariable(context, node)
            return variable == null || variable.defs.length === 0
        }

        /**
         * Gets the flags of the regular expression that the given argument of
         * `String#match()` is converted into, or `null` if they cannot be
         * determined statically.
         */
        function getKnownFlags(node: Expression): string | null {
            const evaluated = getStaticValue(context, node)
            if (evaluated) {
                if (evaluated.value instanceof RegExp) {
                    return evaluated.value.flags
                }
                if (
                    evaluated.value != null &&
                    (typeof evaluated.value === "object" ||
                        typeof evaluated.value === "function")
                ) {
                    // The object may have its own `Symbol.match` method.
                    return null
                }
                // A primitive is converted into a regular expression without flags.
                return ""
            }

            if (
                (node.type === "NewExpression" ||
                    node.type === "CallExpression") &&
                node.callee.type !== "Super" &&
                isGlobalRegExpReference(node.callee)
            ) {
                const [patternArg, flagsArg] = node.arguments
                if (flagsArg) {
                    if (flagsArg.type === "SpreadElement") {
                        return null
                    }
                    // The flags argument takes precedence over the flags of the pattern.
                    return getStringIfConstant(context, flagsArg)
                }
                if (
                    patternArg &&
                    // `new RegExp(re)` copies the flags of `re`, so the pattern
                    // has to be known not to be a `RegExp` object itself.
                    !(
                        patternArg.type !== "SpreadElement" &&
                        typeTracer.isString(patternArg)
                    )
                ) {
                    return null
                }
                return ""
            }

            return null
        }

        return {
            CallExpression(node: CallExpression) {
                if (!isKnownMethodCall(node, { match: 1 })) {
                    return
                }
                const flags = getKnownFlags(node.arguments[0])
                if (flags == null || flags.includes("g")) {
                    // Unless we know that the regular expression is non-global,
                    // `RegExp#exec()` may not be equivalent.
                    return
                }
                if (!typeTracer.isString(node.callee.object)) {
                    return
                }
                context.report({
                    node,
                    messageId: "disallow",
                })
            },
        }
    },
})
