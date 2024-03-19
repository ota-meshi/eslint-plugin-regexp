import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-misleading-unicode-character"

const tester = new SnapshotRuleTester({
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
            options: [{ fixable: true }],
        },
        {
            code: `/[👍]foo/`,
            options: [{ fixable: true }],
        },
        {
            code: `/[👍]foo/`,
        },
        {
            code: `/[👍]|foo/`,
            options: [{ fixable: true }],
        },
        {
            code: `/[👍a]foo/`,
            options: [{ fixable: true }],
        },
        {
            code: `/[👍a]|foo/`,
            options: [{ fixable: true }],
        },
        {
            code: `/[fooo👍bar]baz/`,
            options: [{ fixable: true }],
        },
        {
            code: `/👍+/`,
            options: [{ fixable: true }],
        },
        {
            code: `/[Á]/`,
            options: [{ fixable: true }],
        },
        {
            code: `/[Á]/u`,
            options: [{ fixable: true }],
        },
        {
            code: `/[❇️]/`,
            options: [{ fixable: true }],
        },
        {
            code: `/[❇️]/u`,
            options: [{ fixable: true }],
        },
        {
            code: `/❇️+/u`,
            options: [{ fixable: true }],
        },
        {
            code: `/[🇯🇵]/`,
            options: [{ fixable: true }],
        },
        {
            code: `/[🇯🇵]/u`,
            options: [{ fixable: true }],
        },
        {
            code: `/[👨‍👩‍👦]/`,
            options: [{ fixable: true }],
        },
        {
            code: `/[👨‍👩‍👦]/u`,
            options: [{ fixable: true }],
        },
        {
            code: `/👨‍👩‍👦+/`,
            options: [{ fixable: true }],
        },
        {
            code: `/👨‍👩‍👦+/u`,
            options: [{ fixable: true }],
        },
        {
            code: `/[竈門禰󠄀豆子]|[煉󠄁獄杏寿郎]/`,
            options: [{ fixable: true }],
        },

        // RegExp constructors.

        {
            code: String.raw`new RegExp("[👍]", "")`,
            options: [{ fixable: true }],
        },
        {
            code: String.raw`new RegExp("[\uD83D\uDC4D]", "")`,
            options: [{ fixable: true }],
        },
        {
            code: String.raw`new RegExp("[Á]", "")`,
            options: [{ fixable: true }],
        },
        {
            code: String.raw`new RegExp("[Á]", "u")`,
            options: [{ fixable: true }],
        },
        {
            code: String.raw`new RegExp("[❇️]", "")`,
            options: [{ fixable: true }],
        },
        {
            code: String.raw`new RegExp("[❇️]", "u")`,
            options: [{ fixable: true }],
        },
        {
            code: String.raw`new RegExp("[🇯🇵]", "")`,
            options: [{ fixable: true }],
        },
        {
            code: String.raw`new RegExp("[🇯🇵]", "u")`,
            options: [{ fixable: true }],
        },
        {
            code: String.raw`new RegExp("[👨‍👩‍👦]", "")`,
            options: [{ fixable: true }],
        },
        {
            code: String.raw`new RegExp("[👨‍👩‍👦]", "u")`,
            options: [{ fixable: true }],
        },

        // ES2024
        {
            code: String.raw`/[[👶🏻]]/v`,
            options: [{ fixable: true }],
        },
        {
            code: String.raw`/[👶🏻[👨‍👩‍👦]]/v`,
            options: [{ fixable: true }],
        },
        {
            code: String.raw`/[👶🏻👨‍👩‍👦]/v`,
            options: [{ fixable: true }],
        },
        {
            code: String.raw`/[👶🏻&👨‍👩‍👦]/v`,
            options: [{ fixable: true }],
        },
        {
            code: String.raw`/[^👶🏻&👨‍👩‍👦]/v`,
            options: [{ fixable: true }],
        },
        {
            code: String.raw`/[^👨‍👩‍👦]/v`,
            options: [{ fixable: true }],
        },
        {
            code: String.raw`new RegExp("[👨‍👩‍👦]", "v")`,
            options: [{ fixable: true }],
        },
        {
            code: `/👨‍👩‍👦+/v`,
            options: [{ fixable: true }],
        },
    ],
})
