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
    TypeGlobalFunction,
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
import { TypeIterable } from "./iterable"

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
            return TypeUnionOrIntersection.buildType(() =>
                this.collection.all(),
            )
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
        // eslint-disable-next-line @typescript-eslint/no-use-before-define -- ignore
        return getPrototypes()[name as never] || null
    }

    public iterateType(): TypeInfo | null {
        return this.paramType(0)
    }

    public returnType(): null {
        return null
    }

    public typeNames(): string[] {
        const param0 = getTypeName(this.iterateType())
        return [`Array${param0 ? `<${param0}>` : ""}`]
    }

    public equals(o: TypeClass): boolean {
        if (o.type !== "Array") {
            return false
        }
        return isEquals(this.iterateType(), o.iterateType())
    }
}
export const UNKNOWN_ARRAY = new TypeArray()
export const STRING_ARRAY = new TypeArray(() => [STRING][Symbol.iterator]())

/** Build Array constructor type */
export function buildArrayConstructor(): TypeGlobalFunction {
    const ARRAY_TYPES = createObject<
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
    })
    return new TypeGlobalFunction(() => UNKNOWN_ARRAY, ARRAY_TYPES)
}

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
    const RETURN_ENTRIES = new TypeFunction(
        /**
         * Function Type that Return entries
         */
        function (selfType) {
            return new TypeIterable(() => {
                return new TypeArray(function* () {
                    yield NUMBER
                    const type = selfType?.()
                    if (isTypeClass(type)) {
                        yield type.iterateType()
                    }
                })
            })
        },
    )
    const RETURN_KEYS = new TypeFunction(
        /**
         * Function Type that Return keys
         */
        function () {
            return new TypeIterable(() => {
                return NUMBER
            })
        },
    )
    const RETURN_VALUES = new TypeFunction(
        /**
         * Function Type that Return values
         */
        function (selfType) {
            return new TypeIterable(() => {
                const type = selfType?.()
                if (isTypeClass(type)) {
                    return type.iterateType()
                }
                return null
            })
        },
    )
    const RETURN_MAP = new TypeFunction(
        /**
         * Function Type that Return map
         */
        function (selfType, [argType]) {
            return new TypeArray(function* () {
                const type = argType?.()
                if (isTypeClass(type)) {
                    yield type.returnType(selfType, [
                        () => {
                            const s = selfType?.()
                            return isTypeClass(s) ? s.iterateType() : null
                        },
                        () => NUMBER,
                    ])
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
        map: RETURN_MAP,
        filter: RETURN_SELF,
        reduce: null, // unknown
        reduceRight: null, // unknown
        // ES2015
        find: RETURN_ARRAY_ELEMENT, // element
        findIndex: RETURN_NUMBER,
        fill: RETURN_UNKNOWN_ARRAY,
        copyWithin: RETURN_SELF,
        entries: RETURN_ENTRIES, // IterableIterator
        keys: RETURN_KEYS, // IterableIterator
        values: RETURN_VALUES, // IterableIterator
        // ES2016
        includes: RETURN_BOOLEAN,
        // ES2019
        flatMap: RETURN_UNKNOWN_ARRAY,
        flat: RETURN_UNKNOWN_ARRAY,

        length: NUMBER,
        0: null, // element
    })
})
