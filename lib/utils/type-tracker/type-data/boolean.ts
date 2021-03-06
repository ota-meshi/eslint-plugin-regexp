import type {
    ITypeClass,
    NamedType,
    OtherTypeName,
    TypeClass,
    TypeInfo,
} from "."
import { cache, createObject } from "./common"
import { RETURN_BOOLEAN, TypeGlobalFunction } from "./function"
import { getObjectPrototypes } from "./object"

export class TypeBoolean implements ITypeClass {
    public type = "Boolean" as const

    public has(type: NamedType | OtherTypeName): boolean {
        return type === "Boolean"
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
        return ["Boolean"]
    }

    public equals(o: TypeClass): boolean {
        return o.type === "Boolean"
    }
}
export const BOOLEAN = new TypeBoolean()

/** Build BigInt constructor type */
export function buildBooleanConstructor(): TypeGlobalFunction {
    const BOOLEAN_TYPES = createObject<
        {
            [key in keyof BooleanConstructor]: TypeInfo | null
        }
    >({
        prototype: null,
    })
    return new TypeGlobalFunction(() => BOOLEAN, BOOLEAN_TYPES)
}

const getPrototypes: () => {
    [key in keyof boolean]: TypeInfo | null
} = cache(() =>
    createObject<
        {
            [key in keyof boolean]: TypeInfo | null
        }
    >({
        ...getObjectPrototypes(),
        // ES5
        valueOf: RETURN_BOOLEAN,
    }),
)
