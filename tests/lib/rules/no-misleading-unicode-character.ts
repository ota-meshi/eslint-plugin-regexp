import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-misleading-unicode-character"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-misleading-unicode-character", rule as any, {
    valid: [
        `/[👍]/u`,
        `/👍+/u`,
        `/[\uD83D\uDC4D]/u`,
        `/[\u{1F44D}]/u`,
        `/❇️/`,
        `/Á/`,
        `/[❇]/`,
        `/🇯🇵/`,
        `/[JP]/`,
        `/👨‍👩‍👦/`,

        // Ignore solo lead/tail surrogate.
        `/[\uD83D]/`,
        `/[\uDC4D]/`,
        `/[\uD83D]/u`,
        `/[\uDC4D]/u`,

        // Ignore solo combining char.
        `/[\u0301]/`,
        `/[\uFE0F]/`,
        `/[\u0301]/u`,
        `/[\uFE0F]/u`,

        // Ignore solo emoji modifier.
        `/[\u{1F3FB}]/u`,

        // Ignore solo regional indicator symbol.
        `/[🇯]/u`,
        `/[🇵]/u`,

        // Ignore solo ZWJ.
        `/[\u200D]/`,
        `/[\u200D]/u`,

        // Ignore escaped symbols because it's obvious they aren't together
        `/[\\uD83D\\uDC4D]/`,
    ],
    invalid: [
        {
            code: `/[👍]/`,
            output: `/👍/`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[👍]foo/`,
            output: `/👍foo/`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[👍]|foo/`,
            output: `/👍|foo/`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[👍a]foo/`,
            output: `/(?:👍|[a])foo/`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[👍a]|foo/`,
            output: `/👍|[a]|foo/`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[fooo👍bar]baz/`,
            output: `/(?:👍|[fooobar])baz/`,
            errors: [
                "The character(s) '👍' are all represented using multiple char codes. Use the `u` flag.",
            ],
        },
        {
            code: `/👍+/`,
            output: `/(?:👍)+/`,
            errors: [
                "The character '👍' is represented using a surrogate pair. The quantifier only applies to the tailing surrogate '\udc4d' (U+dc4d) and not to the whole character.",
            ],
        },
        {
            code: `/[Á]/`,
            output: `/Á/`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[Á]/u`,
            output: `/Á/u`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[\u0041\u0301]/`,
            output: `/\u0041\u0301/`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[\u0041\u0301]/u`,
            output: `/\u0041\u0301/u`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[\u{41}\u{301}]/u`,
            output: `/\u{41}\u{301}/u`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[❇️]/`,
            output: `/❇️/`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[❇️]/u`,
            output: `/❇️/u`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/❇️+/u`,
            output: `/(?:❇️)+/u`,
            errors: [
                "The character '❇️' is represented using multiple Unicode code points. The quantifier only applies to the last code point '\ufe0f' (U+fe0f) and not to the whole character.",
            ],
        },
        {
            code: `/[🇯🇵]/`,
            output: `/🇯🇵/`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[🇯🇵]/u`,
            output: `/🇯🇵/u`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[👨‍👩‍👦]/`,
            output: `/👨‍👩‍👦/`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[👨‍👩‍👦]/u`,
            output: `/👨‍👩‍👦/u`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/👨‍👩‍👦+/`,
            output: `/(?:👨‍👩‍👦)+/`,
            errors: [{ messageId: "quantifierMulti" }],
        },
        {
            code: `/👨‍👩‍👦+/u`,
            output: `/(?:👨‍👩‍👦)+/u`,
            errors: [{ messageId: "quantifierMulti" }],
        },

        // RegExp constructors.
        {
            code: String.raw`new RegExp("[👍]", "")`,
            output: String.raw`new RegExp("👍", "")`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: String.raw`new RegExp("[\uD83D\uDC4D]", "")`,
            output: String.raw`new RegExp("👍", "")`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: String.raw`new RegExp("[Á]", "")`,
            output: String.raw`new RegExp("Á", "")`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: String.raw`new RegExp("[Á]", "u")`,
            output: String.raw`new RegExp("Á", "u")`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: String.raw`new RegExp("[❇️]", "")`,
            output: String.raw`new RegExp("❇️", "")`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: String.raw`new RegExp("[❇️]", "u")`,
            output: String.raw`new RegExp("❇️", "u")`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: String.raw`new RegExp("[🇯🇵]", "")`,
            output: String.raw`new RegExp("🇯🇵", "")`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: String.raw`new RegExp("[🇯🇵]", "u")`,
            output: String.raw`new RegExp("🇯🇵", "u")`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: String.raw`new RegExp("[👨‍👩‍👦]", "")`,
            output: String.raw`new RegExp("👨‍👩‍👦", "")`,
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: String.raw`new RegExp("[👨‍👩‍👦]", "u")`,
            output: String.raw`new RegExp("👨‍👩‍👦", "u")`,
            errors: [{ messageId: "characterClass" }],
        },
    ],
})
