import { Chars } from "regexp-ast-analysis"

export const CP_BACKSPACE = 8
export const CP_TAB = 9
export const CP_LF = 10
export const CP_VT = 11
export const CP_FF = 12
export const CP_CR = 13
export const CP_SPACE = " ".codePointAt(0)!
export const CP_BAN = "!".codePointAt(0)!
export const CP_DOLLAR = "$".codePointAt(0)!
export const CP_OPENING_PAREN = "(".codePointAt(0)!
export const CP_CLOSING_PAREN = ")".codePointAt(0)!
export const CP_STAR = "*".codePointAt(0)!
export const CP_PLUS = "+".codePointAt(0)!
export const CP_MINUS = "-".codePointAt(0)!
export const CP_DOT = ".".codePointAt(0)!
export const CP_SLASH = "/".codePointAt(0)!
export const CP_COLON = ":".codePointAt(0)!
export const CP_QUESTION = "?".codePointAt(0)!
export const CP_AT = "@".codePointAt(0)!
export const CP_OPENING_BRACKET = "[".codePointAt(0)!
export const CP_BACK_SLASH = "\\".codePointAt(0)!
export const CP_CLOSING_BRACKET = "]".codePointAt(0)!
export const CP_CARET = "^".codePointAt(0)!
export const CP_BACKTICK = "`".codePointAt(0)!
export const CP_APOSTROPHE = "'".codePointAt(0)!
export const CP_OPENING_BRACE = "{".codePointAt(0)!
export const CP_PIPE = "|".codePointAt(0)!
export const CP_CLOSING_BRACE = "}".codePointAt(0)!
export const CP_TILDE = "~".codePointAt(0)!
export const CP_NEL = "\u0085".codePointAt(0)!
export const CP_NBSP = "\u00a0".codePointAt(0)!
export const CP_OGHAM_SPACE_MARK = "\u1680".codePointAt(0)!
export const CP_MONGOLIAN_VOWEL_SEPARATOR = "\u180e".codePointAt(0)!
export const CP_EN_QUAD = "\u2000".codePointAt(0)!
export const CP_HAIR_SPACE = "\u200a".codePointAt(0)!
export const CP_ZWSP = "\u200b".codePointAt(0)!
export const CP_ZWNJ = "\u200c".codePointAt(0)!
export const CP_ZWJ = "\u200d".codePointAt(0)!
export const CP_LRM = "\u200e".codePointAt(0)!
export const CP_RLM = "\u200f".codePointAt(0)!
export const CP_LINE_SEPARATOR = "\u2028".codePointAt(0)!
export const CP_PARAGRAPH_SEPARATOR = "\u2029".codePointAt(0)!
export const CP_NNBSP = "\u202f".codePointAt(0)!
export const CP_MMSP = "\u205f".codePointAt(0)!
export const CP_BRAILLE_PATTERN_BLANK = "\u2800".codePointAt(0)!
export const CP_IDEOGRAPHIC_SPACE = "\u3000".codePointAt(0)!
export const CP_BOM = "\ufeff".codePointAt(0)!
export const CP_DIGIT_ZERO = "0".codePointAt(0)!
export const CP_DIGIT_NINE = "9".codePointAt(0)!
export const CP_SMALL_A = "a".codePointAt(0)!
export const CP_SMALL_Z = "z".codePointAt(0)!
export const CP_CAPITAL_A = "A".codePointAt(0)!
export const CP_CAPITAL_Z = "Z".codePointAt(0)!
export const CP_LOW_LINE = "_".codePointAt(0)!

export const CP_RANGE_SMALL_LETTER = [CP_SMALL_A, CP_SMALL_Z] as const
export const CP_RANGE_CAPITAL_LETTER = [CP_CAPITAL_A, CP_CAPITAL_Z] as const

/**
 * Checks if the given code point is within the code point range.
 * @param codePoint The code point to check.
 * @param range The range of code points of the range.
 * @returns `true` if the given character is within the character class range.
 */
function isCodePointInRange(
    codePoint: number,
    [start, end]: readonly [number, number],
) {
    return start <= codePoint && codePoint <= end
}

/**
 * Checks if the given code point is digit.
 */
export function isDigit(codePoint: number): boolean {
    return Chars.digit({}).has(codePoint)
}
/**
 * Checks if the given code point is lowercase.
 */
export function isLowercaseLetter(codePoint: number): boolean {
    return isCodePointInRange(codePoint, CP_RANGE_SMALL_LETTER)
}
/**
 * Checks if the given code point is uppercase.
 */
export function isUppercaseLetter(codePoint: number): boolean {
    return isCodePointInRange(codePoint, CP_RANGE_CAPITAL_LETTER)
}
/**
 * Checks if the given code point is letter.
 */
export function isLetter(codePoint: number): boolean {
    return isLowercaseLetter(codePoint) || isUppercaseLetter(codePoint)
}
/**
 * Convert the given character to lowercase.
 */
export function toLowerCodePoint(codePoint: number): number {
    if (isUppercaseLetter(codePoint)) {
        return codePoint + 0x0020
    }
    return codePoint
}
/**
 * Convert the given character to uppercase.
 */
export function toUpperCodePoint(codePoint: number): number {
    if (isLowercaseLetter(codePoint)) {
        return codePoint - 0x0020
    }
    return codePoint
}
/**
 * Checks if the given code point is symbol.
 */
export function isSymbol(codePoint: number): boolean {
    return (
        isCodePointInRange(codePoint, [CP_BAN, CP_SLASH]) ||
        isCodePointInRange(codePoint, [CP_COLON, CP_AT]) ||
        isCodePointInRange(codePoint, [CP_OPENING_BRACKET, CP_BACKTICK]) ||
        isCodePointInRange(codePoint, [CP_OPENING_BRACE, CP_TILDE])
    )
}

/**
 * Checks if the given code point is space.
 */
export function isSpace(codePoint: number): boolean {
    return Chars.space({}).has(codePoint)
}

/**
 * Checks if the given code point is word.
 */
export function isWord(codePoint: number): boolean {
    return Chars.word({}).has(codePoint)
}

/**
 * Checks if the given code point is invisible character.
 */
export function isInvisible(codePoint: number): boolean {
    if (isSpace(codePoint)) {
        return true
    }
    return (
        codePoint === CP_MONGOLIAN_VOWEL_SEPARATOR ||
        codePoint === CP_NEL ||
        codePoint === CP_ZWSP ||
        codePoint === CP_ZWNJ ||
        codePoint === CP_ZWJ ||
        codePoint === CP_LRM ||
        codePoint === CP_RLM ||
        codePoint === CP_BRAILLE_PATTERN_BLANK
    )
}
