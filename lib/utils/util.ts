/**
 * Throws if the function is called. This is useful for ensuring that a switch statement is exhaustive.
 */
export function assertNever(value: never): never {
    throw new Error(`Invalid value: ${value}`)
}
