import type {
    ITypeClass,
    NamedType,
    OtherTypeName,
    TypeClass,
    TypeInfo,
} from "."
import { cache, createObject } from "./common"
import { getObjectPrototypes } from "./object"
import { RETURN_STRING } from "./string"

export const RETURN_BIGINT = returnBigInt

export const BIGINT_TYPES: () => {
    [key in keyof BigIntConstructor]: TypeInfo | null
} = cache(() =>
    createObject<
        {
            [key in keyof BigIntConstructor]: TypeInfo | null
        }
    >({
        asIntN: RETURN_BIGINT,
        asUintN: RETURN_BIGINT,
        prototype: null,
    }),
)
export class TypeBigInt implements ITypeClass {
    public type = "BigInt" as const

    public has(type: NamedType | OtherTypeName): boolean {
        return type === "BigInt"
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
        return ["BigInt"]
    }

    public equals(o: TypeClass): boolean {
        return o.type === "BigInt"
    }
}
export const BIGINT = new TypeBigInt()

const getPrototypes: () => {
    [key in keyof BigInt]: TypeInfo | null
} = cache(() =>
    createObject<
        {
            [key in keyof BigInt]: TypeInfo | null
        }
    >({
        ...getObjectPrototypes(),
        toString: RETURN_STRING,
        toLocaleString: RETURN_STRING,
        valueOf: RETURN_BIGINT,
    }),
)

/** Function Type that Return BigInt */
function returnBigInt(): TypeBigInt {
    return BIGINT
}
