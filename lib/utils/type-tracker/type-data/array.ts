import type {
    ITypeClass,
    NamedType,
    OtherTypeName,
    TypeClass,
    TypeInfo,
} from "."
import {
    RETURN_NUMBER,
    RETURN_STRING,
    RETURN_UNKNOWN_ARRAY,
    RETURN_VOID,
    TypeFunction,
    RETURN_BOOLEAN,
} from "./function"
import {
    cache,
    createObject,
    getTypeName,
    isEquals,
    isTypeClass,
    TypeCollection,
} from "./common"
import { NUMBER } from "./number"
import { getObjectPrototypes } from "./object"
import { STRING } from "./string"
import { TypeUnionOrIntersection } from "./union-or-intersection"

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

const getPrototypes = cache(() => {
    const RETURN_ARRAY_ELEMENT = new TypeFunction(
        /**
         * Function Type that Return array element
         */
        function returnArrayElement(selfType) {
            const type = selfType?.()
            if (!isTypeClass(type)) {
                return null
            }
            return type.paramType(0)
        },
    )
    const RETURN_SELF = new TypeFunction(
        /**
         * Function Type that Return self array
         */
        function returnSelf(selfType) {
            return selfType?.() ?? null
        },
    )
    const RETURN_CONCAT = new TypeFunction(
        /**
         * Function Type that Return concat array
         */
        function returnConcat(selfType, argTypes) {
            // eslint-disable-next-line @typescript-eslint/no-use-before-define -- ignore
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
        },
    )
    return createObject<
        {
            [key in keyof unknown[]]: TypeInfo | null
        }
    >({
        ...getObjectPrototypes(),
        // ES5
        toString: RETURN_STRING,
        toLocaleString: RETURN_STRING,
        pop: RETURN_ARRAY_ELEMENT, // element
        push: RETURN_NUMBER,
        concat: RETURN_CONCAT,
        join: RETURN_STRING,
        reverse: RETURN_SELF,
        shift: RETURN_ARRAY_ELEMENT, // element
        slice: RETURN_SELF,
        sort: RETURN_SELF,
        splice: RETURN_SELF,
        unshift: RETURN_NUMBER,
        indexOf: RETURN_NUMBER,
        lastIndexOf: RETURN_NUMBER,
        every: RETURN_BOOLEAN,
        some: RETURN_BOOLEAN,
        forEach: RETURN_VOID,
        map: RETURN_UNKNOWN_ARRAY,
        filter: RETURN_SELF,
        reduce: null, // unknown
        reduceRight: null, // unknown
        // ES2015
        find: RETURN_ARRAY_ELEMENT, // element
        findIndex: RETURN_NUMBER,
        fill: RETURN_UNKNOWN_ARRAY,
        copyWithin: RETURN_SELF,
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
    })
})

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

    public returnType(): null {
        return null
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
