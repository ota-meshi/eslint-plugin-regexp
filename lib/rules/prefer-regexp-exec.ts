import type {
    AssignmentExpression,
    CallExpression,
    ClassBody,
    Expression,
    MemberExpression,
    Node,
    UpdateExpression,
} from "estree"
import {
    getParent,
    getStaticValue,
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

        return {
            CallExpression(node: CallExpression) {
                if (!isKnownMethodCall(node, { match: 1 })) {
                    return
                }
                const arg = node.arguments[0]
                const evaluated = getStaticRegExpValue(context, arg)
                if (
                    evaluated &&
                    evaluated.value instanceof RegExp &&
                    evaluated.value.flags.includes("g")
                ) {
                    return
                }
                if (!evaluated && typeTracer.isRegExp(arg)) {
                    // The global flag is unknown, so `String#match` may not
                    // be equivalent to `RegExp#exec`.
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

type ClassFieldName = {
    type: "Identifier" | "PrivateIdentifier"
    name: string
}

type ClassElement = ClassBody["body"][number]
type ReadonlyPropertyDefinition = Extract<
    ClassElement,
    { type: "PropertyDefinition" }
> & { readonly?: boolean }
type FieldWrite = AssignmentExpression | UpdateExpression

/**
 * Gets a RegExp value whose flags can be determined without executing code.
 *
 * In addition to regular static values, this supports direct reads of stable
 * readonly instance fields initialized either at their declaration or by one
 * direct constructor assignment. Mutable and ambiguous fields remain unknown.
 */
function getStaticRegExpValue(
    context: Parameters<typeof getStaticValue>[0],
    node: Expression,
) {
    const evaluated = getStaticValue(context, node)
    // eslint-utils can return `{ value: undefined }` for an unresolved read.
    // Treat that as unknown instead of as a usable static value.
    if (evaluated && evaluated.value !== undefined) {
        return evaluated
    }

    if (node.type !== "MemberExpression") {
        return null
    }
    const fieldName = getThisFieldName(node)
    if (!fieldName) {
        return null
    }

    const classBody = getEnclosingClassBody(node)
    if (!classBody) {
        return null
    }
    if (isInStaticClassElement(node, classBody)) {
        return null
    }
    const property = findReadonlyProperty(classBody, fieldName)
    if (!property) {
        return null
    }

    const writes = getFieldWrites(context, classBody, fieldName)
    if (property.value) {
        if (writes.length) {
            return null
        }
        return getStaticValue(context, property.value)
    }

    if (writes.length !== 1) {
        return null
    }
    const [write] = writes
    if (
        write.type !== "AssignmentExpression" ||
        write.operator !== "=" ||
        !isDirectConstructorAssignment(write, classBody)
    ) {
        return null
    }
    return getStaticValue(context, write.right)
}

function isInStaticClassElement(node: Node, classBody: ClassBody): boolean {
    let current = node
    while (getParent(current) !== classBody) {
        const parent = getParent(current)
        if (!parent) {
            return false
        }
        current = parent
    }

    return (
        ("static" in current && current.static === true) ||
        current.type === "StaticBlock"
    )
}

function getThisFieldName(node: MemberExpression): ClassFieldName | null {
    if (node.computed || node.object.type !== "ThisExpression") {
        return null
    }
    if (
        node.property.type !== "Identifier" &&
        node.property.type !== "PrivateIdentifier"
    ) {
        return null
    }
    return {
        type: node.property.type,
        name: node.property.name,
    }
}

function findReadonlyProperty(
    classBody: ClassBody,
    fieldName: ClassFieldName,
): ReadonlyPropertyDefinition | null {
    for (const element of classBody.body) {
        if (element.type !== "PropertyDefinition") {
            continue
        }
        const property = element as ReadonlyPropertyDefinition
        if (
            property.static ||
            property.computed ||
            property.readonly !== true ||
            !isSameFieldKey(property.key, fieldName)
        ) {
            continue
        }
        return property
    }
    return null
}

function isSameFieldKey(
    key: ReadonlyPropertyDefinition["key"],
    fieldName: ClassFieldName,
): boolean {
    if (key.type !== "Identifier" && key.type !== "PrivateIdentifier") {
        return false
    }
    return key.type === fieldName.type && key.name === fieldName.name
}

function getFieldWrites(
    context: Parameters<typeof getStaticValue>[0],
    classBody: ClassBody,
    fieldName: ClassFieldName,
): FieldWrite[] {
    const writes: FieldWrite[] = []
    const stack: Node[] = [classBody]

    while (stack.length) {
        const current = stack.pop()!

        if (
            current !== classBody &&
            (current.type === "ClassDeclaration" ||
                current.type === "ClassExpression")
        ) {
            continue
        }
        if (
            current.type === "FunctionDeclaration" ||
            current.type === "FunctionExpression"
        ) {
            const parent = getParent(current)
            if (
                parent?.type !== "MethodDefinition" ||
                getParent(parent) !== classBody
            ) {
                continue
            }
        }

        if (
            current.type === "AssignmentExpression" &&
            current.left.type === "MemberExpression" &&
            isSameThisField(current.left, fieldName)
        ) {
            writes.push(current)
        } else if (
            current.type === "UpdateExpression" &&
            current.argument.type === "MemberExpression" &&
            isSameThisField(current.argument, fieldName)
        ) {
            writes.push(current)
        }

        const keys = context.sourceCode.visitorKeys[current.type] ?? []
        for (const key of keys) {
            const value = (current as unknown as Record<string, unknown>)[key]
            if (Array.isArray(value)) {
                for (const child of value) {
                    if (isNode(child)) {
                        stack.push(child)
                    }
                }
            } else if (isNode(value)) {
                stack.push(value)
            }
        }
    }

    return writes
}

function isSameThisField(
    node: MemberExpression,
    fieldName: ClassFieldName,
): boolean {
    const candidate = getThisFieldName(node)
    return (
        candidate?.type === fieldName.type && candidate.name === fieldName.name
    )
}

function isDirectConstructorAssignment(
    assignment: AssignmentExpression,
    classBody: ClassBody,
): boolean {
    const statement = getParent(assignment)
    if (statement?.type !== "ExpressionStatement") {
        return false
    }
    const block = getParent(statement)
    if (block?.type !== "BlockStatement") {
        return false
    }
    const constructorFunction = getParent(block)
    if (constructorFunction?.type !== "FunctionExpression") {
        return false
    }
    const method = getParent(constructorFunction)
    return (
        method?.type === "MethodDefinition" &&
        method.kind === "constructor" &&
        getParent(method) === classBody
    )
}

function isNode(value: unknown): value is Node {
    return (
        typeof value === "object" &&
        value !== null &&
        "type" in value &&
        typeof (value as { type?: unknown }).type === "string"
    )
}

function getEnclosingClassBody(node: Node): ClassBody | null {
    let current: Node | null = node
    while ((current = getParent(current))) {
        if (current.type === "ClassBody") {
            return current
        }
        if (
            (current.type === "FunctionExpression" ||
                current.type === "FunctionDeclaration") &&
            getParent(current)?.type !== "MethodDefinition"
        ) {
            return null
        }
    }
    return null
}
