import type * as ES from "estree"
import {
    TypeArray,
    UNKNOWN_ARRAY,
    ARRAY_PROTO_TYPES,
    ARRAY_TYPES,
    RETURN_STRING_ARRAY,
    RETURN_UNKNOWN_ARRAY,
} from "./array"
import {
    RETURN_BIGINT,
    RETURN_BOOLEAN,
    RETURN_FUNCTION,
    RETURN_NUMBER,
    RETURN_REGEXP,
    RETURN_STRING,
    UNKNOWN_FUNCTION,
    isTypeClass,
    createObject,
} from "./common"
import {
    TypeObject,
    OBJECT_PROTO_TYPES,
    OBJECT_TYPES,
    UNKNOWN_OBJECT,
} from "./object"
import { TypeUnionOrIntersection } from "./union-or-intersection"

export {
    TypeArray,
    TypeObject,
    UNKNOWN_ARRAY,
    UNKNOWN_OBJECT,
    TypeUnionOrIntersection,
    UNKNOWN_FUNCTION,
    isTypeClass,
}

export const GLOBAL_STRING = Symbol("String")
export const GLOBAL_NUMBER = Symbol("Number")
export const GLOBAL_BOOLEAN = Symbol("Boolean")
export const GLOBAL_REGEXP = Symbol("RegExp")
export const GLOBAL_BIGINT = Symbol("BigInt")
export const GLOBAL_ARRAY = Symbol("Array")
export const GLOBAL_FUNCTION = Symbol("Function")
export const GLOBAL_OBJECT = Symbol("Object")

export type NamedType =
    | "String"
    | "Number"
    | "Boolean"
    | "RegExp"
    | "BigInt"
    | "null"
    | "undefined"
export type OtherTypeName = "Function" | "Array" | "Object"
export type GlobalType =
    | typeof GLOBAL_STRING
    | typeof GLOBAL_NUMBER
    | typeof GLOBAL_BOOLEAN
    | typeof GLOBAL_REGEXP
    | typeof GLOBAL_BIGINT
    | typeof GLOBAL_ARRAY
    | typeof GLOBAL_FUNCTION
    | typeof GLOBAL_OBJECT

export type FunctionType = (
    thisType: (() => TypeInfo | null) | null,
    argTypes: ((() => TypeInfo | null) | null)[],
) => TypeInfo | null

export type TypeInfo = NamedType | FunctionType | GlobalType | TypeClass
export type TypeClass = TypeUnionOrIntersection | TypeArray | TypeObject
export interface ITypeClass {
    type: "TypeUnionOrIntersection" | "Array" | "Object"
    has(type: NamedType | OtherTypeName): boolean
    paramType(index: number): TypeInfo | null
    property(name: string): TypeInfo | null
    typeNames(): string[]
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
})
export const GLOBAL_FACTORY_TYPES: {
    [key in GlobalType]: TypeInfo
} = {
    [GLOBAL_STRING]: "String",
    [GLOBAL_NUMBER]: "Number",
    [GLOBAL_BOOLEAN]: "Boolean",
    [GLOBAL_REGEXP]: "RegExp",
    [GLOBAL_BIGINT]: "BigInt",
    [GLOBAL_ARRAY]: UNKNOWN_ARRAY,
    [GLOBAL_FUNCTION]: UNKNOWN_FUNCTION,
    [GLOBAL_OBJECT]: UNKNOWN_OBJECT,
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

const STRING_TYPES: {
    [key in keyof StringConstructor]: TypeInfo | null
} = createObject({
    // ES5
    fromCharCode: RETURN_STRING,
    // ES2015
    fromCodePoint: RETURN_STRING,
    raw: RETURN_STRING,

    prototype: null,
})
const NUMBER_TYPES: {
    [key in keyof NumberConstructor]: TypeInfo | null
} = createObject({
    // ES5
    MAX_VALUE: "Number", // prop
    MIN_VALUE: "Number", // prop
    NaN: "Number", // prop
    NEGATIVE_INFINITY: "Number", // prop
    POSITIVE_INFINITY: "Number", // prop
    // ES2015
    EPSILON: "Number", // prop
    isFinite: RETURN_BOOLEAN,
    isInteger: RETURN_BOOLEAN,
    isNaN: RETURN_BOOLEAN,
    isSafeInteger: RETURN_BOOLEAN,
    MAX_SAFE_INTEGER: "Number", // prop
    MIN_SAFE_INTEGER: "Number", // prop
    parseFloat: RETURN_NUMBER,
    parseInt: RETURN_NUMBER,

    prototype: null,
})
const BOOLEAN_TYPES: {
    [key in keyof BooleanConstructor]: TypeInfo | null
} = createObject({
    prototype: null,
})
const REGEXP_TYPES: {
    [key in keyof RegExpConstructor]: TypeInfo | null
} = createObject({
    $1: "String",
    $2: "String",
    $3: "String",
    $4: "String",
    $5: "String",
    $6: "String",
    $7: "String",
    $8: "String",
    $9: "String",
    lastMatch: "Number", // prop
    prototype: null,
})
const BIGINT_TYPES: {
    [key in keyof BigIntConstructor]: TypeInfo | null
} = createObject({
    asIntN: RETURN_BIGINT,
    asUintN: RETURN_BIGINT,
    prototype: null,
})
const FUNCTION_TYPES: {
    [key in keyof FunctionConstructor]: TypeInfo | null
} = createObject({
    prototype: null,
})

export const GLOBAL_OBJECTS_PROP_TYPES: {
    [key in GlobalType]: { [key: string]: TypeInfo | null } | null
} = createObject({
    [GLOBAL_STRING]: STRING_TYPES,
    [GLOBAL_ARRAY]: ARRAY_TYPES,
    [GLOBAL_NUMBER]: NUMBER_TYPES,
    [GLOBAL_BOOLEAN]: BOOLEAN_TYPES,
    [GLOBAL_REGEXP]: REGEXP_TYPES,
    [GLOBAL_BIGINT]: BIGINT_TYPES,
    [GLOBAL_FUNCTION]: FUNCTION_TYPES,
    [GLOBAL_OBJECT]: OBJECT_TYPES,
})
const STRING_PROTO_TYPES: {
    [key in keyof string]: TypeInfo | null
} = createObject({
    ...OBJECT_PROTO_TYPES,
    // ES5
    toString: RETURN_STRING,
    charAt: RETURN_STRING,
    charCodeAt: RETURN_NUMBER,
    concat: RETURN_STRING,
    indexOf: RETURN_NUMBER,
    lastIndexOf: RETURN_NUMBER,
    localeCompare: RETURN_NUMBER,
    match: RETURN_STRING_ARRAY,
    replace: RETURN_STRING,
    search: RETURN_NUMBER,
    slice: RETURN_STRING,
    split: RETURN_STRING_ARRAY,
    substring: RETURN_STRING,
    toLowerCase: RETURN_STRING,
    toLocaleLowerCase: RETURN_STRING,
    toUpperCase: RETURN_STRING,
    toLocaleUpperCase: RETURN_STRING,
    trim: RETURN_STRING,
    substr: RETURN_STRING,
    valueOf: RETURN_STRING,
    // ES2051
    codePointAt: RETURN_NUMBER,
    includes: RETURN_BOOLEAN,
    endsWith: RETURN_BOOLEAN,
    normalize: RETURN_STRING,
    repeat: RETURN_STRING,
    startsWith: RETURN_BOOLEAN,
    // HTML
    anchor: RETURN_STRING,
    big: RETURN_STRING,
    blink: RETURN_STRING,
    bold: RETURN_STRING,
    fixed: RETURN_STRING,
    fontcolor: RETURN_STRING,
    fontsize: RETURN_STRING,
    italics: RETURN_STRING,
    link: RETURN_STRING,
    small: RETURN_STRING,
    strike: RETURN_STRING,
    sub: RETURN_STRING,
    sup: RETURN_STRING,
    // ES2017
    padStart: RETURN_STRING,
    padEnd: RETURN_STRING,
    // ES2019
    trimLeft: RETURN_STRING,
    trimRight: RETURN_STRING,
    trimStart: RETURN_STRING,
    trimEnd: RETURN_STRING,
    // ES2020
    matchAll: null, // IterableIterator<RegExpMatchArray>

    length: "Number",
    0: "String", // string
})

const NUMBER_PROTO_TYPES: {
    [key in keyof number]: TypeInfo | null
} = createObject({
    ...OBJECT_PROTO_TYPES,
    // ES5
    toString: RETURN_STRING,
    toFixed: RETURN_STRING,
    toExponential: RETURN_STRING,
    toPrecision: RETURN_STRING,
    valueOf: RETURN_NUMBER,
    toLocaleString: RETURN_STRING,
})
const BOOLEAN_PROTO_TYPES: {
    [key in keyof boolean]: TypeInfo | null
} = createObject({
    ...OBJECT_PROTO_TYPES,
    // ES5
    valueOf: RETURN_BOOLEAN,
})
const REGEXP_PROTO_TYPES: {
    [key in keyof RegExp]: TypeInfo | null
} = createObject({
    ...OBJECT_PROTO_TYPES,
    // ES5
    exec: RETURN_STRING_ARRAY,
    test: RETURN_BOOLEAN,
    source: "String", // prop
    global: "Boolean", // prop
    ignoreCase: "Boolean", // prop
    multiline: "Boolean", // prop
    lastIndex: "Number", // prop
    compile: RETURN_REGEXP,
    // ES2015
    flags: "String", // prop
    sticky: "Boolean", // prop
    unicode: "Boolean", // prop
    // ES2018
    dotAll: "Boolean", // prop
})

const BIGINT_PROTO_TYPES: {
    [key in keyof BigInt]: TypeInfo | null
} = createObject({
    ...OBJECT_PROTO_TYPES,
    toString: RETURN_STRING,
    toLocaleString: RETURN_STRING,
    valueOf: RETURN_BIGINT,
})
const FUNCTION_PROTO_TYPES: {
    // eslint-disable-next-line @typescript-eslint/ban-types -- ignore
    [key in keyof Function]: TypeInfo | null
} = createObject({
    ...OBJECT_PROTO_TYPES,
    toString: RETURN_STRING,
    bind: RETURN_FUNCTION,
    length: "Number",
    name: "String",
    apply: UNKNOWN_FUNCTION,
    call: UNKNOWN_FUNCTION,
    arguments: null,
    caller: UNKNOWN_FUNCTION,
    prototype: null,
})

export const PROTO_TYPES: [
    NamedType | OtherTypeName,
    { [key: string]: TypeInfo | null } | null,
][] = [
    ["String", STRING_PROTO_TYPES],
    ["Array", ARRAY_PROTO_TYPES],
    ["Number", NUMBER_PROTO_TYPES],
    ["Boolean", BOOLEAN_PROTO_TYPES],
    ["RegExp", REGEXP_PROTO_TYPES],
    ["BigInt", BIGINT_PROTO_TYPES],
    ["Function", FUNCTION_PROTO_TYPES],
    ["Object", OBJECT_PROTO_TYPES],
    ["undefined", null],
    ["null", null],
]

export const BI_OPERATOR_TYPES: {
    [key in ES.BinaryExpression["operator"]]: TypeInfo | null
} = createObject({
    "==": "Boolean",
    "!=": "Boolean",
    "===": "Boolean",
    "!==": "Boolean",
    "<": "Boolean",
    "<=": "Boolean",
    ">": "Boolean",
    ">=": "Boolean",
    in: "Boolean",
    instanceof: "Boolean",
    "-": "Number",
    "*": "Number",
    "/": "Number",
    "%": "Number",
    "^": "Number",
    "**": "Number",
    "&": "Number",
    "|": "Number",
    "<<": "Number",
    ">>": "Number",
    ">>>": "Number",
    "+": null,
})
export const UN_OPERATOR_TYPES: {
    [key in ES.UnaryExpression["operator"]]: TypeInfo | null
} = createObject({
    "!": "Boolean",
    delete: "Boolean",
    "+": "Number",
    "-": "Number",
    "~": "Number",
    void: "undefined",
    typeof: "String",
})
