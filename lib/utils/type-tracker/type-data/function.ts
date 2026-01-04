import { lazy } from "../../util.ts"
import type { TypeArray } from "./array.ts"
import { STRING_ARRAY, UNKNOWN_ARRAY } from "./array.ts"
import type { TypeBigInt } from "./bigint.ts"
import { BIGINT } from "./bigint.ts"
import type { TypeBoolean } from "./boolean.ts"
import { BOOLEAN } from "./boolean.ts"
import { createObject } from "./common.ts"
import type {
    ITypeClass,
    NamedType,
    OtherTypeName,
    TypeClass,
    TypeInfo,
} from "./index.ts"
import type { TypeNumber } from "./number.ts"
import { NUMBER } from "./number.ts"
import type { TypeObject } from "./object.ts"
import { getObjectPrototypes, UNKNOWN_OBJECT } from "./object.ts"
import type { TypeRegExp } from "./regexp.ts"
import { REGEXP } from "./regexp.ts"
import type { TypeString } from "./string.ts"
import { STRING } from "./string.ts"

type FunctionArg = (
    thisType: (() => TypeInfo | null) | null,
    argTypes: ((() => TypeInfo | null) | null)[],
    meta?: { isConstructor?: boolean },
) => TypeInfo | null

export class TypeFunction implements ITypeClass {
    public type = "Function" as const

    private readonly fn: FunctionArg

    public constructor(fn: FunctionArg) {
        this.fn = fn
    }

    public has(type: NamedType | OtherTypeName): boolean {
        return type === "Function"
    }

    public returnType(
        thisType: (() => TypeInfo | null) | null,
        argTypes: ((() => TypeInfo | null) | null)[],
        meta?: { isConstructor?: boolean },
    ): TypeInfo | null {
        return this.fn(thisType, argTypes, meta)
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
        return ["Function"]
    }

    public equals(_o: TypeClass): boolean {
        return false
    }
}

export class TypeGlobalFunction extends TypeFunction {
    private readonly props: {
        [key: string]: TypeInfo | null
    }

    public constructor(
        fn: FunctionArg,
        props: {
            [key: string]: TypeInfo | null
        },
    ) {
        super(fn)
        this.props = props
    }

    public propertyType(name: string): TypeInfo | null {
        return this.props[name] || super.propertyType(name)
    }
}

export const UNKNOWN_FUNCTION = new TypeFunction(
    /** Unknown Function Type */
    function returnUnknown(): null {
        return null
    },
)
/** Build Function constructor type */
export function buildFunctionConstructor(): TypeGlobalFunction {
    const FUNCTION_TYPES = createObject<{
        [key in keyof FunctionConstructor]: TypeInfo | null
    }>({
        prototype: null,
    })
    return new TypeGlobalFunction(
        /** Function Type that Return Function */
        function returnFunction(): TypeFunction {
            return UNKNOWN_FUNCTION
        },
        FUNCTION_TYPES,
    )
}

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

const RETURN_SELF = new TypeFunction(
    /**
     * Function Type that Return self array
     */
    function returnSelf(selfType) {
        return selfType?.() ?? null
    },
)
const getPrototypes: () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type -- ignore
    [key in keyof Function]: TypeInfo | null
} = lazy(() =>
    createObject<{
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type -- ignore
        [key in keyof Function]: TypeInfo | null
    }>({
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
        [Symbol.hasInstance]: null,
        [Symbol.metadata]: null,
    }),
)
