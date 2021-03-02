import type {
    FunctionType,
    ITypeClass,
    NamedType,
    OtherTypeName,
    TypeInfo,
} from "."
import {
    createObject,
    isTypeClass,
    RETURN_BOOLEAN,
    RETURN_NUMBER,
    RETURN_STRING,
    RETURN_UNKNOWN_ARRAY,
} from "./common"
import { TypeUnionOrIntersection } from "./union-or-intersection"

export const ARRAY_TYPES: {
    [key in keyof ArrayConstructor]: TypeInfo | null
} = createObject({
    // ES5
    isArray: RETURN_BOOLEAN,
    // ES2015
    from: RETURN_UNKNOWN_ARRAY,
    of: RETURN_UNKNOWN_ARRAY,

    prototype: null,
})

export const ARRAY_PROTO_TYPES: {
    [key in keyof unknown[]]: TypeInfo | null
} = createObject({
    // ES5
    toString: RETURN_STRING,
    toLocaleString: RETURN_STRING,
    pop: returnArrayElement, // element
    push: RETURN_NUMBER,
    concat: returnConcat,
    join: RETURN_STRING,
    reverse: returnSelf,
    shift: returnArrayElement, // element
    slice: returnSelf,
    sort: returnSelf,
    splice: returnSelf,
    unshift: RETURN_NUMBER,
    indexOf: RETURN_NUMBER,
    lastIndexOf: RETURN_NUMBER,
    every: RETURN_BOOLEAN,
    some: RETURN_BOOLEAN,
    forEach: () => "undefined" as const,
    map: RETURN_UNKNOWN_ARRAY,
    filter: returnSelf,
    reduce: null, // unknown
    reduceRight: null, // unknown
    // ES2015
    find: returnArrayElement, // element
    findIndex: RETURN_NUMBER,
    fill: RETURN_UNKNOWN_ARRAY,
    copyWithin: returnSelf,
    entries: null, // IterableIterator
    keys: null, // IterableIterator
    values: null, // IterableIterator
    // ES2016
    includes: RETURN_BOOLEAN,
    // ES2019
    flatMap: RETURN_UNKNOWN_ARRAY,
    flat: RETURN_UNKNOWN_ARRAY,

    length: "Number",
    0: null, // element
})

export class TypeArray implements ITypeClass {
    public type = "Array" as const

    private readonly param0: TypeUnionOrIntersection

    public constructor(generator?: () => IterableIterator<TypeInfo>) {
        this.param0 = new TypeUnionOrIntersection(generator)
    }

    public has(type: NamedType | OtherTypeName): boolean {
        return type === "Array"
    }

    public paramType(index: number): TypeUnionOrIntersection | null {
        if (index === 0) {
            return this.param0
        }
        return null
    }

    public property(name: string): TypeInfo | null {
        if (name === "0") {
            return this.paramType(0)
        }
        return ARRAY_PROTO_TYPES[name as never] || null
    }

    public typeNames(): string[] {
        const param = this.paramType(0)?.typeNames().join("|")
        return [`Array${param ? `<${param}>` : ""}`]
    }
}
export const UNKNOWN_ARRAY = new TypeArray()
export const STRING_ARRAY = new TypeArray(() =>
    ["String" as const][Symbol.iterator](),
)

/**
 * Function Type that Return array element
 */
function returnArrayElement(
    selfType: Parameters<FunctionType>[0],
): ReturnType<FunctionType> {
    const type = selfType?.()
    if (!isTypeClass(type)) {
        return null
    }
    return type.paramType(0)
}

/**
 * Function Type that Return self array
 */
function returnSelf(
    selfType: Parameters<FunctionType>[0],
): ReturnType<FunctionType> {
    return selfType?.() ?? null
}

/**
 * Function Type that Return concat array
 */
function returnConcat(
    selfType: Parameters<FunctionType>[0],
    argTypes: Parameters<FunctionType>[1],
): ReturnType<FunctionType> {
    return new TypeArray(function* () {
        for (const getType of [selfType, ...argTypes]) {
            const s = getType?.()
            if (isTypeClass(s) && s.type === "Array") {
                const e = s.paramType(0)
                if (e) {
                    yield e
                }
            }
        }
    })
}
