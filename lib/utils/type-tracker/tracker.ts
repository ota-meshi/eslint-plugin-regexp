import type { Rule } from "eslint"
import type * as ES from "estree"
import type {
    RootResult as JSDocTypeRootResult,
    KeyValueResult,
} from "jsdoc-type-pratt-parser"
import type * as TS from "typescript"
import { getParent } from "../ast-utils"
import {
    getTypeScript,
    getTypeScriptTools,
    isAny,
    isArrayLikeObject,
    isBigIntLike,
    isBooleanLike,
    isClassOrInterface,
    isNumberLike,
    isObject,
    isReferenceObject,
    isStringLine,
    isTypeParameter,
    isUnionOrIntersection,
    isUnknown,
} from "../ts-util"
import { assertNever } from "../util"
import { getJSDoc, parseTypeText } from "./jsdoc"
import type { TypeInfo } from "./type-data"
import {
    TypeFunction,
    UNKNOWN_ARRAY,
    UNKNOWN_OBJECT,
    STRING,
    NUMBER,
    BOOLEAN,
    REGEXP,
    BIGINT,
    TypeArray,
    TypeObject,
    UNKNOWN_FUNCTION,
    BI_OPERATOR_TYPES,
    UN_OPERATOR_TYPES,
    GLOBAL,
    TypeUnionOrIntersection,
    isTypeClass,
    TypeMap,
    UNKNOWN_MAP,
    TypeSet,
    UNKNOWN_SET,
    hasType,
} from "./type-data"
import { TypeIterable, UNKNOWN_ITERABLE } from "./type-data/iterable"
import { findVariable, getPropertyName, isParenthesized } from "./utils"

const ts = getTypeScript()!

export type TypeTracker = {
    isString: (node: ES.Expression) => boolean
    maybeString: (node: ES.Expression) => boolean
    isRegExp: (node: ES.Expression) => boolean
    getTypes: (node: ES.Expression) => string[]
}

const cacheTypeTracker = new WeakMap<ES.Program, TypeTracker>()

/**
 * Create Type tracker
 */
export function createTypeTracker(context: Rule.RuleContext): TypeTracker {
    const programNode = context.sourceCode.ast
    const cache = cacheTypeTracker.get(programNode)
    if (cache) {
        return cache
    }

    const { tsNodeMap, checker, usedTS } = getTypeScriptTools(context)

    const cacheTypeInfo = new WeakMap<
        ES.Expression | ES.PrivateIdentifier,
        TypeInfo | null
    >()

    const tracker: TypeTracker = {
        isString,
        maybeString,
        isRegExp,
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
     * Checks if the given node is maybe string.
     */
    function maybeString(node: ES.Expression): boolean {
        if (isString(node)) {
            return true
        }
        if (usedTS) {
            return false
        }
        return getType(node) == null
    }

    /**
     * Checks if the given node is RegExp.
     */
    function isRegExp(node: ES.Expression): boolean {
        return hasType(getType(node), "RegExp")
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
        return result.typeNames()
    }

    /**
     * Get the type name from given node.
     */
    function getType(
        node: ES.Expression | ES.PrivateIdentifier,
    ): TypeInfo | null {
        if (cacheTypeInfo.has(node)) {
            return cacheTypeInfo.get(node) ?? null
        }
        cacheTypeInfo.set(node, null) // Store null to avoid an infinite loop.
        try {
            const type = getTypeWithoutCache(node)
            cacheTypeInfo.set(node, type)
            return type
        } catch {
            // ignore
            return null
        }
    }

    /**
     * Get the type name from given node.
     */
    function getTypeWithoutCache(
        node: ES.Expression | ES.PrivateIdentifier,
    ): TypeInfo | null {
        if (node.type === "Literal") {
            if (typeof node.value === "string") {
                return STRING
            }
            if (typeof node.value === "boolean") {
                return BOOLEAN
            }
            if (typeof node.value === "number") {
                return NUMBER
            }
            if ("regex" in node && node.regex) {
                return REGEXP
            }
            if ("bigint" in node && node.bigint) {
                return BIGINT
            }
            if (node.value == null) {
                return "null"
            }
        } else if (node.type === "TemplateLiteral") {
            return STRING
        }

        if (usedTS) {
            return getTypeByTs(node)
        }

        const jsdoc = getJSDoc(node, context)
        if (jsdoc) {
            if (isParenthesized(context, node)) {
                // e.g. /** @type {Foo} */(expr)
                const type = typeTextToTypeInfo(jsdoc.getTag("type")?.type)
                if (type) {
                    return type
                }
            }
        }

        if (
            node.type === "ArrowFunctionExpression" ||
            node.type === "FunctionExpression"
        ) {
            if (jsdoc) {
                const type = typeTextToTypeInfo(jsdoc.getTag("returns")?.type)
                if (type) {
                    return new TypeFunction(() => type)
                }
            }
        }
        if (node.type === "FunctionExpression") {
            return UNKNOWN_FUNCTION
        }
        if (node.type === "ArrowFunctionExpression") {
            if (node.body.type !== "BlockStatement") {
                const body = node.body
                return new TypeFunction(() => getType(body))
            }
            return UNKNOWN_FUNCTION
        }

        if (node.type === "ArrayExpression") {
            return new TypeArray(
                function* () {
                    for (const element of node.elements) {
                        if (!element) {
                            yield null
                        } else if (element.type !== "SpreadElement") {
                            yield getType(element)
                        } else {
                            const argType = getType(element.argument)
                            if (isTypeClass(argType)) {
                                yield argType.iterateType()
                            } else {
                                yield null
                            }
                        }
                    }
                },
                node.elements.every((e) => e && e.type !== "SpreadElement"),
            )
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
            const type = BI_OPERATOR_TYPES[node.operator]
            if (type) {
                return type(() => [getType(node.left), getType(node.right)])
            }
        } else if (node.type === "UnaryExpression") {
            const type = UN_OPERATOR_TYPES[node.operator]
            if (type) {
                return type(() => getType(node.argument))
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
                            const type = typeTextToTypeInfo(
                                idJsdoc.getTag("type")?.type,
                            )
                            if (type) {
                                // e.g. /** @type {Foo} */
                                return type
                            }

                            const returnType = typeTextToTypeInfo(
                                idJsdoc.getTag("returns")?.type,
                            )
                            if (returnType) {
                                // e.g. /** @returns {Foo} */
                                return new TypeFunction(() => returnType)
                            }
                        }
                        if (def.parent.kind === "const") {
                            if (def.node.init) {
                                // e.g. const v = 42
                                const type = getType(def.node.init)
                                if (type) {
                                    return type
                                }
                            } else {
                                const parent = getParent(def.parent)
                                if (parent) {
                                    if (parent?.type === "ForOfStatement") {
                                        // e.g. for (const v of list)
                                        const rightType = getType(parent.right)
                                        if (isTypeClass(rightType)) {
                                            const type = rightType.iterateType()
                                            if (type) {
                                                return type
                                            }
                                        }
                                    } else if (
                                        parent?.type === "ForInStatement"
                                    ) {
                                        // e.g. for (const v in obj)
                                        return STRING
                                    }
                                }
                            }
                        }
                    } else if (def.type === "Parameter") {
                        // e.g. function (arg) {}
                        const fnJsdoc = getJSDoc(def.node, context)
                        if (fnJsdoc) {
                            const jsdocParams = fnJsdoc.parseParams()
                            if (!jsdocParams.isEmpty()) {
                                const type = typeTextToTypeInfo(
                                    jsdocParams.get(
                                        getParamPath(
                                            def.name.name,
                                            def.name,
                                            context,
                                        ),
                                    )?.type,
                                )
                                if (type) {
                                    return type
                                }
                            }
                        }
                        const parent = getParent(def.name)
                        if (parent) {
                            if (parent.type === "RestElement") {
                                const pp = getParent(parent)
                                if (pp) {
                                    if (pp.type === "ArrayPattern") {
                                        // e.g. ([...arg]) => {}
                                        return UNKNOWN_ARRAY
                                    }
                                    if (pp.type === "ObjectPattern") {
                                        // e.g. ({...arg}) => {}
                                        return UNKNOWN_OBJECT
                                    }
                                    if (
                                        pp.type === "FunctionExpression" ||
                                        pp.type === "FunctionDeclaration" ||
                                        pp.type === "ArrowFunctionExpression"
                                    ) {
                                        // e.g. (...arg) => {}
                                        return UNKNOWN_ARRAY
                                    }
                                }
                            } else if (parent.type === "AssignmentPattern") {
                                // e.g. (arg=42) => {}
                                return getType(parent.right)
                            }
                        }
                    } else if (def.type === "FunctionName") {
                        // e.g. function target () {}
                        const fnJsdoc = getJSDoc(def.node, context)
                        if (fnJsdoc) {
                            const type = typeTextToTypeInfo(
                                fnJsdoc.getTag("returns")?.type,
                            )
                            if (type) {
                                return new TypeFunction(() => type)
                            }
                        }
                        return UNKNOWN_FUNCTION
                    }
                } else if (variable.defs.length === 0) {
                    // globals
                    const type = GLOBAL.propertyType(node.name)
                    if (type) {
                        return type
                    }
                }
            }
        } else if (node.type === "NewExpression") {
            if (node.callee.type !== "Super") {
                const type = getType(node.callee)
                if (isTypeClass(type)) {
                    const argTypes: ((() => TypeInfo | null) | null)[] = []
                    for (const arg of node.arguments) {
                        argTypes.push(
                            arg.type === "SpreadElement"
                                ? null
                                : () => {
                                      return getType(arg)
                                  },
                        )
                    }
                    return type.returnType(null, argTypes, {
                        isConstructor: true,
                    })
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
            if (callee.type === "MemberExpression") {
                const mem = callee
                if (mem.object.type !== "Super") {
                    let propertyName: string | null = null
                    if (!mem.computed) {
                        if (mem.property.type === "Identifier") {
                            propertyName = mem.property.name
                        }
                    } else {
                        // computed
                        const propertyType = getType(mem.property as never)
                        if (hasType(propertyType, "Number")) {
                            propertyName = "0"
                        }
                    }
                    if (propertyName != null) {
                        if (
                            propertyName === "toString" ||
                            propertyName === "toLocaleString"
                        ) {
                            return STRING
                        }
                        const objectType = getType(mem.object)
                        if (isTypeClass(objectType)) {
                            const type = objectType.propertyType(propertyName)
                            if (isTypeClass(type)) {
                                return type.returnType(
                                    () => objectType,
                                    argTypes,
                                )
                            }
                        }
                    }
                }
            } else if (callee.type !== "Super") {
                const type = getType(callee)
                if (isTypeClass(type)) {
                    return type.returnType(null, argTypes)
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
                    const propertyType = getType(node.property as never)
                    if (hasType(propertyType, "Number")) {
                        propertyName = "0"
                    }
                }
                if (propertyName != null) {
                    const objectType = getType(node.object)
                    if (isTypeClass(objectType)) {
                        const type = objectType.propertyType(propertyName)
                        if (type) {
                            return type
                        }
                    }
                }
            }
        }

        return usedTS ? getTypeByTs(node) : null
    }

    /**
     * Get type from given node by ts types.
     */
    function getTypeByTs(
        node: ES.Expression | ES.PrivateIdentifier,
    ): TypeInfo | null {
        const tsNode = tsNodeMap.get(node)
        const tsType = (tsNode && checker?.getTypeAtLocation(tsNode)) || null
        return tsType && getTypeFromTsType(tsType)
    }

    /**
     * Check if the name of the given type is expected or not.
     */
    function getTypeFromTsType(tsType: TS.Type): TypeInfo | null {
        if (isStringLine(tsType)) {
            return STRING
        }
        if (isNumberLike(tsType)) {
            return NUMBER
        }
        if (isBooleanLike(tsType)) {
            return BOOLEAN
        }
        if (isBigIntLike(tsType)) {
            return BIGINT
        }
        if (isAny(tsType) || isUnknown(tsType)) {
            return null
        }
        if (isArrayLikeObject(tsType)) {
            return UNKNOWN_ARRAY
        }

        if (isReferenceObject(tsType) && tsType.target !== tsType) {
            return getTypeFromTsType(tsType.target)
        }
        if (isTypeParameter(tsType)) {
            const constraintType = getConstraintType(tsType)
            if (constraintType) {
                return getTypeFromTsType(constraintType)
            }
            return null
        }
        if (isUnionOrIntersection(tsType)) {
            return TypeUnionOrIntersection.buildType(function* () {
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
            const typeName =
                /^Readonly(?<typeName>.*)/u.exec(name as string)?.groups!
                    .typeName ?? name
            return typeName === "Array" ? UNKNOWN_ARRAY : (typeName as TypeInfo)
        }
        if (isObject(tsType)) {
            return UNKNOWN_OBJECT
        }
        return checker ? (checker.typeToString(tsType) as TypeInfo) : null
    }

    /**
     * Get the constraint type of a given type parameter type if exists.
     */
    function getConstraintType(tsType: TS.Type) {
        const symbol = tsType.symbol
        const declarations = symbol && symbol.declarations
        const declaration = declarations && declarations[0]
        if (
            declaration &&
            ts.isTypeParameterDeclaration(declaration) &&
            declaration.constraint != null
        ) {
            return checker?.getTypeFromTypeNode(declaration.constraint)
        }
        return undefined
    }
}

/** Get type from jsdoc type text */
function typeTextToTypeInfo(typeText?: string): TypeInfo | null {
    if (typeText == null) {
        return null
    }
    return jsDocTypeNodeToTypeInfo(parseTypeText(typeText))
}

/** Get type from jsdoc-type-pratt-parser's RootResult */
function jsDocTypeNodeToTypeInfo(
    node: JSDocTypeRootResult | null,
): TypeInfo | null {
    if (node == null) {
        return null
    }
    if (node.type === "JsdocTypeName") {
        return typeNameToTypeInfo(node.value)
    }
    if (node.type === "JsdocTypeStringValue") {
        return STRING
    }
    if (node.type === "JsdocTypeNumber") {
        return NUMBER
    }
    if (node.type === "JsdocTypeAsserts") {
        return BOOLEAN
    }
    if (
        node.type === "JsdocTypeOptional" ||
        node.type === "JsdocTypeNullable" ||
        node.type === "JsdocTypeNotNullable" ||
        node.type === "JsdocTypeParenthesis"
    ) {
        return jsDocTypeNodeToTypeInfo(node.element)
    }
    if (node.type === "JsdocTypeVariadic") {
        return new TypeArray(function* () {
            if (node.element) {
                yield jsDocTypeNodeToTypeInfo(node.element)
            } else {
                yield null
            }
        })
    }
    if (
        node.type === "JsdocTypeUnion" ||
        node.type === "JsdocTypeIntersection"
    ) {
        return TypeUnionOrIntersection.buildType(function* () {
            for (const e of node.elements) {
                yield jsDocTypeNodeToTypeInfo(e)
            }
        })
    }
    if (node.type === "JsdocTypeGeneric") {
        const subject = jsDocTypeNodeToTypeInfo(node.left)
        if (hasType(subject, "Array")) {
            return new TypeArray(function* () {
                yield jsDocTypeNodeToTypeInfo(node.elements[0])
            })
        }
        if (hasType(subject, "Map")) {
            return new TypeMap(
                () => jsDocTypeNodeToTypeInfo(node.elements[0]),
                () => jsDocTypeNodeToTypeInfo(node.elements[1]),
            )
        }
        if (hasType(subject, "Set")) {
            return new TypeSet(() => jsDocTypeNodeToTypeInfo(node.elements[0]))
        }
        if (subject === UNKNOWN_ITERABLE) {
            return new TypeIterable(() =>
                jsDocTypeNodeToTypeInfo(node.elements[0]),
            )
        }
        return subject
    }
    if (node.type === "JsdocTypeObject") {
        return new TypeObject(function* () {
            for (const element of node.elements) {
                if (element.type === "JsdocTypeObjectField") {
                    if (typeof element.key !== "string") {
                        // unknown key
                        continue
                    }
                    yield [
                        element.key,
                        () =>
                            element.right
                                ? jsDocTypeNodeToTypeInfo(element.right)
                                : null,
                    ]
                } else if (element.type === "JsdocTypeJsdocObjectField") {
                    if (
                        element.left.type === "JsdocTypeNullable" &&
                        element.left.element.type === "JsdocTypeName"
                    ) {
                        yield [
                            element.left.element.value,
                            () =>
                                element.right
                                    ? jsDocTypeNodeToTypeInfo(element.right)
                                    : null,
                        ]
                    }
                }
            }
        })
    }
    if (node.type === "JsdocTypeTuple") {
        if (node.elements[0].type === "JsdocTypeKeyValue") {
            const elements = node.elements as KeyValueResult[]
            return new TypeArray(function* () {
                for (const element of elements) {
                    if (element.right) {
                        yield jsDocTypeNodeToTypeInfo(element.right)
                    }
                }
            })
        }
        const elements = node.elements as JSDocTypeRootResult[]
        return new TypeArray(function* () {
            for (const element of elements) {
                yield jsDocTypeNodeToTypeInfo(element)
            }
        })
    }
    if (node.type === "JsdocTypeFunction") {
        if (node.returnType) {
            const returnType = node.returnType
            return new TypeFunction(() => jsDocTypeNodeToTypeInfo(returnType))
        }
        return UNKNOWN_FUNCTION
    }
    if (node.type === "JsdocTypeTypeof") {
        return new TypeFunction(() => jsDocTypeNodeToTypeInfo(node.element))
    }
    if (
        node.type === "JsdocTypeAny" ||
        node.type === "JsdocTypeUnknown" ||
        node.type === "JsdocTypeNull" ||
        node.type === "JsdocTypeUndefined"
    ) {
        return null
    }
    if (
        node.type === "JsdocTypeImport" ||
        node.type === "JsdocTypeKeyof" ||
        node.type === "JsdocTypeNamePath" ||
        node.type === "JsdocTypePredicate" ||
        node.type === "JsdocTypeSpecialNamePath" ||
        node.type === "JsdocTypeSymbol"
    ) {
        return null
    }

    throw assertNever(node)
}

/** Get type from type name */
function typeNameToTypeInfo(name: string): TypeInfo | null {
    if (name === "String" || name === "string") {
        return STRING
    }
    if (name === "Number" || name === "number") {
        return NUMBER
    }
    if (name === "Boolean" || name === "boolean") {
        return BOOLEAN
    }
    if (name === "BigInt" || name === "bigint") {
        return BIGINT
    }
    if (name === "RegExp") {
        return REGEXP
    }
    if (name === "Array" || name === "array") {
        return UNKNOWN_ARRAY
    }
    if (name === "Function" || name === "function") {
        return UNKNOWN_FUNCTION
    }
    if (name === "Object" || name === "object") {
        return UNKNOWN_OBJECT
    }
    if (name === "Record") {
        return UNKNOWN_OBJECT
    }
    if (name === "Map") {
        return UNKNOWN_MAP
    }
    if (name === "Set") {
        return UNKNOWN_SET
    }
    if (
        name === "Generator" ||
        name === "Iterable" ||
        name === "IterableIterator"
    ) {
        return UNKNOWN_ITERABLE
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
    const parent = getParent<ES.Pattern | ES.AssignmentProperty | ES.Function>(
        node,
    )
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
        const object = getParent<ES.ObjectPattern>(parent)!

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
