import type { ITypeClass, NamedType, OtherTypeName, TypeInfo } from "."
import { isTypeClass } from "."
import { RETURN_BOOLEAN } from "./boolean"
import { cache, createObject, RETURN_VOID } from "./common"
import type { FunctionType } from "./function"
import { NUMBER } from "./number"
import { getObjectPrototypes } from "./object"

export const RETURN_UNKNOWN_SET = returnUnknownSet

export const SET_TYPES: () => {
    [key in keyof SetConstructor]: TypeInfo | null
} = cache(() =>
    createObject<
        {
            [key in keyof SetConstructor]: TypeInfo | null
        }
    >({
        prototype: null,
    }),
)

type SetKeys = keyof Set<unknown>

const getPrototypes: () => {
    [key in SetKeys]: TypeInfo | null
} = cache(() =>
    createObject<
        {
            [key in SetKeys]: TypeInfo | null
        }
    >({
        ...getObjectPrototypes(),
        // ES2015
        clear: RETURN_VOID,
        delete: RETURN_BOOLEAN,
        forEach: RETURN_VOID,
        has: RETURN_BOOLEAN,
        add: returnSelf,
        size: NUMBER,
        entries: null,
        keys: null,
        values: null,
    }),
)

export class TypeSet implements ITypeClass {
    public type = "Set" as const

    private readonly param0: () => TypeInfo | null

    public constructor(param0: () => TypeInfo | null) {
        this.param0 = param0
    }

    public has(type: NamedType | OtherTypeName): boolean {
        return type === "Set"
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

    public typeNames(): string[] {
        const param0 = getTypeName(this.paramType(0))
        return [`Set${param0 != null ? `<${param0}>` : ""}`]
    }
}

export const UNKNOWN_SET = new TypeSet(() => null)
export const SET_CONSTRUCTOR = setConstructor

/**
 * Set constructor type
 */
function setConstructor(
    ...[thisType, argTypes]: Parameters<FunctionType>
): TypeInfo | null {
    if (thisType == null) {
        return null
    }
    const arg = argTypes[0]?.()
    if (isTypeClass(arg)) {
        return new TypeSet(() => arg.iterateType())
    }
    return UNKNOWN_SET
}

/**
 * Function Type that Return unknown array
 */
function returnUnknownSet(): TypeSet {
    return UNKNOWN_SET
}

/**
 * Function Type that Return self Set
 */
function returnSelf(
    selfType: Parameters<FunctionType>[0],
): ReturnType<FunctionType> {
    return selfType?.() ?? null
}

/**
 * Get the type name from given type.
 */
function getTypeName(type: TypeInfo | null): string | null {
    if (type == null) {
        return null
    }
    if (typeof type === "string") {
        return type
    }
    if (typeof type === "function" || typeof type === "symbol") {
        return "Function"
    }
    return type.typeNames().join("|")
}
