const RE_REGEXP_STR = /^\/(.+)\/(.*)$/u

/**
 * Convert a string to the `RegExp`.
 * Normal strings (e.g. `"foo"`) is converted to `/foo/` of `RegExp`.
 * Strings like `"/^foo/i"` are converted to `/^foo/i` of `RegExp`.
 *
 * @param {string} string The string to convert.
 * @returns {RegExp} Returns the `RegExp`.
 */
export function toRegExp(string: string, flags?: string): RegExp {
    const parts = RE_REGEXP_STR.exec(string)
    if (parts) {
        let flagArgs: string
        if (flags) {
            flagArgs = [...new Set(parts[2] + flags)].join("")
        } else {
            flagArgs = parts[2]
        }

        return new RegExp(parts[1], flagArgs)
    }
    return new RegExp(string, flags)
}
