import type {
    ITypeClass,
    NamedType,
    OtherTypeName,
    TypeClass,
    TypeInfo,
} from "."
import type { TypeArray } from "./array"
import { STRING_ARRAY, UNKNOWN_ARRAY } from "./array"
import type { TypeBigInt } from "./bigint"
import { BIGINT } from "./bigint"
import type { TypeBoolean } from "./boolean"
import { BOOLEAN } from "./boolean"
import { cache, createObject } from "./common"
import type { TypeMap } from "./map"
import { UNKNOWN_MAP } from "./map"
import type { TypeNumber } from "./number"
import { NUMBER } from "./number"
import type { TypeObject } from "./object"
import { getObjectPrototypes, UNKNOWN_OBJECT } from "./object"
import type { TypeRegExp } from "./regexp"
import { REGEXP } from "./regexp"
import type { TypeString } from "./string"
import { STRING } from "./string"

type FunctionArg = (
    thisType: (() => TypeInfo | null) | null,
    argTypes: ((() => TypeInfo | null) | null)[],
) => TypeInfo | null

export class TypeFunction implements ITypeClass {
    public type = "Function" as const

    public fn: FunctionArg

    public constructor(fn: FunctionArg) {
        this.fn = fn
    }

    public has(type: NamedType | OtherTypeName): boolean {
        return type === "Function"
    }

    public returnType(
        thisType: (() => TypeInfo | null) | null,
        argTypes: ((() => TypeInfo | null) | null)[],
    ): TypeInfo | null {
        return this.fn(thisType, argTypes)
    }

    public paramType(): null {
        return null
    }

    public propertyType(name: string): TypeInfo | null {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define -- ignore
        return getFunctionPrototypes()[name as never] || null
    }

    public iterateType(): null {
        return null
    }

    public typeNames(): string[] {
        return ["Function"]
    }

    public equals(_o: TypeClass): boolean {
        return false
    }
}

export const UNKNOWN_FUNCTION = new TypeFunction(returnUnknown)

export const RETURN_UNKNOWN_FUNCTION = new TypeFunction(returnFunction)

export const RETURN_VOID = new TypeFunction(
    /** Function Type that Return void */
    function retVoid(): "undefined" {
        return "undefined"
    },
)
export const RETURN_STRING = new TypeFunction(
    /** Function Type that Return string */
    function returnString(): TypeString {
        return STRING
    },
)

export const RETURN_NUMBER = new TypeFunction(
    /** Function Type that Return number */
    function returnNumber(): TypeNumber {
        return NUMBER
    },
)
export const RETURN_BOOLEAN = new TypeFunction(
    /** Function Type that Return boolean */
    function returnBoolean(): TypeBoolean {
        return BOOLEAN
    },
)

export const RETURN_UNKNOWN_ARRAY = new TypeFunction(
    /**
     * Function Type that Return unknown array
     */
    function returnUnknownArray(): TypeArray {
        return UNKNOWN_ARRAY
    },
)
export const RETURN_STRING_ARRAY = new TypeFunction(
    /**
     * Function Type that Return unknown array
     */
    function returnStringArray(): TypeArray {
        return STRING_ARRAY
    },
)
export const RETURN_UNKNOWN_OBJECT = new TypeFunction(
    /** Function Type that Return Object */
    function returnObject(): TypeObject {
        return UNKNOWN_OBJECT
    },
)
export const RETURN_REGEXP = new TypeFunction(
    /** Function Type that Return RegExp */
    function returnRegExp(): TypeRegExp {
        return REGEXP
    },
)

export const RETURN_BIGINT = new TypeFunction(
    /** Function Type that Return BigInt */
    function returnBigInt(): TypeBigInt {
        return BIGINT
    },
)

export const RETURN_UNKNOWN_MAP = new TypeFunction(
    /**
     * Function Type that Return unknown array
     */
    function returnUnknownMap(): TypeMap {
        return UNKNOWN_MAP
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
export const getFunctionPrototypes: () => {
    // eslint-disable-next-line @typescript-eslint/ban-types -- ignore
    [key in keyof Function]: TypeInfo | null
} = cache(() =>
    createObject<
        {
            // eslint-disable-next-line @typescript-eslint/ban-types -- ignore
            [key in keyof Function]: TypeInfo | null
        }
    >({
        ...getObjectPrototypes(),
        toString: RETURN_STRING,
        bind: RETURN_SELF,
        length: NUMBER,
        name: STRING,
        apply: UNKNOWN_FUNCTION,
        call: UNKNOWN_FUNCTION,
        arguments: null,
        caller: UNKNOWN_FUNCTION,
        prototype: null,
    }),
)

/** Unknown Function Type */
function returnUnknown(): null {
    return null
}

/** Function Type that Return Function */
function returnFunction(): TypeFunction {
    return UNKNOWN_FUNCTION
}
