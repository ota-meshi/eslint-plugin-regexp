import type { CharacterClassElement, Node } from "regexpp/ast"

/** Formats the given Unicode code point as `U+0000`. */
function formatCodePoint(value: number): string {
    return `U+${value.toString(16).padStart(4, "0")}`
}

/**
 * Creates a string that mentions the given character class element.
 *
 * This is a specialized version of {@link mention} that will add
 * character-related information if possible.
 */
export function mentionChar(element: CharacterClassElement): string {
    if (element.type === "Character") {
        const value = formatCodePoint(element.value)
        return `'${escape(element.raw)}' (${value})`
    }
    if (element.type === "CharacterClassRange") {
        const min = formatCodePoint(element.min.value)
        const max = formatCodePoint(element.max.value)
        return `'${escape(element.raw)}' (${min} - ${max})`
    }

    return mention(element)
}

/**
 * Creates a string that mentions the given character class element.
 */
export function mention(element: Node | string): string {
    return `'${escape(typeof element === "string" ? element : element.raw)}'`
}

/** Escape control characters in the given string */
function escape(value: string): string {
    // Escaping has to be done in 2 phases:
    //  1. Escape all backslash-escaped control characters
    //  2. Escape all non-escape control character
    return (
        value
            .replace(/\\(?<char>[\s\S])/gu, (m, char) => {
                if (char.charCodeAt(0) < 0x20) {
                    return escapeControl(char)
                }
                return m
            })
            // eslint-disable-next-line no-control-regex -- x
            .replace(/[\0-\x1f]/gu, escapeControl)
    )
}

/**
 * Assuming that the given character is a control character, this function will
 * return an escape sequence for that character.
 */
function escapeControl(control: string): string {
    // we will allow tabs
    if (control === "\t") return control

    if (control === "\n") return "\\n"
    if (control === "\r") return "\\r"
    return `\\x${control.charCodeAt(0).toString(16).padStart(2, "0")}`
}
