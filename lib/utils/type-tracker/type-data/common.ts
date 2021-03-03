import type { TypeClass, TypeInfo } from "."

export const RETURN_VOID = retVoid

/** Function Type that Return void */
function retVoid(): "undefined" {
    return "undefined"
}

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

/** Cache builder */
export function cache<T>(fn: () => T): () => T {
    let t: T | undefined
    return () => t ?? (t = fn())
}
