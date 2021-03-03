import type * as ES from "estree"
import {
    TypeArray,
    UNKNOWN_ARRAY,
    ARRAY_TYPES,
    RETURN_UNKNOWN_ARRAY,
} from "./array"
import type { TypeBigInt } from "./bigint"
import { BIGINT, BIGINT_TYPES, RETURN_BIGINT } from "./bigint"
import type { TypeBoolean } from "./boolean"
import { RETURN_BOOLEAN, BOOLEAN, BOOLEAN_TYPES } from "./boolean"
import {
    isTypeClass,
    createObject,
    cache,
    hasType,
    RETURN_VOID,
} from "./common"
import type { FunctionType } from "./function"
import {
    getFunctionPrototypes,
    RETURN_FUNCTION,
    UNKNOWN_FUNCTION,
} from "./function"
import { TypeMap, MAP_TYPES, MAP_CONSTRUCTOR, UNKNOWN_MAP } from "./map"
import type { TypeNumber } from "./number"
import { RETURN_NUMBER, NUMBER_TYPES, NUMBER } from "./number"
import { TypeObject, OBJECT_TYPES, UNKNOWN_OBJECT } from "./object"
import type { TypeRegExp } from "./regexp"
import { REGEXP, REGEXP_TYPES, RETURN_REGEXP } from "./regexp"
import { TypeSet, SET_CONSTRUCTOR, SET_TYPES, UNKNOWN_SET } from "./set"
import type { TypeString } from "./string"
import { RETURN_STRING, STRING_TYPES, STRING } from "./string"
import { TypeUnionOrIntersection } from "./union-or-intersection"

export {
    hasType,
    TypeArray,
    TypeObject,
    UNKNOWN_ARRAY,
    UNKNOWN_OBJECT,
    UNKNOWN_FUNCTION,
    RETURN_FUNCTION,
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

export type TypeInfo = NamedType | FunctionType | GlobalType | TypeClass
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
    has(type: NamedType | OtherTypeName): boolean
    paramType(index: number): TypeInfo | null
    iterateType(): TypeInfo | null
    propertyType(name: string): TypeInfo | null
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
    [key in GlobalType]: FunctionType
} = {
    [GLOBAL_STRING]: () => STRING,
    [GLOBAL_NUMBER]: () => NUMBER,
    [GLOBAL_BOOLEAN]: () => BOOLEAN,
    [GLOBAL_REGEXP]: () => REGEXP,
    [GLOBAL_BIGINT]: () => BIGINT,
    [GLOBAL_ARRAY]: () => UNKNOWN_ARRAY,
    [GLOBAL_FUNCTION]: () => UNKNOWN_FUNCTION,
    [GLOBAL_OBJECT]: () => UNKNOWN_OBJECT,
    [GLOBAL_MAP]: MAP_CONSTRUCTOR,
    [GLOBAL_SET]: SET_CONSTRUCTOR,
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
    Function: RETURN_FUNCTION,
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

export const PROTO_TYPES: [
    NamedType | OtherTypeName,
    { [key: string]: TypeInfo | null } | null,
][] = [
    // ["String", null],
    // ["Array", null],
    // ["Number", null],
    // ["Boolean", null],
    // ["RegExp", null],
    // ["BigInt", null],
    ["Function", getFunctionPrototypes()],
    // ["Object", null],
    // ["undefined", null],
    // ["null", null],
]

/** Get BinaryExpression calc type */
function binaryNumOp(getTypes: () => [TypeInfo | null, TypeInfo | null]) {
    const [t1, t2] = getTypes()
    if (hasType(t1, "BigInt") && hasType(t2, "BigInt")) {
        return BIGINT
    }
    return NUMBER
}

export const BI_OPERATOR_TYPES: {
    [key in ES.BinaryExpression["operator"]]: (
        getTypes: () => [TypeInfo | null, TypeInfo | null],
    ) => TypeInfo | null
} = createObject({
    "==": RETURN_BOOLEAN,
    "!=": RETURN_BOOLEAN,
    "===": RETURN_BOOLEAN,
    "!==": RETURN_BOOLEAN,
    "<": RETURN_BOOLEAN,
    "<=": RETURN_BOOLEAN,
    ">": RETURN_BOOLEAN,
    ">=": RETURN_BOOLEAN,
    in: RETURN_BOOLEAN,
    instanceof: RETURN_BOOLEAN,
    "-": binaryNumOp,
    "*": binaryNumOp,
    "/": binaryNumOp,
    "%": binaryNumOp,
    "^": binaryNumOp,
    "**": binaryNumOp,
    "&": binaryNumOp,
    "|": binaryNumOp,
    "<<": RETURN_NUMBER,
    ">>": RETURN_NUMBER,
    ">>>": RETURN_NUMBER,
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
    "!": RETURN_BOOLEAN,
    delete: RETURN_BOOLEAN,
    "+": unaryNumOp,
    "-": unaryNumOp,
    "~": unaryNumOp,
    void: RETURN_VOID,
    typeof: RETURN_STRING,
})
