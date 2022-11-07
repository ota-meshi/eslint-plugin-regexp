import type {
    ITypeClass,
    NamedType,
    OtherTypeName,
    TypeClass,
    TypeInfo,
} from "."
import { STRING } from "./string"
import { cache, createObject } from "./common"
import { RETURN_BIGINT, RETURN_STRING, TypeGlobalFunction } from "./function"
import { getObjectPrototypes } from "./object"

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

    public returnType(): null {
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

/** Build BigInt constructor type */
export function buildBigIntConstructor(): TypeGlobalFunction {
    const BIGINT_TYPES = createObject<{
        [key in keyof BigIntConstructor]: TypeInfo | null
    }>({
        asIntN: RETURN_BIGINT,
        asUintN: RETURN_BIGINT,
        prototype: null,
    })
    return new TypeGlobalFunction(() => BIGINT, BIGINT_TYPES)
}
const getPrototypes: () => {
    [key in keyof bigint]: TypeInfo | null
} = cache(() =>
    createObject<{
        [key in keyof bigint]: TypeInfo | null
    }>({
        ...getObjectPrototypes(),
        toString: RETURN_STRING,
        toLocaleString: RETURN_STRING,
        valueOf: RETURN_BIGINT,

        [Symbol.toStringTag]: STRING,
    }),
)
