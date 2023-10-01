/**
 * Throws if the function is called. This is useful for ensuring that a switch statement is exhaustive.
 */
export function assertNever(value: never): never {
    throw new Error(`Invalid value: ${value}`)
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
