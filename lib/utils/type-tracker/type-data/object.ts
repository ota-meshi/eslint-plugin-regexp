import type {
    ITypeClass,
    NamedType,
    OtherTypeName,
    TypeClass,
    TypeInfo,
} from "."
import { isTypeClass } from "."
import { RETURN_STRING_ARRAY, RETURN_UNKNOWN_ARRAY } from "./array"
import { RETURN_BOOLEAN } from "./boolean"
import { cache, createObject } from "./common"
import type { FunctionType } from "./function"
import { UNKNOWN_FUNCTION } from "./function"
import { RETURN_STRING } from "./string"

export const RETURN_OBJECT = returnObject

export const OBJECT_TYPES: () => {
    [key in keyof ObjectConstructor]: TypeInfo | null
} = cache(() =>
    createObject<
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
        seal: returnArg,
        freeze: returnArg,
        preventExtensions: null,
        isSealed: RETURN_BOOLEAN,
        isFrozen: RETURN_BOOLEAN,
        isExtensible: RETURN_BOOLEAN,
        keys: RETURN_STRING_ARRAY,
        // ES2015
        assign: returnAssign,
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
    }),
)
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
        valueOf: RETURN_OBJECT,
        hasOwnProperty: RETURN_BOOLEAN,
        isPrototypeOf: RETURN_BOOLEAN,
        propertyIsEnumerable: RETURN_BOOLEAN,
    }),
)

export class TypeObject implements ITypeClass {
    public type = "Object" as const

    private properties: Record<string, () => TypeInfo | null> = Object.create(
        null,
    )

    private readonly propertiesIterator: IterableIterator<
        [string, () => TypeInfo | null]
    >

    public constructor(
        propertiesGenerator?: () => IterableIterator<
            [string, () => TypeInfo | null]
        >,
    ) {
        this.propertiesIterator =
            propertiesGenerator?.() ?? [][Symbol.iterator]()
    }

    private *iter(): IterableIterator<[string, () => TypeInfo | null]> {
        let e = this.propertiesIterator.next()
        while (!e.done) {
            const data = e.value
            if (!this.properties[data[0]]) {
                this.properties[data[0]] = data[1]
                yield data
            }
            e = this.propertiesIterator.next()
        }
    }

    public *allProperties(): IterableIterator<[string, () => TypeInfo | null]> {
        yield* Object.entries(this.properties)
        yield* this.iter()
    }

    public has(type: NamedType | OtherTypeName): boolean {
        return type === "Object"
    }

    public paramType(): null {
        return null
    }

    public propertyType(name: string): TypeInfo | null {
        const getType = this.properties[name]
        if (getType) {
            return getType()
        }
        for (const [key, getValue] of this.iter()) {
            if (key === name) {
                return getValue()
            }
        }
        return getObjectPrototypes()[name as never] || null
    }

    public iterateType(): TypeInfo {
        return this
    }

    public typeNames(): string[] {
        return ["Object"]
    }

    public equals(o: TypeClass): boolean {
        return o instanceof TypeObject
    }
}

export const UNKNOWN_OBJECT = new TypeObject()

/**
 * Function Type that Return argument
 */
function returnArg(
    _selfType: Parameters<FunctionType>[0],
    argTypes: Parameters<FunctionType>[1],
): ReturnType<FunctionType> {
    return argTypes[0]?.() ?? null
}

/**
 * Function Type that Return assign objects
 */
function returnAssign(
    selfType: Parameters<FunctionType>[0],
    argTypes: Parameters<FunctionType>[1],
): ReturnType<FunctionType> {
    return new TypeObject(function* () {
        for (const getType of [selfType, ...argTypes].reverse()) {
            const s = getType?.()
            if (isTypeClass(s) && s.type === "Object") {
                yield* s.allProperties()
            }
        }
    })
}

/** Function Type that Return Object */
function returnObject(): TypeObject {
    return UNKNOWN_OBJECT
}
