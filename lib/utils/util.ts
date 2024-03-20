/**
 * Throws if the function is called. This is useful for ensuring that a switch statement is exhaustive.
 */
export function assertNever(value: never): never {
    throw new Error(`Invalid value: ${value}`)
}

/**
 * Returns a cached version of the given function for lazy evaluation.
 *
 * For the cached function to behave correctly, the given function must be pure.
 */
export function lazy<R extends NonNullable<unknown> | null>(
    fn: () => R,
): () => R {
    let cached: R | undefined
    return () => {
        if (cached === undefined) {
            cached = fn()
        }
        return cached
    }
}

/**
 * Returns a cached version of the given function. A `WeakMap` is used internally.
 *
 * For the cached function to behave correctly, the given function must be pure.
 */
export function cachedFn<K extends object, R>(
    fn: (key: K) => R,
): (key: K) => R {
    const cache = new WeakMap<K, R>()
    return (key) => {
        let cached = cache.get(key)
        if (cached === undefined) {
            cached = fn(key)
            cache.set(key, cached)
        }
        return cached
    }
}

/**
 * Returns all code points of the given string.
 */
export function toCodePoints(s: string): number[] {
    return [...s].map((c) => c.codePointAt(0)!)
}

/**
 * Returns an array of the given iterable in reverse order.
 */
export function reversed<T>(iter: Iterable<T>): T[] {
    return [...iter].reverse()
}
