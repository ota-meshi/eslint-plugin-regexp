import { lazy } from "../../util.ts"
import { BOOLEAN } from "./boolean.ts"
import { createObject } from "./common.ts"
import {
    RETURN_REGEXP,
    RETURN_STRING_ARRAY,
    RETURN_BOOLEAN,
    TypeGlobalFunction,
} from "./function.ts"
import type {
    ITypeClass,
    NamedType,
    OtherTypeName,
    TypeClass,
    TypeInfo,
} from "./index.ts"
import { NUMBER } from "./number.ts"
import { getObjectPrototypes } from "./object.ts"
import { STRING } from "./string.ts"

export class TypeRegExp implements ITypeClass {
    public type = "RegExp" as const

    public has(type: NamedType | OtherTypeName): boolean {
        return type === "RegExp"
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
        return ["RegExp"]
    }

    public equals(o: TypeClass): boolean {
        return o.type === "RegExp"
    }
}
export const REGEXP = new TypeRegExp()

/** Build RegExp constructor type */
export function buildRegExpConstructor(): TypeGlobalFunction {
    const REGEXP_TYPES = createObject<{
        [key in keyof RegExpConstructor]: TypeInfo | null
    }>({
        $1: STRING,
        $2: STRING,
        $3: STRING,
        $4: STRING,
        $5: STRING,
        $6: STRING,
        $7: STRING,
        $8: STRING,
        $9: STRING,
        $_: STRING,
        "$&": STRING,
        "$+": STRING,
        "$`": STRING,
        "$'": STRING,
        input: STRING,
        lastParen: STRING,
        leftContext: STRING,
        rightContext: STRING,
        lastMatch: NUMBER, // prop
        prototype: null,
        [Symbol.species]: null,
    })
    return new TypeGlobalFunction(() => REGEXP, REGEXP_TYPES)
}

const getPrototypes: () => {
    [key in keyof RegExp]: TypeInfo | null
} = lazy(() =>
    createObject<{
        [key in keyof RegExp]: TypeInfo | null
    }>({
        ...getObjectPrototypes(),
        // ES5
        exec: RETURN_STRING_ARRAY,
        test: RETURN_BOOLEAN,
        source: STRING, // prop
        global: BOOLEAN, // prop
        ignoreCase: BOOLEAN, // prop
        multiline: BOOLEAN, // prop
        lastIndex: NUMBER, // prop
        compile: RETURN_REGEXP,
        // ES2015
        flags: STRING, // prop
        sticky: BOOLEAN, // prop
        unicode: BOOLEAN, // prop
        // ES2018
        dotAll: BOOLEAN, // prop
        // ES2022
        hasIndices: BOOLEAN, // prop
        // ES2024
        unicodeSets: BOOLEAN, // prop

        [Symbol.match]: null,
        [Symbol.replace]: null,
        [Symbol.search]: null,
        [Symbol.split]: null,
        [Symbol.matchAll]: null,
    }),
)
