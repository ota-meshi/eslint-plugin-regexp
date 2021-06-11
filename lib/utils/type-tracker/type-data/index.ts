import type * as ES from "estree"
import { TypeArray, UNKNOWN_ARRAY } from "./array"
import type { TypeBigInt } from "./bigint"
import { BIGINT } from "./bigint"
import type { TypeBoolean } from "./boolean"
import { BOOLEAN } from "./boolean"
import { isTypeClass, createObject, hasType } from "./common"
import { UNKNOWN_FUNCTION, TypeFunction } from "./function"
import type { TypeGlobal } from "./global"
import { GLOBAL } from "./global"
import type { TypeIterable } from "./iterable"
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
    GLOBAL,
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
    | "Iterable"
    | "Global"

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
    | TypeIterable
    | TypeGlobal
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
        | "Iterable"
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
    intersect(o: TypeClass): TypeInfo | null
}

/** Get BinaryExpression calc type */
function binaryNumOp(getTypes: () => [TypeInfo | null, TypeInfo | null]) {
    const [t1, t2] = getTypes()
    return TypeUnionOrIntersection.buildType(function* () {
        let unknown = true
        if (hasType(t1, "Number") || hasType(t2, "Number")) {
            unknown = false
            yield NUMBER
        }
        if (hasType(t1, "BigInt") && hasType(t2, "BigInt")) {
            unknown = false
            yield BIGINT
        }
        if (unknown) {
            yield NUMBER
            yield BIGINT
        }
    })
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
        return TypeUnionOrIntersection.buildType(function* () {
            let unknown = true
            if (hasType(t1, "String") || hasType(t2, "String")) {
                unknown = false
                yield STRING
            }
            if (hasType(t1, "Number") && hasType(t2, "Number")) {
                unknown = false
                yield NUMBER
            }
            if (hasType(t1, "BigInt") && hasType(t2, "BigInt")) {
                unknown = false
                yield BIGINT
            }
            if (unknown) {
                yield STRING
                yield NUMBER
                yield BIGINT
            }
        })
    },
})

/** Get UnaryExpression calc type */
function unaryNumOp(getType: () => TypeInfo | null) {
    const t = getType()
    return TypeUnionOrIntersection.buildType(function* () {
        let unknown = true
        if (hasType(t, "Number")) {
            unknown = false
            yield NUMBER
        }
        if (hasType(t, "BigInt")) {
            unknown = false
            yield BIGINT
        }
        if (unknown) {
            yield NUMBER
            yield BIGINT
        }
    })
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
