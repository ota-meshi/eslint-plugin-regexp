import type { TypeInfo } from "."
import { cache, createObject } from "./common"
import { NUMBER } from "./number"
import { getObjectPrototypes } from "./object"
import { RETURN_STRING, STRING } from "./string"

export const UNKNOWN_FUNCTION = returnUnknown

export const RETURN_FUNCTION = returnFunction

export type FunctionType = (
    thisType: (() => TypeInfo | null) | null,
    argTypes: ((() => TypeInfo | null) | null)[],
) => TypeInfo | null

export const getFunctionPrototypes: () => {
    // eslint-disable-next-line @typescript-eslint/ban-types -- ignore
    [key in keyof Function]: TypeInfo | null
} = cache(() =>
    createObject<
        {
            // eslint-disable-next-line @typescript-eslint/ban-types -- ignore
            [key in keyof Function]: TypeInfo | null
        }
    >({
        ...getObjectPrototypes(),
        toString: RETURN_STRING,
        bind: RETURN_FUNCTION,
        length: NUMBER,
        name: STRING,
        apply: UNKNOWN_FUNCTION,
        call: UNKNOWN_FUNCTION,
        arguments: null,
        caller: UNKNOWN_FUNCTION,
        prototype: null,
    }),
)

/** Unknown Function Type */
function returnUnknown(): null {
    return null
}

/** Function Type that Return Function */
function returnFunction(): typeof returnUnknown {
    return returnUnknown
}
