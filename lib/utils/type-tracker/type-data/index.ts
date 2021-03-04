import type * as ES from "estree"
import { TypeArray, UNKNOWN_ARRAY, ARRAY_TYPES } from "./array"
import type { TypeBigInt } from "./bigint"
import { BIGINT, BIGINT_TYPES } from "./bigint"
import type { TypeBoolean } from "./boolean"
import { BOOLEAN, BOOLEAN_TYPES } from "./boolean"
import { isTypeClass, createObject, cache, hasType } from "./common"
import {
    RETURN_UNKNOWN_FUNCTION,
    UNKNOWN_FUNCTION,
    TypeFunction,
    RETURN_STRING,
    RETURN_NUMBER,
    RETURN_REGEXP,
    RETURN_BIGINT,
    RETURN_UNKNOWN_ARRAY,
    RETURN_UNKNOWN_OBJECT,
    RETURN_BOOLEAN,
} from "./function"
import { TypeMap, MAP_TYPES, buildMapConstructor, UNKNOWN_MAP } from "./map"
import type { TypeNumber } from "./number"
import { NUMBER_TYPES, NUMBER } from "./number"
import { TypeObject, OBJECT_TYPES, UNKNOWN_OBJECT } from "./object"
import type { TypeRegExp } from "./regexp"
import { REGEXP, REGEXP_TYPES } from "./regexp"
import { TypeSet, buildSetConstructor, SET_TYPES, UNKNOWN_SET } from "./set"
import type { TypeString } from "./string"
import { STRING_TYPES, STRING } from "./string"
import { TypeUnionOrIntersection } from "./union-or-intersection"

export {
    hasType,
    TypeArray,
    TypeObject,
    UNKNOWN_ARRAY,
    UNKNOWN_OBJECT,
    UNKNOWN_FUNCTION,
    RETURN_UNKNOWN_FUNCTION,
    STRING,
    NUMBER,
    BOOLEAN,
    REGEXP,
    BIGINT,
    TypeUnionOrIntersection,
    isTypeClass,
    TypeSet,
    TypeMap,
    UNKNOWN_MAP,
    UNKNOWN_SET,
    TypeFunction,
}

export const GLOBAL_STRING = Symbol("String")
export const GLOBAL_NUMBER = Symbol("Number")
export const GLOBAL_BOOLEAN = Symbol("Boolean")
export const GLOBAL_REGEXP = Symbol("RegExp")
export const GLOBAL_BIGINT = Symbol("BigInt")
export const GLOBAL_ARRAY = Symbol("Array")
export const GLOBAL_FUNCTION = Symbol("Function")
export const GLOBAL_OBJECT = Symbol("Object")
export const GLOBAL_MAP = Symbol("Map")
export const GLOBAL_SET = Symbol("Map")

export type NamedType = "null" | "undefined"
export type OtherTypeName =
    | "Function"
    | "Array"
    | "Object"
    | "String"
    | "Number"
    | "Boolean"
    | "RegExp"
    | "BigInt"
    | "Map"
    | "Set"
export type GlobalType =
    | typeof GLOBAL_STRING
    | typeof GLOBAL_NUMBER
    | typeof GLOBAL_BOOLEAN
    | typeof GLOBAL_REGEXP
    | typeof GLOBAL_BIGINT
    | typeof GLOBAL_ARRAY
    | typeof GLOBAL_FUNCTION
    | typeof GLOBAL_OBJECT
    | typeof GLOBAL_MAP
    | typeof GLOBAL_SET

export type TypeInfo = NamedType | GlobalType | TypeClass
export type TypeClass =
    | TypeUnionOrIntersection
    | TypeArray
    | TypeObject
    | TypeString
    | TypeNumber
    | TypeBoolean
    | TypeRegExp
    | TypeBigInt
    | TypeMap
    | TypeSet
    | TypeFunction
export interface ITypeClass {
    type:
        | "TypeUnionOrIntersection"
        | "Array"
        | "Object"
        | "String"
        | "Number"
        | "Boolean"
        | "RegExp"
        | "BigInt"
        | "Map"
        | "Set"
        | "Function"
    has(type: NamedType | OtherTypeName): boolean
    paramType(index: number): TypeInfo | null
    iterateType(): TypeInfo | null
    propertyType(name: string): TypeInfo | null
    returnType(
        thisType: (() => TypeInfo | null) | null,
        argTypes: ((() => TypeInfo | null) | null)[],
    ): TypeInfo | null
    typeNames(): string[]
    equals(o: TypeClass): boolean
}

export const GLOBAL_FACTORIES: { [key: string]: GlobalType } = createObject({
    String: GLOBAL_STRING,
    Number: GLOBAL_NUMBER,
    Boolean: GLOBAL_BOOLEAN,
    RegExp: GLOBAL_REGEXP,
    BigInt: GLOBAL_BIGINT,
    Array: GLOBAL_ARRAY,
    Function: GLOBAL_FUNCTION,
    Object: GLOBAL_OBJECT,
    Map: GLOBAL_MAP,
    Set: GLOBAL_SET,
})
export const GLOBAL_FACTORY_TYPES: {
    [key in GlobalType]: TypeFunction
} = {
    [GLOBAL_STRING]: RETURN_STRING,
    [GLOBAL_NUMBER]: RETURN_NUMBER,
    [GLOBAL_BOOLEAN]: RETURN_BOOLEAN,
    [GLOBAL_REGEXP]: RETURN_REGEXP,
    [GLOBAL_BIGINT]: RETURN_BIGINT,
    [GLOBAL_ARRAY]: RETURN_UNKNOWN_ARRAY,
    [GLOBAL_FUNCTION]: RETURN_UNKNOWN_FUNCTION,
    [GLOBAL_OBJECT]: RETURN_UNKNOWN_OBJECT,
    [GLOBAL_MAP]: buildMapConstructor(),
    [GLOBAL_SET]: buildSetConstructor(),
}
export const GLOBAL_FACTORY_FUNCTIONS: {
    [key: string]: TypeInfo
} = createObject({
    String: RETURN_STRING,
    Number: RETURN_NUMBER,
    Boolean: RETURN_BOOLEAN,
    RegExp: RETURN_REGEXP,
    BigInt: RETURN_BIGINT,
    Array: RETURN_UNKNOWN_ARRAY,
    Function: RETURN_UNKNOWN_FUNCTION,
    isFinite: RETURN_BOOLEAN,
    isNaN: RETURN_BOOLEAN,
    parseFloat: RETURN_NUMBER,
    parseInt: RETURN_NUMBER,
    decodeURI: RETURN_STRING,
    decodeURIComponent: RETURN_STRING,
    encodeURI: RETURN_STRING,
    encodeURIComponent: RETURN_STRING,
    escape: RETURN_STRING,
    unescape: RETURN_STRING,
})

const FUNCTION_TYPES: () => {
    [key in keyof FunctionConstructor]: TypeInfo | null
} = cache(() =>
    createObject({
        prototype: null,
    }),
)

export const GLOBAL_OBJECTS_PROP_TYPES: {
    [key in GlobalType]: () => { [key: string]: TypeInfo | null }
} = createObject({
    [GLOBAL_STRING]: STRING_TYPES,
    [GLOBAL_ARRAY]: ARRAY_TYPES,
    [GLOBAL_NUMBER]: NUMBER_TYPES,
    [GLOBAL_BOOLEAN]: BOOLEAN_TYPES,
    [GLOBAL_REGEXP]: REGEXP_TYPES,
    [GLOBAL_BIGINT]: BIGINT_TYPES,
    [GLOBAL_FUNCTION]: FUNCTION_TYPES,
    [GLOBAL_OBJECT]: OBJECT_TYPES,
    [GLOBAL_MAP]: MAP_TYPES,
    [GLOBAL_SET]: SET_TYPES,
})

/** Get BinaryExpression calc type */
function binaryNumOp(getTypes: () => [TypeInfo | null, TypeInfo | null]) {
    const [t1, t2] = getTypes()
    if (hasType(t1, "BigInt") && hasType(t2, "BigInt")) {
        return BIGINT
    }
    return NUMBER
}

/** Get condition type */
function resultBool() {
    return BOOLEAN
}

/** Get BinaryExpression bitwise type */
function binaryBitwise() {
    return NUMBER
}

export const BI_OPERATOR_TYPES: {
    [key in ES.BinaryExpression["operator"]]: (
        getTypes: () => [TypeInfo | null, TypeInfo | null],
    ) => TypeInfo | null
} = createObject({
    "==": resultBool,
    "!=": resultBool,
    "===": resultBool,
    "!==": resultBool,
    "<": resultBool,
    "<=": resultBool,
    ">": resultBool,
    ">=": resultBool,
    in: resultBool,
    instanceof: resultBool,
    "-": binaryNumOp,
    "*": binaryNumOp,
    "/": binaryNumOp,
    "%": binaryNumOp,
    "^": binaryNumOp,
    "**": binaryNumOp,
    "&": binaryNumOp,
    "|": binaryNumOp,
    "<<": binaryBitwise,
    ">>": binaryBitwise,
    ">>>": binaryBitwise,
    "+": (getTypes) => {
        const [t1, t2] = getTypes()
        if (hasType(t1, "String") || hasType(t2, "String")) {
            return STRING
        }
        if (hasType(t1, "Number") && hasType(t2, "Number")) {
            return NUMBER
        }
        if (hasType(t1, "BigInt") && hasType(t2, "BigInt")) {
            return BIGINT
        }
        return null
    },
})

/** Get UnaryExpression calc type */
function unaryNumOp(getType: () => TypeInfo | null) {
    if (hasType(getType(), "BigInt")) {
        return BIGINT
    }
    return NUMBER
}

export const UN_OPERATOR_TYPES: {
    [key in ES.UnaryExpression["operator"]]: (
        getType: () => TypeInfo | null,
    ) => TypeInfo | null
} = createObject({
    "!": resultBool,
    delete: resultBool,
    "+": unaryNumOp,
    "-": unaryNumOp,
    "~": unaryNumOp,
    void: () => "undefined" as const,
    typeof: () => STRING,
})
