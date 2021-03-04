import type {
    ITypeClass,
    NamedType,
    OtherTypeName,
    TypeClass,
    TypeInfo,
} from "."
import { isTypeClass } from "."
import { cache, createObject, getTypeName, isEquals } from "./common"
import { RETURN_VOID, RETURN_BOOLEAN, TypeFunction } from "./function"
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
} = cache(() => {
    const RETURN_SELF = new TypeFunction(
        /**
         * Function Type that Return self array
         */
        function returnSelf(selfType) {
            return selfType?.() ?? null
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
        entries: null,
        keys: null,
        values: null,
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
        const param0 = getTypeName(this.paramType(0))
        return [`Set${param0 != null ? `<${param0}>` : ""}`]
    }

    public equals(o: TypeClass): boolean {
        if (o.type !== "Set") {
            return false
        }
        return isEquals(this.paramType(0), o.paramType(0))
    }
}

export const UNKNOWN_SET = new TypeSet(() => null)
/** Build Set constructor type */
export function buildSetConstructor(): TypeFunction {
    return new TypeFunction(setConstructor)
}

/**
 * Set constructor type
 */
function setConstructor(
    thisType: (() => TypeInfo | null) | null,
    argTypes: ((() => TypeInfo | null) | null)[],
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
