import { lazy } from "../../util.ts"
import { buildArrayConstructor } from "./array.ts"
import { buildBigIntConstructor } from "./bigint.ts"
import { buildBooleanConstructor } from "./boolean.ts"
import { createObject } from "./common.ts"
import {
    RETURN_BOOLEAN,
    RETURN_NUMBER,
    RETURN_STRING,
    buildFunctionConstructor,
} from "./function.ts"
import type {
    ITypeClass,
    NamedType,
    OtherTypeName,
    TypeClass,
    TypeInfo,
} from "./index.ts"
import { buildMapConstructor } from "./map.ts"
import { buildNumberConstructor, NUMBER } from "./number.ts"
import { buildObjectConstructor } from "./object.ts"
import { buildRegExpConstructor } from "./regexp.ts"
import { buildSetConstructor } from "./set.ts"
import { buildStringConstructor } from "./string.ts"

export class TypeGlobal implements ITypeClass {
    public type = "Global" as const

    public has(_type: NamedType | OtherTypeName): boolean {
        return false
    }

    public paramType(): null {
        return null
    }

    public propertyType(name: string): TypeInfo | null {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define -- ignore
        return getProperties()[name as never] || null
    }

    public iterateType(): null {
        return null
    }

    public returnType(): null {
        return null
    }

    public typeNames(): string[] {
        return ["Global"]
    }

    public equals(o: TypeClass): boolean {
        return o.type === "Global"
    }
}
export const GLOBAL = new TypeGlobal()

const getProperties: () => {
    [key: string]: TypeInfo | null
} = lazy(() =>
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
        globalThis: GLOBAL,
        window: GLOBAL,
        self: GLOBAL,
        global: GLOBAL,
        undefined: "undefined",
        Infinity: NUMBER,
        NaN: NUMBER,
    }),
)
