import type { ReadonlyFlags } from "regexp-ast-analysis"
import { toCodePoints } from "./util.ts"

const RESERVED_DOUBLE_PUNCTUATORS = "&!#$%*+,.:;<=>?@^`~-"
/**
 * A single character set of ClassSetReservedDoublePunctuator.
 *
 * `&& !! ## $$ %% ** ++ ,, .. :: ;; << == >> ?? @@ ^^ `` ~~ --` are ClassSetReservedDoublePunctuator
 */
export const RESERVED_DOUBLE_PUNCTUATOR_CHARS: ReadonlySet<string> = new Set(
    RESERVED_DOUBLE_PUNCTUATORS,
)

/**
 * Same as {@link RESERVED_DOUBLE_PUNCTUATOR_CHARS} but as code points.
 */
export const RESERVED_DOUBLE_PUNCTUATOR_CP: ReadonlySet<number> = new Set(
    toCodePoints(RESERVED_DOUBLE_PUNCTUATORS),
)

export const RESERVED_DOUBLE_PUNCTUATOR_PATTERN =
    /&&|!!|##|\$\$|%%|\*\*|\+\+|,,|\.\.|::|;;|<<|==|>>|\?\?|@@|\^\^|``|~~|--/u

/**
 * Returns whether the given raw of a character literal is an octal escape
 * sequence.
 */
export function isOctalEscape(raw: string): boolean {
    return /^\\[0-7]{1,3}$/u.test(raw)
}
/**
 * Returns whether the given raw of a character literal is a control escape
 * sequence.
 */
export function isControlEscape(raw: string): boolean {
    return /^\\c[A-Za-z]$/u.test(raw)
}
/**
 * Returns whether the given raw of a character literal is a hexadecimal escape
 * sequence.
 */
export function isHexadecimalEscape(raw: string): boolean {
    return /^\\x[\dA-Fa-f]{2}$/u.test(raw)
}
/**
 * Returns whether the given raw of a character literal is a unicode escape
 * sequence.
 */
export function isUnicodeEscape(raw: string): boolean {
    return /^\\u[\dA-Fa-f]{4}$/u.test(raw)
}
/**
 * Returns whether the given raw of a character literal is a unicode code point
 * escape sequence.
 */
export function isUnicodeCodePointEscape(raw: string): boolean {
    return /^\\u\{[\dA-Fa-f]{1,8}\}$/u.test(raw)
}

export enum EscapeSequenceKind {
    octal = "octal",
    control = "control",
    hexadecimal = "hexadecimal",
    unicode = "unicode",
    unicodeCodePoint = "unicode code point",
}
/**
 * Returns which escape sequence kind was used for the given raw of a character literal.
 */
export function getEscapeSequenceKind(raw: string): EscapeSequenceKind | null {
    if (raw[0] !== "\\") {
        return null
    }
    if (isOctalEscape(raw)) {
        return EscapeSequenceKind.octal
    }
    if (isControlEscape(raw)) {
        return EscapeSequenceKind.control
    }
    if (isHexadecimalEscape(raw)) {
        return EscapeSequenceKind.hexadecimal
    }
    if (isUnicodeEscape(raw)) {
        return EscapeSequenceKind.unicode
    }
    if (isUnicodeCodePointEscape(raw)) {
        return EscapeSequenceKind.unicodeCodePoint
    }
    return null
}

/**
 * Returns whether the given raw of a character literal is an octal escape
 * sequence, a control escape sequence, a hexadecimal escape sequence, a unicode
 * escape sequence, or a unicode code point escape sequence.
 */
export function isEscapeSequence(raw: string): boolean {
    return getEscapeSequenceKind(raw) !== null
}

/**
 * Returns whether the given raw of a character literal is a hexadecimal escape
 * sequence, a unicode escape sequence, or a unicode code point escape sequence.
 */
export function isHexLikeEscape(raw: string): boolean {
    const kind = getEscapeSequenceKind(raw)
    return (
        kind === EscapeSequenceKind.hexadecimal ||
        kind === EscapeSequenceKind.unicode ||
        kind === EscapeSequenceKind.unicodeCodePoint
    )
}

export const FLAG_GLOBAL = "g"
export const FLAG_DOT_ALL = "s"
export const FLAG_HAS_INDICES = "d"
export const FLAG_IGNORECASE = "i"
export const FLAG_MULTILINE = "m"
export const FLAG_STICKY = "y"
export const FLAG_UNICODE = "u"
export const FLAG_UNICODE_SETS = "v"

const flagsCache = new Map<string, Required<ReadonlyFlags>>()

/**
 * Given some flags, this will return a parsed flags object.
 *
 * Non-standard flags will be ignored.
 */
export function parseFlags(flags: string): ReadonlyFlags {
    let cached = flagsCache.get(flags)
    if (cached === undefined) {
        cached = {
            dotAll: flags.includes(FLAG_DOT_ALL),
            global: flags.includes(FLAG_GLOBAL),
            hasIndices: flags.includes(FLAG_HAS_INDICES),
            ignoreCase: flags.includes(FLAG_IGNORECASE),
            multiline: flags.includes(FLAG_MULTILINE),
            sticky: flags.includes(FLAG_STICKY),
            unicode: flags.includes(FLAG_UNICODE),
            unicodeSets: flags.includes(FLAG_UNICODE_SETS),
        }
        flagsCache.set(flags, cached)
    }
    return cached
}
