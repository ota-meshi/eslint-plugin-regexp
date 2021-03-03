import type { ITypeClass, NamedType, OtherTypeName, TypeInfo } from "."
import { TypeArray } from "./array"
import { RETURN_BOOLEAN } from "./boolean"
import { cache, createObject, isTypeClass, RETURN_VOID } from "./common"
import type { FunctionType } from "./function"
import { NUMBER } from "./number"
import { getObjectPrototypes } from "./object"

export const RETURN_UNKNOWN_MAP = returnUnknownMap

export const MAP_TYPES: () => {
    [key in keyof MapConstructor]: TypeInfo | null
} = cache(() =>
    createObject<
        {
            [key in keyof MapConstructor]: TypeInfo | null
        }
    >({
        prototype: null,
    }),
)

type MapKeys = keyof Map<unknown, unknown>

const getPrototypes: () => {
    [key in MapKeys]: TypeInfo | null
} = cache(() =>
    createObject<
        {
            [key in MapKeys]: TypeInfo | null
        }
    >({
        ...getObjectPrototypes(),
        // ES2015
        clear: RETURN_VOID,
        delete: RETURN_BOOLEAN,
        forEach: RETURN_VOID,
        get: returnMapValue,
        has: RETURN_BOOLEAN,
        set: returnSelf,
        size: NUMBER,
        entries: null,
        keys: null,
        values: null,
    }),
)

export class TypeMap implements ITypeClass {
    public type = "Map" as const

    private readonly param0: () => TypeInfo | null

    private readonly param1: () => TypeInfo | null

    public constructor(
        param0: () => TypeInfo | null,
        param1: () => TypeInfo | null,
    ) {
        this.param0 = param0
        this.param1 = param1
    }

    public has(type: NamedType | OtherTypeName): boolean {
        return type === "Map"
    }

    public paramType(index: number): TypeInfo | null {
        if (index === 0) {
            return this.param0()
        }
        if (index === 1) {
            return this.param1()
        }
        return null
    }

    public propertyType(name: string): TypeInfo | null {
        return getPrototypes()[name as never] || null
    }

    public iterateType(): TypeInfo | null {
        // eslint-disable-next-line @typescript-eslint/no-this-alias -- ignore
        const map = this
        return new TypeArray(function* () {
            const param0 = map.paramType(0)
            if (param0) {
                yield param0
            }
            const param1 = map.paramType(1)
            if (param1) {
                yield param1
            }
        })
    }

    public typeNames(): string[] {
        const param0 = getTypeName(this.paramType(0))
        const param1 = getTypeName(this.paramType(1))
        return [
            `Map${
                param0 != null && param1 != null ? `<${param0},${param1}>` : ""
            }`,
        ]
    }
}

export const UNKNOWN_MAP = new TypeMap(
    () => null,
    () => null,
)
export const MAP_CONSTRUCTOR = mapConstructor

/**
 * Map constructor type
 */
function mapConstructor(
    ...[thisType, _argTypes]: Parameters<FunctionType>
): TypeInfo | null {
    if (thisType == null) {
        return null
    }
    // const arg = argTypes[0]?.()
    // if (arg && arg instanceof TypeArray) {
    //     const iterateType = arg.iterateType()
    //     if (iterateType && iterateType instanceof TypeArray) {
    //         return new TypeMap(
    //             ...
    //         )
    //     }
    // }
    return UNKNOWN_MAP
}

/**
 * Function Type that Return unknown array
 */
function returnUnknownMap(): TypeMap {
    return UNKNOWN_MAP
}

/**
 * Function Type that Return Map value
 */
function returnMapValue(
    selfType: Parameters<FunctionType>[0],
): ReturnType<FunctionType> {
    const type = selfType?.()
    if (!isTypeClass(type)) {
        return null
    }
    return type.paramType(1)
}

/**
 * Function Type that Return self Map
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
