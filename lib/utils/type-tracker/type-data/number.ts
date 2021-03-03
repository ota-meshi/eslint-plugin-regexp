import type { ITypeClass, NamedType, OtherTypeName, TypeInfo } from "."
import { RETURN_BOOLEAN } from "./boolean"
import { cache, createObject } from "./common"
import { getObjectPrototypes } from "./object"
import { RETURN_STRING } from "./string"

export const RETURN_NUMBER = returnNumber

export class TypeNumber implements ITypeClass {
    public type = "Number" as const

    public has(type: NamedType | OtherTypeName): boolean {
        return type === "Number"
    }

    public paramType(): null {
        return null
    }

    public propertyType(name: string): TypeInfo | null {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define -- ignore
        return getPrototypes()[name as never] || null
    }

    public iterateType(): null {
        return null
    }

    public typeNames(): string[] {
        return ["Number"]
    }
}
export const NUMBER = new TypeNumber()

export const NUMBER_TYPES: () => {
    [key in keyof NumberConstructor]: TypeInfo | null
} = cache(() =>
    createObject<
        {
            [key in keyof NumberConstructor]: TypeInfo | null
        }
    >({
        // ES5
        MAX_VALUE: NUMBER, // prop
        MIN_VALUE: NUMBER, // prop
        NaN: NUMBER, // prop
        NEGATIVE_INFINITY: NUMBER, // prop
        POSITIVE_INFINITY: NUMBER, // prop
        // ES2015
        EPSILON: NUMBER, // prop
        isFinite: RETURN_BOOLEAN,
        isInteger: RETURN_BOOLEAN,
        isNaN: RETURN_BOOLEAN,
        isSafeInteger: RETURN_BOOLEAN,
        MAX_SAFE_INTEGER: NUMBER, // prop
        MIN_SAFE_INTEGER: NUMBER, // prop
        parseFloat: RETURN_NUMBER,
        parseInt: RETURN_NUMBER,

        prototype: null,
    }),
)

const getPrototypes: () => {
    [key in keyof number]: TypeInfo | null
} = cache(() =>
    createObject<
        {
            [key in keyof number]: TypeInfo | null
        }
    >({
        ...getObjectPrototypes(),
        // ES5
        toString: RETURN_STRING,
        toFixed: RETURN_STRING,
        toExponential: RETURN_STRING,
        toPrecision: RETURN_STRING,
        valueOf: RETURN_NUMBER,
        toLocaleString: RETURN_STRING,
    }),
)

/** Function Type that Return number */
function returnNumber(): TypeNumber {
    return NUMBER
}
