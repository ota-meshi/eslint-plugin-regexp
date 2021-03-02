import type { TypeClass, TypeInfo } from "."
import type { TypeArray } from "./array"
import { STRING_ARRAY } from "./array"
import { UNKNOWN_ARRAY } from "./array"

/* eslint-disable func-style -- ignore */
export const UNKNOWN_FUNCTION = (): null => null

export const RETURN_STRING = () => "String" as const
export const RETURN_NUMBER = () => "Number" as const
export const RETURN_BOOLEAN = () => "Boolean" as const
export const RETURN_REGEXP = () => "RegExp" as const
export const RETURN_BIGINT = () => "BigInt" as const
export const RETURN_UNKNOWN_ARRAY = (): TypeArray => UNKNOWN_ARRAY
export const RETURN_STRING_ARRAY = (): TypeArray => STRING_ARRAY
export const RETURN_FUNCTION = (): typeof UNKNOWN_FUNCTION => UNKNOWN_FUNCTION
export const RETURN_OBJECT = () => "Object" as const
/* eslint-enable func-style -- ignore */

/** Check whether given type is TypeClass */
export function isTypeClass(
    type: TypeInfo | null | undefined,
): type is TypeClass {
    if (!type) {
        return false
    }
    const t = typeof type
    if (t === "string" || t === "symbol" || t === "function") {
        return false
    }
    return true
}

/** Create object */
export function createObject<T>(t: T): T {
    return Object.assign(Object.create(null), t)
}