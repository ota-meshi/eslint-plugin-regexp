import type {
    FunctionType,
    ITypeClass,
    NamedType,
    OtherTypeName,
    TypeInfo,
} from "."
import { isTypeClass } from "."
import {
    createObject,
    RETURN_BOOLEAN,
    RETURN_OBJECT,
    RETURN_STRING,
    RETURN_STRING_ARRAY,
    RETURN_UNKNOWN_ARRAY,
    UNKNOWN_FUNCTION,
} from "./common"

export const OBJECT_TYPES: {
    [key in keyof ObjectConstructor]: TypeInfo | null
} = createObject({
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
})
export const OBJECT_PROTO_TYPES: {
    // eslint-disable-next-line @typescript-eslint/ban-types -- ignore
    [key in keyof object]: TypeInfo | null
} = createObject({
    // ES5
    constructor: UNKNOWN_FUNCTION,
    toString: RETURN_STRING,
    toLocaleString: RETURN_STRING,
    valueOf: RETURN_OBJECT,
    hasOwnProperty: RETURN_BOOLEAN,
    isPrototypeOf: RETURN_BOOLEAN,
    propertyIsEnumerable: RETURN_BOOLEAN,
})

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
        for (const data of this.propertiesIterator) {
            if (this.properties[data[0]]) {
                continue
            }
            this.properties[data[0]] = data[1]
            yield data
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

    public property(name: string): TypeInfo | null {
        const getType = this.properties[name]
        if (getType) {
            return getType()
        }
        for (const [key, getValue] of this.iter()) {
            if (key === name) {
                return getValue()
            }
        }
        return OBJECT_PROTO_TYPES[name as never] || null
    }

    public typeNames(): string[] {
        return ["Object"]
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
