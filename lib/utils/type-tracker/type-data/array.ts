import type {
    ITypeClass,
    NamedType,
    OtherTypeName,
    TypeClass,
    TypeInfo,
} from "."
import { RETURN_BOOLEAN } from "./boolean"
import {
    cache,
    createObject,
    getTypeName,
    isEquals,
    isTypeClass,
    RETURN_VOID,
    TypeCollection,
} from "./common"
import type { FunctionType } from "./function"
import { RETURN_NUMBER, NUMBER } from "./number"
import { getObjectPrototypes } from "./object"
import { RETURN_STRING, STRING } from "./string"
import { TypeUnionOrIntersection } from "./union-or-intersection"

export const RETURN_UNKNOWN_ARRAY = returnUnknownArray
export const RETURN_STRING_ARRAY = returnStringArray

export const ARRAY_TYPES: () => {
    [key in keyof ArrayConstructor]: TypeInfo | null
} = cache(() =>
    createObject<
        {
            [key in keyof ArrayConstructor]: TypeInfo | null
        }
    >({
        // ES5
        isArray: RETURN_BOOLEAN,
        // ES2015
        from: RETURN_UNKNOWN_ARRAY,
        of: RETURN_UNKNOWN_ARRAY,
        prototype: null,
    }),
)

const getPrototypes = cache(() =>
    createObject<
        {
            [key in keyof unknown[]]: TypeInfo | null
        }
    >({
        ...getObjectPrototypes(),
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
        forEach: RETURN_VOID,
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

        length: NUMBER,
        0: null, // element
    }),
)

export class TypeArray implements ITypeClass {
    public type = "Array" as const

    private readonly collection: TypeCollection

    private readonly maybeTuple: boolean

    public constructor(
        generator?: () => IterableIterator<TypeInfo | null>,
        maybeTuple?: boolean,
    ) {
        this.collection = new TypeCollection(generator)
        this.maybeTuple = maybeTuple ?? false
    }

    public has(type: NamedType | OtherTypeName): boolean {
        return type === "Array"
    }

    public paramType(index: number): TypeInfo | null {
        if (index === 0) {
            if (this.collection.isOneType()) {
                for (const t of this.collection.all()) {
                    return t
                }
                return null
            }
            return new TypeUnionOrIntersection(() => this.collection.all())
        }
        return null
    }

    public at(index: number): TypeInfo | null {
        if (!this.maybeTuple) {
            return null
        }
        let i = 0
        for (const t of this.collection.tuple()) {
            if (i === index) {
                return t
            }
            i++
        }
        return null
    }

    public propertyType(name: string): TypeInfo | null {
        if (name === "0") {
            return this.paramType(0)
        }
        return getPrototypes()[name as never] || null
    }

    public iterateType(): TypeInfo | null {
        return this.paramType(0)
    }

    public typeNames(): string[] {
        const param0 = getTypeName(this.paramType(0))
        return [`Array${param0 ? `<${param0}>` : ""}`]
    }

    public equals(o: TypeClass): boolean {
        if (o.type !== "Array") {
            return false
        }
        return isEquals(this.paramType(0), o.paramType(0))
    }
}
export const UNKNOWN_ARRAY = new TypeArray()
export const STRING_ARRAY = new TypeArray(() => [STRING][Symbol.iterator]())

/**
 * Function Type that Return unknown array
 */
function returnUnknownArray(): TypeArray {
    return UNKNOWN_ARRAY
}

/**
 * Function Type that Return unknown array
 */
function returnStringArray(): TypeArray {
    return STRING_ARRAY
}

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
            if (isTypeClass(s)) {
                yield s.iterateType()
            } else {
                yield null
            }
        }
    })
}
