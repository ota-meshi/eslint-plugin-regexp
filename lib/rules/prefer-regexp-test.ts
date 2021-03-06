import type * as ES from "estree"
import { hasSideEffect, isOpeningParenToken } from "eslint-utils"
import { createRule } from "../utils"
import { createTypeTracker } from "../utils/type-tracker"

// Inspired by https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/prefer-regexp-test.md
export default createRule("prefer-regexp-test", {
    meta: {
        docs: {
            description:
                "enforce that `RegExp#test` is used instead of `String#match` and `RegExp#exec`",
            recommended: false,
        },
        fixable: "code",
        schema: [],
        messages: {
            disallow:
                "Use the `RegExp#test()` method instead of `{{target}}`, if you need a boolean.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const sourceCode = context.getSourceCode()
        const typeTracer = createTypeTracker(context)

        return {
            CallExpression(node: ES.CallExpression) {
                if (node.arguments.length !== 1) {
                    return
                }
                if (
                    node.callee.type !== "MemberExpression" ||
                    node.callee.computed ||
                    node.callee.property.type !== "Identifier" ||
                    node.callee.object.type === "Super"
                ) {
                    return
                }
                if (
                    node.callee.property.name !== "match" &&
                    node.callee.property.name !== "exec"
                ) {
                    return
                }
                if (!isUseBoolean(node)) {
                    return
                }

                if (node.callee.property.name === "match") {
                    if (!typeTracer.isString(node.callee.object)) {
                        return
                    }
                    const memberExpr = node.callee
                    context.report({
                        node,
                        messageId: "disallow",
                        data: { target: "String#match" },
                        fix(fixer) {
                            if (
                                node.arguments.length !== 1 ||
                                hasSideEffect(memberExpr, sourceCode) ||
                                hasSideEffect(node.arguments[0], sourceCode)
                            ) {
                                return null
                            }
                            const openParen = sourceCode.getTokenAfter(
                                node.callee,
                                isOpeningParenToken,
                            )!
                            const closeParen = sourceCode.getLastToken(node)!
                            const stringRange = memberExpr.object.range!
                            const regexpRange: [number, number] = [
                                openParen.range[1],
                                closeParen.range[0],
                            ]
                            const stringText = sourceCode.text.slice(
                                ...stringRange,
                            )
                            const regexpText = sourceCode.text.slice(
                                ...regexpRange,
                            )
                            return [
                                fixer.replaceTextRange(stringRange, regexpText),
                                fixer.replaceText(memberExpr.property, "test"),
                                fixer.replaceTextRange(regexpRange, stringText),
                            ]
                        },
                    })
                }
                if (node.callee.property.name === "exec") {
                    if (!typeTracer.isRegExp(node.callee.object)) {
                        return
                    }
                    const execNode = node.callee.property
                    context.report({
                        node: execNode,
                        messageId: "disallow",
                        data: { target: "RegExp#exec" },
                        fix: (fixer) => fixer.replaceText(execNode, "test"),
                    })
                }
            },
        }
    },
})

/** Checks if the given node is use boolean. */
function isUseBoolean(node: ES.Expression): boolean {
    const parent = getParent(node)
    if (!parent) {
        return false
    }
    if (parent.type === "UnaryExpression") {
        // e.g. !expr
        return parent.operator === "!"
    }
    if (parent.type === "CallExpression") {
        // e.g. Boolean(expr)
        return (
            parent.callee.type === "Identifier" &&
            parent.callee.name === "Boolean" &&
            parent.arguments[0] === node
        )
    }
    if (
        parent.type === "IfStatement" ||
        parent.type === "ConditionalExpression" ||
        parent.type === "WhileStatement" ||
        parent.type === "DoWhileStatement" ||
        parent.type === "ForStatement"
    ) {
        // e.g. if (expr) {}
        return parent.test === node
    }
    if (parent.type === "LogicalExpression") {
        if (parent.operator === "&&" || parent.operator === "||") {
            // e.g. Boolean(expr1 || expr2)
            return isUseBoolean(parent)
        }
    }
    return false
}

/** Get a parent node */
function getParent<E extends ES.Node>(node: ES.Node | null): E | null {
    if (!node) {
        return null
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
    return (node as any).parent
}
