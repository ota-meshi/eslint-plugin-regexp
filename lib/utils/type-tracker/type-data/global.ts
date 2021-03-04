import type {
    ITypeClass,
    NamedType,
    OtherTypeName,
    TypeClass,
    TypeInfo,
} from "."
import { buildArrayConstructor } from "./array"
import { buildBigIntConstructor } from "./bigint"
import { buildBooleanConstructor } from "./boolean"
import { cache, createObject } from "./common"
import {
    RETURN_BOOLEAN,
    RETURN_NUMBER,
    RETURN_STRING,
    buildFunctionConstructor,
} from "./function"
import { buildMapConstructor } from "./map"
import { buildNumberConstructor } from "./number"
import { buildObjectConstructor } from "./object"
import { buildRegExpConstructor } from "./regexp"
import { buildSetConstructor } from "./set"
import { buildStringConstructor } from "./string"

const getProperties: () => {
    [key: string]: TypeInfo | null
} = cache(() =>
    createObject<{
        [key: string]: TypeInfo | null
    }>({
        String: buildStringConstructor(),
        Number: buildNumberConstructor(),
        Boolean: buildBooleanConstructor(),
        RegExp: buildRegExpConstructor(),
        BigInt: buildBigIntConstructor(),
        Array: buildArrayConstructor(),
        Object: buildObjectConstructor(),
        Function: buildFunctionConstructor(),
        Map: buildMapConstructor(),
        Set: buildSetConstructor(),
        isFinite: RETURN_BOOLEAN,
        isNaN: RETURN_BOOLEAN,
        parseFloat: RETURN_NUMBER,
        parseInt: RETURN_NUMBER,
        decodeURI: RETURN_STRING,
        decodeURIComponent: RETURN_STRING,
        encodeURI: RETURN_STRING,
        encodeURIComponent: RETURN_STRING,
        escape: RETURN_STRING,
        unescape: RETURN_STRING,
    }),
)

export class TypeGlobal implements ITypeClass {
    public type = "Global" as const

    public has(_type: NamedType | OtherTypeName): boolean {
        return false
    }

    public paramType(): null {
        return null
    }

    public propertyType(name: string): TypeInfo | null {
        return getProperties()[name as never] || null
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
