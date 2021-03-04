import type {
    ITypeClass,
    NamedType,
    OtherTypeName,
    TypeClass,
    TypeInfo,
} from "."
import { isTypeClass } from "."
import { TypeArray } from "./array"
import { cache, createObject, getTypeName, isEquals } from "./common"
import {
    RETURN_VOID,
    RETURN_BOOLEAN,
    TypeFunction,
    TypeGlobalFunction,
} from "./function"
import { TypeIterable } from "./iterable"
import { NUMBER } from "./number"
import { getObjectPrototypes } from "./object"

type SetKeys = keyof Set<unknown>

const getPrototypes: () => {
    [key in SetKeys]: TypeInfo | null
} = cache(() => {
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
                        yield type.iterateType()
                        yield type.iterateType()
                    }
                })
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
                    return type.iterateType()
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
                    return type.iterateType()
                }
                return null
            })
        },
    )
    return createObject<
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
        add: RETURN_SELF,
        size: NUMBER,
        entries: RETURN_ENTRIES,
        keys: RETURN_KEYS,
        values: RETURN_VALUES,
    })
})

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

    public returnType(): null {
        return null
    }

    public typeNames(): string[] {
        const param0 = getTypeName(this.iterateType())
        return [`Set${param0 != null ? `<${param0}>` : ""}`]
    }

    public equals(o: TypeClass): boolean {
        if (o.type !== "Set") {
            return false
        }
        return isEquals(this.iterateType(), o.iterateType())
    }
}

export const UNKNOWN_SET = new TypeSet(() => null)
/** Build Set constructor type */
export function buildSetConstructor(): TypeFunction {
    const SET_TYPES: () => {
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
    return new TypeGlobalFunction(setConstructor, SET_TYPES)
}

/**
 * Set constructor type
 */
function setConstructor(
    _thisType: (() => TypeInfo | null) | null,
    argTypes: ((() => TypeInfo | null) | null)[],
    meta?: { isConstructor?: boolean },
): TypeInfo | null {
    if (!meta?.isConstructor) {
        return null
    }
    const arg = argTypes[0]?.()
    if (isTypeClass(arg)) {
        return new TypeSet(() => arg.iterateType())
    }
    return UNKNOWN_SET
}
