import type { Rule } from "eslint"
import type * as TS from "typescript"
import type * as ES from "estree"
import { findVariable, getPropertyName, isParenthesized } from "./utils"
import type { TypeInfo, NamedType, OtherTypeName } from "./type-data"
import {
    UNKNOWN_ARRAY,
    UNKNOWN_OBJECT,
    TypeArray,
    TypeObject,
    UNKNOWN_FUNCTION,
    BI_OPERATOR_TYPES,
    UN_OPERATOR_TYPES,
    GLOBAL_FACTORY_FUNCTIONS,
    PROTO_TYPES,
    GLOBAL_FACTORIES,
    GLOBAL_FACTORY_TYPES,
    GLOBAL_OBJECTS_PROP_TYPES,
    TypeUnionOrIntersection,
    isTypeClass,
} from "./type-data"
import { getJSDoc, parseTypeText } from "./jsdoc"
import type { JSDocTypeNode } from "./jsdoc/jsdoctypeparser-ast"

// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- ignore
const ts: typeof import("typescript") = (() => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports -- ignore
        return require("typescript")
    } catch (e) {
        if (e.code === "MODULE_NOT_FOUND") {
            return undefined
        }
        throw e
    }
})()

type TypeTracker = {
    isString: (node: ES.Expression) => boolean
    getTypes: (node: ES.Expression) => string[]
}

const cacheTypeTracker = new WeakMap<ES.Program, TypeTracker>()

/**
 * Create Type tracker
 */
export function createTypeTracker(context: Rule.RuleContext): TypeTracker {
    const programNode = context.getSourceCode().ast
    const cache = cacheTypeTracker.get(programNode)
    if (cache) {
        return cache
    }

    const tsNodeMap: ReadonlyMap<unknown, TS.Node> =
        context.parserServices.esTreeNodeToTSNodeMap
    const checker: TS.TypeChecker =
        context.parserServices.program &&
        context.parserServices.program.getTypeChecker()
    const availableTS = Boolean(ts && tsNodeMap && checker)

    const cacheTypeInfo = new WeakMap<ES.Expression, TypeInfo | null>()

    const tracker: TypeTracker = {
        isString,
        getTypes,
    }
    cacheTypeTracker.set(programNode, tracker)
    return tracker

    /**
     * Checks if the given node is string.
     */
    function isString(node: ES.Expression): boolean {
        return hasType(getType(node), "String")
    }

    /**
     * Get the type names from given node.
     */
    function getTypes(node: ES.Expression): string[] {
        const result = getType(node)
        if (result == null) {
            return []
        }
        if (typeof result === "string") {
            return [result]
        }
        if (typeof result === "function" || typeof result === "symbol") {
            return ["Function"]
        }
        return result.typeNames()
    }

    /**
     * Get the type name from given node.
     */
    function getType(node: ES.Expression): TypeInfo | null {
        if (cacheTypeInfo.has(node)) {
            return cacheTypeInfo.get(node) ?? null
        }
        try {
            const type = getTypeWithoutCache(node)
            cacheTypeInfo.set(node, type)
            return type
        } catch {
            // ignore
            return null
        }
    }

    /* eslint-disable complexity -- ignore */
    /**
     * Get the type name from given node.
     */
    function getTypeWithoutCache(
        /* eslint-enable complexity -- ignore */
        node: ES.Expression,
    ): TypeInfo | null {
        if (node.type === "Literal") {
            if (typeof node.value === "string") {
                return "String"
            }
            if (typeof node.value === "boolean") {
                return "Boolean"
            }
            if (typeof node.value === "number") {
                return "Number"
            }
            if ("regex" in node && node.regex) {
                return "RegExp"
            }
            if (
                "bigint" in node &&
                // @ts-expect-error -- types is out of date.
                node.bigint
            ) {
                return "BigInt"
            }
            if (node.value == null) {
                return "null"
            }
        } else if (node.type === "TemplateLiteral") {
            return "String"
        }

        if (availableTS) {
            return getTypeByTs(node)
        }

        const jsdoc = getJSDoc(node, context)
        if (jsdoc) {
            if (isParenthesized(context, node)) {
                const typeText = jsdoc.getTag("type")?.type
                if (typeText) {
                    const type = jsDocTypeNodeToTypeInfo(
                        parseTypeText(typeText),
                    )
                    if (type) {
                        return type
                    }
                }
            }
        }

        if (
            node.type === "ArrowFunctionExpression" ||
            node.type === "FunctionExpression"
        ) {
            if (jsdoc) {
                const typeText = (
                    jsdoc.getTag("returns") ?? jsdoc.getTag("return")
                )?.type
                if (typeText) {
                    const type = jsDocTypeNodeToTypeInfo(
                        parseTypeText(typeText),
                    )
                    return () => type
                }
            }
            return UNKNOWN_FUNCTION
        }

        if (node.type === "ArrayExpression") {
            return new TypeArray(function* () {
                for (const element of node.elements) {
                    if (!element) {
                        continue
                    }
                    if (element.type !== "SpreadElement") {
                        const type = getType(element)
                        if (type) {
                            yield type
                        }
                    } else {
                        const argType = getType(element.argument)
                        if (isTypeClass(argType) && argType.type === "Array") {
                            const type = argType.paramType(0)
                            if (type) {
                                yield type
                            }
                        }
                    }
                }
            })
        } else if (node.type === "ObjectExpression") {
            return new TypeObject(function* (): IterableIterator<
                [string, () => TypeInfo | null]
            > {
                for (
                    let index = node.properties.length - 1;
                    index >= 0;
                    index--
                ) {
                    const property = node.properties[index]
                    if (property.type !== "SpreadElement") {
                        if (
                            property.value.type === "ObjectPattern" ||
                            property.value.type === "ArrayPattern" ||
                            property.value.type === "RestElement" ||
                            property.value.type === "AssignmentPattern"
                        )
                            // type bug?
                            continue
                        const name = getPropertyName(context, property)
                        if (name != null) {
                            const value = property.value
                            yield [name, () => getType(value)]
                        }
                    } else {
                        const spreadType = getType(property.argument)
                        if (
                            isTypeClass(spreadType) &&
                            spreadType.type === "Object"
                        ) {
                            yield* spreadType.allProperties()
                        }
                    }
                }
            })
        } else if (node.type === "BinaryExpression") {
            if (node.operator === "+") {
                const left = getType(node.left)
                const right = getType(node.right)
                if (hasType(left, "String") || hasType(right, "String")) {
                    return "String"
                }
                if (hasType(left, "Number") && hasType(right, "Number")) {
                    return "Number"
                }
            } else {
                const type = BI_OPERATOR_TYPES[node.operator]
                if (type) {
                    return type
                }
            }
        } else if (node.type === "UnaryExpression") {
            const type = UN_OPERATOR_TYPES[node.operator]
            if (type) {
                return type
            }
        } else if (node.type === "AssignmentExpression") {
            return getType(node.right)
        } else if (node.type === "SequenceExpression") {
            return getType(node.expressions[node.expressions.length - 1])
        } else if (node.type === "ChainExpression") {
            return getType(node.expression)
        } else if (node.type === "ClassExpression") {
            return null
        } else if (node.type === "Identifier") {
            const variable = findVariable(context, node)
            if (variable) {
                if (variable.defs.length === 1) {
                    const def = variable.defs[0]
                    if (def.type === "Variable") {
                        const idJsdoc = getJSDoc(def.node, context)
                        if (idJsdoc) {
                            const typeText = idJsdoc.getTag("type")?.type
                            if (typeText) {
                                const type = jsDocTypeNodeToTypeInfo(
                                    parseTypeText(typeText),
                                )
                                if (type) {
                                    return type
                                }
                            }

                            // TODO callback
                        }
                        if (def.parent.kind === "const" && def.node.init) {
                            const type = getType(def.node.init)
                            if (type) {
                                return type
                            }
                        }
                    } else if (def.type === "Parameter") {
                        const fnJsdoc = getJSDoc(def.node, context)
                        if (fnJsdoc) {
                            const jsdocParams = fnJsdoc.parseParams()
                            if (!jsdocParams.isEmpty()) {
                                const typeText = jsdocParams.get(
                                    getParamPath(
                                        def.name.name,
                                        def.name,
                                        context,
                                    ),
                                )?.type
                                if (typeText) {
                                    const type = jsDocTypeNodeToTypeInfo(
                                        parseTypeText(typeText),
                                    )
                                    if (type) {
                                        return type
                                    }
                                }
                            }
                        }
                    }
                } else if (variable.defs.length === 0) {
                    // globals
                    const type =
                        GLOBAL_FACTORIES[node.name] ||
                        GLOBAL_FACTORY_FUNCTIONS[node.name]
                    if (type) {
                        return type
                    }
                }
            }
        } else if (node.type === "NewExpression") {
            if (node.callee.type !== "Super") {
                const type = getType(node.callee)
                if (typeof type === "symbol") {
                    return GLOBAL_FACTORY_TYPES[type]
                }
            }
        } else if (
            node.type === "CallExpression" ||
            node.type === "TaggedTemplateExpression"
        ) {
            const argTypes: ((() => TypeInfo | null) | null)[] = []
            if (node.type === "CallExpression") {
                for (const arg of node.arguments) {
                    argTypes.push(
                        arg.type === "SpreadElement"
                            ? null
                            : () => {
                                  return getType(arg)
                              },
                    )
                }
            }

            const callee =
                node.type === "CallExpression" ? node.callee : node.tag
            if (callee.type === "Identifier") {
                const type = getType(callee)
                if (typeof type === "function") {
                    return type(null, argTypes)
                }
                if (typeof type === "symbol") {
                    return GLOBAL_FACTORY_TYPES[type]
                }
            } else if (callee.type === "MemberExpression") {
                const mem = callee
                if (mem.object.type !== "Super") {
                    let propertyName: string | null = null
                    if (!mem.computed) {
                        if (mem.property.type === "Identifier") {
                            propertyName = mem.property.name
                        }
                    } else {
                        // computed
                        const propertyType = getType(mem.property)
                        if (hasType(propertyType, "Number")) {
                            propertyName = "0"
                        }
                    }
                    if (propertyName != null) {
                        if (
                            propertyName === "toString" ||
                            propertyName === "toLocaleString"
                        ) {
                            return "String"
                        }
                        const objectType = getType(mem.object)
                        if (typeof objectType === "symbol") {
                            const propTypes =
                                GLOBAL_OBJECTS_PROP_TYPES[objectType]
                            if (propTypes) {
                                const type = propTypes[propertyName]
                                if (typeof type === "function") {
                                    return type(null, argTypes)
                                }
                            }
                        }
                        for (const [checkType, protoTypes] of PROTO_TYPES) {
                            if (protoTypes && hasType(objectType, checkType)) {
                                const type = protoTypes[propertyName]
                                if (typeof type === "function") {
                                    return type(() => objectType, argTypes)
                                }
                            }
                        }
                        if (isTypeClass(objectType)) {
                            const type = objectType.property(propertyName)
                            if (typeof type === "function") {
                                return type(() => objectType, argTypes)
                            }
                        }
                    }
                }
            }
        } else if (node.type === "MemberExpression") {
            if (node.object.type !== "Super") {
                let propertyName: string | null = null
                if (!node.computed) {
                    if (node.property.type === "Identifier") {
                        propertyName = node.property.name
                    }
                } else {
                    // computed
                    const propertyType = getType(node.property)
                    if (hasType(propertyType, "Number")) {
                        propertyName = "0"
                    }
                }
                if (propertyName != null) {
                    const objectType = getType(node.object)
                    for (const [checkType, protoTypes] of PROTO_TYPES) {
                        if (protoTypes && hasType(objectType, checkType)) {
                            const type = protoTypes[propertyName]
                            if (type) {
                                return type
                            }
                        }
                    }
                    if (isTypeClass(objectType)) {
                        const type = objectType.property(propertyName)
                        if (type) {
                            return type
                        }
                    }
                }
            }
        }

        return availableTS ? getTypeByTs(node) : null
    }

    /**
     * Get type from given node by ts types.
     */
    function getTypeByTs(node: ES.Expression): TypeInfo | null {
        const tsNode = tsNodeMap.get(node)
        const tsType = (tsNode && checker.getTypeAtLocation(tsNode)) || null
        return tsType && getTypeFromTsType(tsType)
    }

    /**
     * Check if the name of the given type is expected or not.
     */
    function getTypeFromTsType(tsType: TS.Type): TypeInfo | null {
        if ((tsType.flags & ts.TypeFlags.StringLike) !== 0) {
            return "String"
        }
        if ((tsType.flags & ts.TypeFlags.NumberLike) !== 0) {
            return "Number"
        }
        if ((tsType.flags & ts.TypeFlags.BooleanLike) !== 0) {
            return "Boolean"
        }
        if ((tsType.flags & ts.TypeFlags.BigIntLike) !== 0) {
            return "BigInt"
        }
        if (
            (tsType.flags & ts.TypeFlags.Any) !== 0 ||
            (tsType.flags & ts.TypeFlags.Unknown) !== 0
        ) {
            return null
        }
        if (isArrayLikeObject(tsType)) {
            return UNKNOWN_ARRAY
        }

        if (isReferenceObject(tsType) && tsType.target !== tsType) {
            return getTypeFromTsType(tsType.target)
        }
        if ((tsType.flags & ts.TypeFlags.TypeParameter) !== 0) {
            const constraintType = getConstraintType(tsType)
            if (constraintType) {
                return getTypeFromTsType(constraintType)
            }
            return null
        }
        if (isUnionOrIntersection(tsType)) {
            return new TypeUnionOrIntersection(function* () {
                for (const t of tsType.types) {
                    const tn = getTypeFromTsType(t)
                    if (tn) {
                        yield tn
                    }
                }
            })
        }

        if (isClassOrInterface(tsType)) {
            const name = tsType.symbol.escapedName
            return (/^Readonly(.*)/.exec(name as string)?.[1] ??
                name) as TypeInfo
        }
        if (isObject(tsType)) {
            return UNKNOWN_OBJECT
        }
        return checker.typeToString(tsType) as TypeInfo
    }

    /**
     * Get the constraint type of a given type parameter type if exists.
     */
    function getConstraintType(tsType: TS.Type) {
        const symbol = tsType.symbol
        const declarations = symbol && symbol.declarations
        const declaration = declarations && declarations[0]
        if (
            ts.isTypeParameterDeclaration(declaration) &&
            declaration.constraint != null
        ) {
            return checker.getTypeFromTypeNode(declaration.constraint)
        }
        return undefined
    }
}

/**
 * Checks if the result has the given type.
 */
function hasType(result: TypeInfo | null, type: NamedType | OtherTypeName) {
    if (result == null) {
        return false
    }
    if (typeof result === "string") {
        return result === type
    }
    if (typeof result === "function" || typeof result === "symbol") {
        return type === "Function"
    }
    return result.has(type)
}

/**
 * Check if a given type is an array-like type or not.
 */
function isArrayLikeObject(tsType: TS.Type) {
    return (
        isObject(tsType) &&
        (tsType.objectFlags &
            (ts.ObjectFlags.ArrayLiteral |
                ts.ObjectFlags.EvolvingArray |
                ts.ObjectFlags.Tuple)) !==
            0
    )
}

/**
 * Check if a given type is an interface type or not.
 */
function isClassOrInterface(tsType: TS.Type): tsType is TS.InterfaceType {
    return (
        isObject(tsType) &&
        (tsType.objectFlags & ts.ObjectFlags.ClassOrInterface) !== 0
    )
}

/**
 * Check if a given type is an object type or not.
 */
function isObject(tsType: TS.Type): tsType is TS.ObjectType {
    return (tsType.flags & ts.TypeFlags.Object) !== 0
}

/**
 * Check if a given type is a reference type or not.
 */
function isReferenceObject(tsType: TS.Type): tsType is TS.TypeReference {
    return (
        isObject(tsType) &&
        (tsType.objectFlags & ts.ObjectFlags.Reference) !== 0
    )
}

/**
 * Check if a given type is a union-or-intersection type or not.
 */
function isUnionOrIntersection(
    tsType: TS.Type,
): tsType is TS.UnionOrIntersectionType {
    return (tsType.flags & ts.TypeFlags.UnionOrIntersection) !== 0
}

/* eslint-disable complexity -- X-( */
/** Get type from JSDocTypeNode */
function jsDocTypeNodeToTypeInfo(
    /* eslint-enable complexity -- X-( */
    node: JSDocTypeNode | null,
): TypeInfo | null {
    if (node == null) {
        return null
    }
    if (node.type === "NAME") {
        return typeNameToTypeInfo(node.name)
    }
    if (node.type === "STRING_VALUE") {
        return "String"
    }
    if (node.type === "NUMBER_VALUE") {
        return "Number"
    }
    if (
        node.type === "OPTIONAL" ||
        node.type === "NULLABLE" ||
        node.type === "NOT_NULLABLE" ||
        node.type === "PARENTHESIS"
    ) {
        return jsDocTypeNodeToTypeInfo(node.value)
    }
    if (node.type === "VARIADIC") {
        return new TypeArray(function* () {
            if (node.value) {
                const t = jsDocTypeNodeToTypeInfo(node.value)
                if (t) {
                    yield t
                }
            }
        })
    }
    if (node.type === "UNION" || node.type === "INTERSECTION") {
        return new TypeUnionOrIntersection(function* () {
            const left = jsDocTypeNodeToTypeInfo(node.left)
            if (left) {
                yield left
            }
            const right = jsDocTypeNodeToTypeInfo(node.right)
            if (right) {
                yield right
            }
        })
    }
    if (node.type === "GENERIC") {
        if (node.subject.type === "NAME" && node.subject.name === "Record") {
            return new TypeObject()
        }

        const subject = jsDocTypeNodeToTypeInfo(node.subject)
        if (hasType(subject, "Array")) {
            return new TypeArray(function* () {
                const param = node.objects[0]
                if (!param) {
                    return
                }
                const paramType = jsDocTypeNodeToTypeInfo(param)
                if (paramType) {
                    yield paramType
                }
            })
        }
        return subject
    }
    if (node.type === "RECORD") {
        return new TypeObject(function* () {
            for (const entry of node.entries) {
                yield [entry.key, () => jsDocTypeNodeToTypeInfo(entry.value)]
            }
        })
    }
    if (node.type === "ANY" || node.type === "UNKNOWN") {
        return null
    }
    if (
        node.type === "MEMBER" ||
        node.type === "INNER_MEMBER" ||
        node.type === "INSTANCE_MEMBER" ||
        node.type === "EXTERNAL" ||
        node.type === "FILE_PATH" ||
        node.type === "MODULE"
    ) {
        return null
    }

    return null
}

/** Get type from type name */
function typeNameToTypeInfo(name: string): TypeInfo | null {
    if (name === "String" || name === "string") {
        return "String"
    }
    if (name === "Number" || name === "number") {
        return "Number"
    }
    if (name === "Boolean" || name === "boolean") {
        return "Boolean"
    }
    if (name === "BigInt" || name === "bigint") {
        return "BigInt"
    }
    if (name === "RegExp") {
        return "RegExp"
    }
    if (name === "Array") {
        return UNKNOWN_ARRAY
    }
    if (name === "Function" || name === "function") {
        return UNKNOWN_FUNCTION
    }
    if (name === "Object" || name === "object") {
        return UNKNOWN_OBJECT
    }
    return null
}

/**
 * Get function param path for param node
 */
function getParamPath(
    name: string | null,
    node:
        | ES.Identifier
        | ES.AssignmentPattern
        | ES.ArrayPattern
        | ES.ObjectPattern
        | ES.RestElement,
    context: Rule.RuleContext,
): { name: string | null; index: number | null }[] {
    const parent: ES.Pattern | ES.AssignmentProperty | ES.Function =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
        (node as any).parent
    if (!parent) {
        return [{ name, index: null }]
    }
    if (
        parent.type === "FunctionDeclaration" ||
        parent.type === "ArrowFunctionExpression" ||
        parent.type === "FunctionExpression"
    ) {
        return [{ name, index: parent.params.indexOf(node) }]
    }
    if (parent.type === "AssignmentPattern") {
        return getParamPath(name, parent, context)
    }
    if (parent.type === "ArrayPattern") {
        const path = {
            name,
            index: parent.elements.indexOf(node),
        }
        return getParamPath(null, parent, context).concat([path])
    }
    if (parent.type === "Property") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ignore
        const object: ES.ObjectPattern = (parent as any).parent

        const path = {
            name: getPropertyName(context, parent),
            index: object.properties.indexOf(parent),
        }
        return getParamPath(null, object, context).concat([path])
    }
    if (parent.type === "RestElement") {
        return getParamPath(name, parent, context)
    }
    return [{ name, index: null }]
}
