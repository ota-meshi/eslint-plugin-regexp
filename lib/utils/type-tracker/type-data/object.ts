import type {
    ITypeClass,
    NamedType,
    OtherTypeName,
    TypeClass,
    TypeInfo,
} from "."
import { cache, createObject, isEquals, isTypeClass } from "./common"
import {
    RETURN_STRING,
    RETURN_BOOLEAN,
    RETURN_STRING_ARRAY,
    RETURN_UNKNOWN_ARRAY,
    RETURN_UNKNOWN_OBJECT,
    TypeFunction,
    UNKNOWN_FUNCTION,
    TypeGlobalFunction,
} from "./function"

export const getObjectPrototypes: () => {
    // eslint-disable-next-line @typescript-eslint/ban-types -- ignore
    [key in keyof object]: TypeInfo | null
} = cache(() =>
    createObject<
        {
            // eslint-disable-next-line @typescript-eslint/ban-types -- ignore
            [key in keyof object]: TypeInfo | null
        }
    >({
        // ES5
        constructor: UNKNOWN_FUNCTION,
        toString: RETURN_STRING,
        toLocaleString: RETURN_STRING,
        valueOf: RETURN_UNKNOWN_OBJECT,
        hasOwnProperty: RETURN_BOOLEAN,
        isPrototypeOf: RETURN_BOOLEAN,
        propertyIsEnumerable: RETURN_BOOLEAN,
    }),
)

export class TypeObject implements ITypeClass {
    public type = "Object" as const

    private readonly propertiesGenerator: () => IterableIterator<
        [string, () => TypeInfo | null]
    >

    public constructor(
        propertiesGenerator?: () => IterableIterator<
            [string, () => TypeInfo | null]
        >,
    ) {
        this.propertiesGenerator =
            propertiesGenerator ??
            (() => {
                return [][Symbol.iterator]()
            })
    }

    public *allProperties(): IterableIterator<[string, () => TypeInfo | null]> {
        const set = new Set()
        for (const t of this.propertiesGenerator()) {
            if (set.has(t[0])) {
                continue
            }
            set.add(t[0])
            yield t
        }
    }

    public has(type: NamedType | OtherTypeName): boolean {
        return type === "Object"
    }

    public paramType(): null {
        return null
    }

    public propertyType(name: string): TypeInfo | null {
        for (const [key, getValue] of this.allProperties()) {
            if (key === name) {
                return getValue()
            }
        }
        return getObjectPrototypes()[name as never] || null
    }

    public iterateType(): null {
        return null
    }

    public returnType(): null {
        return null
    }

    public typeNames(): string[] {
        return ["Object"]
    }

    public equals(o: TypeClass): boolean {
        if (o.type !== "Object") {
            return false
        }

        const itr2 = o.allProperties()
        const props2 = new Map<string, () => TypeInfo | null>()
        for (const [key1, get1] of this.allProperties()) {
            const get2 = props2.get(key1)
            if (get2) {
                if (!isEquals(get1(), get2())) {
                    return false
                }
            } else {
                let e2 = itr2.next()
                while (!e2.done) {
                    const [key2, get] = e2.value
                    props2.set(key2, get)
                    if (key1 === key2) {
                        if (!isEquals(get1(), get())) {
                            return false
                        }
                        break
                    }
                    e2 = itr2.next()
                }
                if (e2.done) {
                    return false
                }
            }
        }
        const e2 = itr2.next()
        if (!e2.done) {
            return false
        }
        return true
    }
}

export const UNKNOWN_OBJECT = new TypeObject()

/** Build Object constructor type */
export function buildObjectConstructor(): TypeGlobalFunction {
    const RETURN_ARG = new TypeFunction(
        /**
         * Function Type that Return argument
         */
        function returnArg(_selfType, argTypes) {
            return argTypes[0]?.() ?? null
        },
    )
    const RETURN_ASSIGN = new TypeFunction(
        /**
         * Function Type that Return assign objects
         */
        function returnAssign(selfType, argTypes) {
            return new TypeObject(function* () {
                for (const getType of [selfType, ...argTypes].reverse()) {
                    const s = getType?.()
                    if (isTypeClass(s) && s.type === "Object") {
                        yield* s.allProperties()
                    }
                }
            })
        },
    )
    const OBJECT_TYPES = createObject<
        {
            [key in keyof ObjectConstructor]: TypeInfo | null
        }
    >({
        // ES5
        getPrototypeOf: null,
        getOwnPropertyDescriptor: null,
        getOwnPropertyNames: RETURN_STRING_ARRAY,
        create: null,
        defineProperty: null,
        defineProperties: null,
        seal: RETURN_ARG,
        freeze: RETURN_ARG,
        preventExtensions: null,
        isSealed: RETURN_BOOLEAN,
        isFrozen: RETURN_BOOLEAN,
        isExtensible: RETURN_BOOLEAN,
        keys: RETURN_STRING_ARRAY,
        // ES2015
        assign: RETURN_ASSIGN,
        getOwnPropertySymbols: RETURN_UNKNOWN_ARRAY,
        is: RETURN_BOOLEAN,
        setPrototypeOf: null,
        // ES2017
        values: RETURN_UNKNOWN_ARRAY,
        entries: RETURN_UNKNOWN_ARRAY,
        getOwnPropertyDescriptors: null,
        // ES2019
        fromEntries: null,

        prototype: null,
    })

    return new TypeGlobalFunction(
        (_thisType, [argType]) => argType?.() ?? UNKNOWN_OBJECT,
        OBJECT_TYPES,
    )
}
