import type * as ES from "estree"
import { TypeArray, UNKNOWN_ARRAY } from "./array"
import type { TypeBigInt } from "./bigint"
import { BIGINT } from "./bigint"
import type { TypeBoolean } from "./boolean"
import { BOOLEAN } from "./boolean"
import { isTypeClass, createObject, hasType } from "./common"
import {
    RETURN_UNKNOWN_FUNCTION,
    UNKNOWN_FUNCTION,
    TypeFunction,
} from "./function"
import { TypeGlobal } from "./global"
import { TypeMap, UNKNOWN_MAP } from "./map"
import type { TypeNumber } from "./number"
import { NUMBER } from "./number"
import { TypeObject, UNKNOWN_OBJECT } from "./object"
import type { TypeRegExp } from "./regexp"
import { REGEXP } from "./regexp"
import { TypeSet, UNKNOWN_SET } from "./set"
import type { TypeString } from "./string"
import { STRING } from "./string"
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

export const GLOBAL_NUMBER = Symbol("Number")
export const GLOBAL_REGEXP = Symbol("RegExp")
// export const GLOBAL_BIGINT = Symbol("BigInt")
export const GLOBAL_FUNCTION = Symbol("Function")
export const GLOBAL_OBJECT = Symbol("Object")

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

export type TypeInfo = NamedType | TypeClass
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
        | "Global"
    has(type: NamedType | OtherTypeName): boolean
    paramType(index: number): TypeInfo | null
    iterateType(): TypeInfo | null
    propertyType(name: string): TypeInfo | null
    returnType(
        thisType: (() => TypeInfo | null) | null,
        argTypes: ((() => TypeInfo | null) | null)[],
        meta?: { isConstructor?: boolean },
    ): TypeInfo | null
    typeNames(): string[]
    equals(o: TypeClass): boolean
}

export const GLOBAL = new TypeGlobal()

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
