import type {
    ITypeClass,
    NamedType,
    OtherTypeName,
    TypeClass,
    TypeInfo,
} from "."
import { cache, createObject, getTypeName, isEquals } from "./common"
import { getObjectPrototypes } from "./object"

type IterableKeys = keyof Iterable<unknown>

const getPrototypes: () => {
    [key in IterableKeys]: TypeInfo | null
} = cache(() => {
    return createObject<
        {
            [key in IterableKeys]: TypeInfo | null
        }
    >({
        ...getObjectPrototypes(),
    })
})

export class TypeIterable implements ITypeClass {
    public type = "Iterable" as const

    private readonly param0: () => TypeInfo | null

    public constructor(param0: () => TypeInfo | null) {
        this.param0 = param0
    }

    public has(_type: NamedType | OtherTypeName): boolean {
        return false // type === "Iterable"
    }

    public paramType(index: number): TypeInfo | null {
        if (index === 0) {
            return this.param0()
        }
        return null
    }

    public propertyType(name: string): TypeInfo | null {
        return getPrototypes()[name as never] || null
    }

    public iterateType(): TypeInfo | null {
        return this.paramType(0)
    }

    public returnType(): null {
        return null
    }

    public typeNames(): string[] {
        const param0 = getTypeName(this.iterateType())
        return [`Iterable${param0 != null ? `<${param0}>` : ""}`]
    }

    public equals(o: TypeClass): boolean {
        if (o.type !== "Iterable") {
            return false
        }
        return isEquals(this.iterateType(), o.iterateType())
    }
}

export const UNKNOWN_ITERABLE = new TypeIterable(() => null)
