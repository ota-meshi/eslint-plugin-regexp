import type { Rule } from "eslint"
import type * as TS from "typescript"
import type * as ES from "estree"
import { findVariable, getPropertyName } from "./utils"
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
        const type = getTypeWithoutCache(node)
        cacheTypeInfo.set(node, type)
        return type
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

        if (
            node.type === "ArrowFunctionExpression" ||
            node.type === "FunctionExpression"
        ) {
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
                    if (
                        def.type === "Variable" &&
                        def.parent.kind === "const" &&
                        def.node.init
                    ) {
                        const type = getType(def.node.init)
                        if (type) {
                            return type
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
