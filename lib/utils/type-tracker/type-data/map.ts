import type {
    ITypeClass,
    NamedType,
    OtherTypeName,
    TypeClass,
    TypeInfo,
} from "."
import { TypeArray } from "./array"
import {
    cache,
    createObject,
    getTypeName,
    isEquals,
    isTypeClass,
} from "./common"
import {
    RETURN_VOID,
    RETURN_BOOLEAN,
    TypeFunction,
    TypeGlobalFunction,
} from "./function"
import { TypeIterable } from "./iterable"
import { NUMBER } from "./number"
import { getObjectPrototypes } from "./object"

type MapKeys = keyof Map<unknown, unknown>

const getPrototypes: () => {
    [key in MapKeys]: TypeInfo | null
} = cache(() => {
    const RETURN_MAP_VALUE = new TypeFunction(
        /**
         * Function Type that Return Map value
         */
        function returnMapValue(selfType) {
            const type = selfType?.()
            if (!isTypeClass(type)) {
                return null
            }
            return type.paramType(1)
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
    const RETURN_ENTRIES = new TypeFunction(
        /**
         * Function Type that Return entries
         */
        function (selfType) {
            return new TypeIterable(() => {
                return new TypeArray(function* () {
                    const type = selfType?.()
                    if (isTypeClass(type)) {
                        yield type.paramType(0)
                        yield type.paramType(1)
                    } else {
                        yield null
                        yield null
                    }
                }, true)
            })
        },
    )
    const RETURN_KEYS = new TypeFunction(
        /**
         * Function Type that Return keys
         */
        function (selfType) {
            return new TypeIterable(() => {
                const type = selfType?.()
                if (isTypeClass(type)) {
                    return type.paramType(0)
                }
                return null
            })
        },
    )
    const RETURN_VALUES = new TypeFunction(
        /**
         * Function Type that Return values
         */
        function (selfType) {
            return new TypeIterable(() => {
                const type = selfType?.()
                if (isTypeClass(type)) {
                    return type.paramType(1)
                }
                return null
            })
        },
    )
    return createObject<
        {
            [key in MapKeys]: TypeInfo | null
        }
    >({
        ...getObjectPrototypes(),
        // ES2015
        clear: RETURN_VOID,
        delete: RETURN_BOOLEAN,
        forEach: RETURN_VOID,
        get: RETURN_MAP_VALUE,
        has: RETURN_BOOLEAN,
        set: RETURN_SELF,
        size: NUMBER,
        entries: RETURN_ENTRIES,
        keys: RETURN_KEYS,
        values: RETURN_VALUES,
    })
})

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
            yield map.paramType(0)
            yield map.paramType(1)
        }, true)
    }

    public returnType(): null {
        return null
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

    public equals(o: TypeClass): boolean {
        if (o.type !== "Map") {
            return false
        }
        return (
            isEquals(this.paramType(0), o.paramType(0)) &&
            isEquals(this.paramType(1), o.paramType(1))
        )
    }
}

export const UNKNOWN_MAP = new TypeMap(
    () => null,
    () => null,
)
/** Build Map constructor type */
export function buildMapConstructor(): TypeFunction {
    const MAP_TYPES: () => {
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
    return new TypeGlobalFunction(mapConstructor, MAP_TYPES)
}

/**
 * Map constructor type
 */
function mapConstructor(
    _thisType: (() => TypeInfo | null) | null,
    argTypes: ((() => TypeInfo | null) | null)[],
    meta?: { isConstructor?: boolean },
): TypeInfo | null {
    if (!meta?.isConstructor) {
        return null
    }
    const arg = argTypes[0]?.()
    if (isTypeClass(arg) && arg.type === "Array") {
        const iterateType = arg.iterateType()
        if (isTypeClass(iterateType) && iterateType.type === "Array") {
            return new TypeMap(
                () => iterateType.at(0),
                () => iterateType.at(1),
            )
        }
    }
    return UNKNOWN_MAP
}
