import type {
    ITypeClass,
    NamedType,
    OtherTypeName,
    TypeClass,
    TypeInfo,
} from "."
import { cache, createObject } from "./common"
import {
    RETURN_NUMBER,
    RETURN_STRING,
    RETURN_BOOLEAN,
    TypeGlobalFunction,
} from "./function"
import { getObjectPrototypes } from "./object"

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

    public returnType(): null {
        return null
    }

    public typeNames(): string[] {
        return ["Number"]
    }

    public equals(o: TypeClass): boolean {
        return o.type === "Number"
    }
}
export const NUMBER = new TypeNumber()

/** Build Number constructor type */
export function buildNumberConstructor(): TypeGlobalFunction {
    const NUMBER_TYPES = createObject<
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
    })
    return new TypeGlobalFunction(() => NUMBER, NUMBER_TYPES)
}
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
