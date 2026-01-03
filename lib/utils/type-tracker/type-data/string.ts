import { lazy } from "../../util.ts"
import { createObject } from "./common.ts"
import {
    RETURN_STRING,
    RETURN_STRING_ARRAY,
    RETURN_BOOLEAN,
    RETURN_NUMBER,
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

export class TypeString implements ITypeClass {
    public type = "String" as const

    public has(type: NamedType | OtherTypeName): boolean {
        return type === "String"
    }

    public paramType(): null {
        return null
    }

    public propertyType(name: string): TypeInfo | null {
        if (name === "0") {
            return this
        }
        // eslint-disable-next-line @typescript-eslint/no-use-before-define -- ignore
        return getPrototypes()[name as never] || null
    }

    public iterateType(): TypeInfo {
        return this
    }

    public returnType(): null {
        return null
    }

    public typeNames(): string[] {
        return ["String"]
    }

    public equals(o: TypeClass): boolean {
        return o.type === "String"
    }
}
export const STRING = new TypeString()

/** Build String constructor type */
export function buildStringConstructor(): TypeGlobalFunction {
    const STRING_TYPES = createObject<{
        [key in keyof StringConstructor]: TypeInfo | null
    }>({
        // ES5
        fromCharCode: RETURN_STRING,
        // ES2015
        fromCodePoint: RETURN_STRING,
        raw: RETURN_STRING,

        prototype: null,
    })
    return new TypeGlobalFunction(() => STRING, STRING_TYPES)
}

const getPrototypes: () => {
    [key in keyof string]: TypeInfo | null
} = lazy(() =>
    createObject<{
        [key in keyof string]: TypeInfo | null
        // @ts-expect-error -- TODO: fix types
    }>({
        ...getObjectPrototypes(),
        // ES5
        toString: RETURN_STRING,
        charAt: RETURN_STRING,
        charCodeAt: RETURN_NUMBER,
        concat: RETURN_STRING,
        indexOf: RETURN_NUMBER,
        lastIndexOf: RETURN_NUMBER,
        localeCompare: RETURN_NUMBER,
        match: RETURN_STRING_ARRAY,
        replace: RETURN_STRING,
        search: RETURN_NUMBER,
        slice: RETURN_STRING,
        split: RETURN_STRING_ARRAY,
        substring: RETURN_STRING,
        toLowerCase: RETURN_STRING,
        toLocaleLowerCase: RETURN_STRING,
        toUpperCase: RETURN_STRING,
        toLocaleUpperCase: RETURN_STRING,
        trim: RETURN_STRING,
        substr: RETURN_STRING,
        valueOf: RETURN_STRING,
        // ES2015
        codePointAt: RETURN_NUMBER,
        includes: RETURN_BOOLEAN,
        endsWith: RETURN_BOOLEAN,
        normalize: RETURN_STRING,
        repeat: RETURN_STRING,
        startsWith: RETURN_BOOLEAN,
        // HTML
        anchor: RETURN_STRING,
        big: RETURN_STRING,
        blink: RETURN_STRING,
        bold: RETURN_STRING,
        fixed: RETURN_STRING,
        fontcolor: RETURN_STRING,
        fontsize: RETURN_STRING,
        italics: RETURN_STRING,
        link: RETURN_STRING,
        small: RETURN_STRING,
        strike: RETURN_STRING,
        sub: RETURN_STRING,
        sup: RETURN_STRING,
        // ES2017
        padStart: RETURN_STRING,
        padEnd: RETURN_STRING,
        // ES2019
        trimLeft: RETURN_STRING,
        trimRight: RETURN_STRING,
        trimStart: RETURN_STRING,
        trimEnd: RETURN_STRING,
        // ES2020
        matchAll: null, // IterableIterator<RegExpMatchArray>
        // ES2021
        replaceAll: RETURN_STRING,
        // ES2022
        at: RETURN_STRING,

        length: NUMBER,
        0: STRING, // string
        [Symbol.iterator]: null,
    }),
)
