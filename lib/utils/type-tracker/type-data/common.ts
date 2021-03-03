import type { NamedType, OtherTypeName, TypeClass, TypeInfo } from "."

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

/** Checks whither given types is equals */
export function isEquals(
    t1: TypeInfo | null | undefined,
    t2: TypeInfo | null | undefined,
): boolean {
    if (t1 === t2) {
        return true
    }
    if (isTypeClass(t1) && isTypeClass(t2)) {
        return t1.equals(t2)
    }
    return false
}

/**
 * Checks if the result has the given type.
 */
export function hasType(
    result: TypeInfo | null,
    type: NamedType | OtherTypeName,
): boolean {
    if (result == null) {
        return false
    }
    if (typeof result === "string") {
        return result === type
    }
    if (typeof result === "function" || typeof result === "symbol") {
        return type === "Function"
    }
    return result.has(type)
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

export class TypeCollection {
    public readonly generator: () => IterableIterator<TypeInfo>

    private unknownIndex: number | null = null

    public constructor(generator?: () => IterableIterator<TypeInfo | null>) {
        // eslint-disable-next-line @typescript-eslint/no-this-alias -- ignore
        const that = this
        this.generator = generator
            ? function* () {
                  let index = 0
                  for (const t of generator()) {
                      if (t != null) {
                          yield t
                      } else {
                          that.unknownIndex ??= index
                      }
                      index++
                  }
              }
            : () => [][Symbol.iterator]()
    }

    public has(type: NamedType | OtherTypeName): boolean {
        for (const t of this.generator()) {
            if (typeof t === "string") {
                if (t === type) return true
            } else if (typeof t === "function" || typeof t === "symbol") {
                if (type === "Function") return true
            } else {
                if (t.has(type)) return true
            }
        }
        return false
    }

    public isOneType(): boolean {
        let first: TypeInfo | null = null
        for (const t of this.all()) {
            if (first == null) {
                first = t
            } else {
                if (!isEquals(first, t)) {
                    return false
                }
            }
        }
        return true
    }

    public *tuple(): IterableIterator<TypeInfo> {
        let index = 0
        for (const t of this.generator()) {
            if (this.unknownIndex != null && index < this.unknownIndex) {
                return
            }
            yield t
            index++
        }
    }

    public *all(): IterableIterator<TypeInfo> {
        const set = new Set()
        for (const t of this.generator()) {
            if (!set.has(t)) {
                set.add(t)
                yield t
            }
        }
    }

    public *strings(): IterableIterator<string> {
        const set = new Set()
        for (const t of this.all()) {
            if (typeof t === "string") {
                const str = t
                if (!set.has(str)) {
                    set.add(t)
                    yield str
                }
            } else if (typeof t === "function" || typeof t === "symbol") {
                const str = "Function"
                if (!set.has(str)) {
                    set.add(t)
                    yield str
                }
            } else {
                for (const str of t.typeNames()) {
                    if (!set.has(str)) {
                        set.add(t)
                        yield str
                    }
                }
            }
        }
    }
}

/**
 * Get the type name from given type.
 */
export function getTypeName(type: TypeInfo | null): string | null {
    if (type == null) {
        return null
    }
    if (typeof type === "string") {
        return type
    }
    if (typeof type === "function" || typeof type === "symbol") {
        return "Function"
    }
    return type.typeNames().join("|")
}
