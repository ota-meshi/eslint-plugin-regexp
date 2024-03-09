import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-misleading-unicode-character"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-misleading-unicode-character", rule as any, {
    valid: [
        `/[👍]/u`,
        `/👍+/u`,
        String.raw`/[\uD83D\uDC4D]/u`,
        String.raw`/[\u{1F44D}]/u`,
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

        // ES2024
        "var r = /[👍]/v",
        String.raw`var r = /^[\q{👶🏻}]$/v`,
        String.raw`var r = /[🇯\q{abc}🇵]/v`,
        "var r = /[🇯[A]🇵]/v",
        "var r = /[🇯[A--B]🇵]/v",
    ],
    invalid: [
        {
            code: `/[👍]/`,
            output: `/👍/`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[👍]foo/`,
            output: `/👍foo/`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[👍]foo/`,
            output: null,
            errors: [
                {
                    messageId: "characterClass",
                    suggestions: [
                        {
                            messageId: "fixCharacterClass",
                            output: String.raw`/👍foo/`,
                        },
                    ],
                },
            ],
        },
        {
            code: `/[👍]|foo/`,
            output: `/👍|foo/`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[👍a]foo/`,
            output: `/(?:👍|[a])foo/`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[👍a]|foo/`,
            output: `/👍|[a]|foo/`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[fooo👍bar]baz/`,
            output: `/(?:👍|[fooobar])baz/`,
            options: [{ fixable: true }],
            errors: [
                "The character(s) '👍' are all represented using multiple char codes. Use the `u` flag.",
            ],
        },
        {
            code: `/👍+/`,
            output: `/(?:👍)+/`,
            options: [{ fixable: true }],
            errors: [
                "The character '👍' is represented using a surrogate pair. The quantifier only applies to the tailing surrogate '\udc4d' (U+dc4d) and not to the whole character.",
            ],
        },
        {
            code: `/[Á]/`,
            output: `/Á/`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[Á]/u`,
            output: `/Á/u`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[❇️]/`,
            output: `/❇️/`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[❇️]/u`,
            output: `/❇️/u`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/❇️+/u`,
            output: `/(?:❇️)+/u`,
            options: [{ fixable: true }],
            errors: [
                "The character '❇️' is represented using multiple Unicode code points. The quantifier only applies to the last code point '\ufe0f' (U+fe0f) and not to the whole character.",
            ],
        },
        {
            code: `/[🇯🇵]/`,
            output: `/🇯🇵/`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[🇯🇵]/u`,
            output: `/🇯🇵/u`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[👨‍👩‍👦]/`,
            output: `/👨‍👩‍👦/`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/[👨‍👩‍👦]/u`,
            output: `/👨‍👩‍👦/u`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/👨‍👩‍👦+/`,
            output: `/(?:👨‍👩‍👦)+/`,
            options: [{ fixable: true }],
            errors: [{ messageId: "quantifierMulti" }],
        },
        {
            code: `/👨‍👩‍👦+/u`,
            output: `/(?:👨‍👩‍👦)+/u`,
            options: [{ fixable: true }],
            errors: [{ messageId: "quantifierMulti" }],
        },
        {
            code: `/[竈門禰󠄀豆子]|[煉󠄁獄杏寿郎]/`,
            output: `/禰󠄀|[竈門豆子]|煉󠄁|[獄杏寿郎]/`,
            options: [{ fixable: true }],
            errors: [
                "The character(s) '禰󠄀' are all represented using multiple char codes.",
                "The character(s) '煉󠄁' are all represented using multiple char codes.",
            ],
        },

        // RegExp constructors.

        {
            code: String.raw`new RegExp("[👍]", "")`,
            output: String.raw`new RegExp("👍", "")`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: String.raw`new RegExp("[\uD83D\uDC4D]", "")`,
            output: String.raw`new RegExp("👍", "")`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: String.raw`new RegExp("[Á]", "")`,
            output: String.raw`new RegExp("Á", "")`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: String.raw`new RegExp("[Á]", "u")`,
            output: String.raw`new RegExp("Á", "u")`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: String.raw`new RegExp("[❇️]", "")`,
            output: String.raw`new RegExp("❇️", "")`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: String.raw`new RegExp("[❇️]", "u")`,
            output: String.raw`new RegExp("❇️", "u")`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: String.raw`new RegExp("[🇯🇵]", "")`,
            output: String.raw`new RegExp("🇯🇵", "")`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: String.raw`new RegExp("[🇯🇵]", "u")`,
            output: String.raw`new RegExp("🇯🇵", "u")`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: String.raw`new RegExp("[👨‍👩‍👦]", "")`,
            output: String.raw`new RegExp("👨‍👩‍👦", "")`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: String.raw`new RegExp("[👨‍👩‍👦]", "u")`,
            output: String.raw`new RegExp("👨‍👩‍👦", "u")`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },

        // ES2024
        {
            code: String.raw`/[[👶🏻]]/v`,
            output: String.raw`/[[\q{👶🏻}]]/v`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: String.raw`/[👶🏻[👨‍👩‍👦]]/v`,
            output: String.raw`/[\q{👶🏻}[👨‍👩‍👦]]/v`,
            options: [{ fixable: true }],
            errors: [
                { messageId: "characterClass", column: 3 },
                { messageId: "characterClass", column: 8 },
            ],
        },
        {
            code: String.raw`/[👶🏻👨‍👩‍👦]/v`,
            output: String.raw`/[\q{👶🏻|👨‍👩‍👦}]/v`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: String.raw`/[👶🏻👨‍👩‍👦]/v`,
            output: String.raw`/[\q{👶🏻|👨‍👩‍👦}]/v`,
            options: [{ fixable: true }],
            errors: [
                "The character(s) '👶🏻', '👨‍👩‍👦' are all represented using multiple code points.",
            ],
        },
        {
            code: String.raw`/[👶🏻&👨‍👩‍👦]/v`,
            output: String.raw`/[\q{👶🏻|👨‍👩‍👦}&]/v`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: String.raw`/[^👶🏻&👨‍👩‍👦]/v`,
            output: null,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: String.raw`/[^👨‍👩‍👦]/v`,
            output: null,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: String.raw`new RegExp("[👨‍👩‍👦]", "v")`,
            output: String.raw`new RegExp("[\\q{👨‍👩‍👦}]", "v")`,
            options: [{ fixable: true }],
            errors: [{ messageId: "characterClass" }],
        },
        {
            code: `/👨‍👩‍👦+/v`,
            output: `/(?:👨‍👩‍👦)+/v`,
            options: [{ fixable: true }],
            errors: [{ messageId: "quantifierMulti" }],
        },
    ],
})
