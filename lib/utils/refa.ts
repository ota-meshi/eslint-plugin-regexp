import type { CharSet } from "refa"
import { JS } from "refa"
import type { ReadonlyFlags } from "regexp-ast-analysis"
import type { RegExpContext } from "./index.ts"
import { cachedFn } from "./util.ts"

/**
 * Create a `JS.RegexppAst` object as required by refa's `JS.Parser.fromAst`
 * method and `ParsedLiteral` interface of the scslre library.
 */
export function getJSRegexppAst(
    context: RegExpContext,
    ignoreSticky = false,
): JS.RegexppAst {
    const { flags, flagsString, patternAst } = context

    return {
        pattern: patternAst,
        flags: {
            type: "Flags",
            raw: flagsString ?? "",
            parent: null,
            start: NaN,
            end: NaN,
            dotAll: flags.dotAll ?? false,
            global: flags.global ?? false,
            hasIndices: flags.hasIndices ?? false,
            ignoreCase: flags.ignoreCase ?? false,
            multiline: flags.multiline ?? false,
            sticky: !ignoreSticky && (flags.sticky ?? false),
            unicode: flags.unicode ?? false,
            unicodeSets: flags.unicodeSets ?? false,
        },
    }
}

/**
 * Returns a `JS.Parser` for the given regex context.
 */
export const getParser = cachedFn((context: RegExpContext) =>
    JS.Parser.fromAst(getJSRegexppAst(context)),
)

/**
 * Asserts that the given flags are valid (no `u` and `v` flag together).
 * @param flags
 */
export function assertValidFlags(
    flags: ReadonlyFlags,
): asserts flags is JS.Flags {
    if (!JS.isFlags(flags)) {
        throw new Error(`Invalid flags: ${JSON.stringify(flags)}`)
    }
}

/**
 * Returns a regexp literal source of the given char set or char.
 */
export function toCharSetSource(
    charSetOrChar: CharSet | number,
    flags: ReadonlyFlags,
): string {
    assertValidFlags(flags)
    let charSet
    if (typeof charSetOrChar === "number") {
        charSet = JS.createCharSet([charSetOrChar], flags)
    } else {
        charSet = charSetOrChar
    }
    return JS.toLiteral(
        {
            type: "Concatenation",
            elements: [{ type: "CharacterClass", characters: charSet }],
        },
        { flags },
    ).source
}
