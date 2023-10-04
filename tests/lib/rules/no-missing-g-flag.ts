import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-missing-g-flag"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-missing-g-flag", rule as any, {
    valid: [
        `
        const s = 'foo'
        const ret = s.replaceAll(/foo/g, 'bar')
        `,
        `
        const s = 'foo'
        const ret = s.matchAll(/foo/g)
        `,
        `
        const s = 'foo'
        const ret = s.replaceAll(new RegExp('foo', 'g'), 'bar')
        `,
        `
        const s = 'foo'
        const ret = s.matchAll(new RegExp('foo', 'g'))
        `,
        // not matchAll and replaceAll
        `
        const s = 'foo'
        const ret = s.replace(/foo/, 'bar')
        `,
        `
        const s = 'foo'
        const ret = s.match(/foo/)
        `,
        // unknown usage
        `
        const s = 'foo'
        const ret = s.replaceAll('bar', /foo/)
        `,
        `
        const ret = /foo/.replaceAll(p, 'bar')
        `,
        // unknown type
        `
        const ret = unknown.replaceAll(/foo/, 'bar')
        `,
        // unknown flags
        `
        const s = 'foo'
        const ret = s.replaceAll(new RegExp('foo', unknown), 'bar')
        `,
        // ES2024
        String.raw`
        const s = 'foo'
        const ret = s.replaceAll(/[\q{foo}]/gv, 'bar')
        `,
    ],
    invalid: [
        {
            code: `
            const s = 'foo'
            const ret = s.replaceAll(/foo/, 'bar')
            `,
            output: `
            const s = 'foo'
            const ret = s.replaceAll(/foo/g, 'bar')
            `,
            errors: [
                {
                    message:
                        "The pattern given to the argument of `String#replaceAll()` requires the `g` flag, but is missing it.",
                    line: 3,
                    column: 38,
                },
            ],
        },
        {
            code: `
            const s = 'foo'
            const ret = s.matchAll(/foo/)
            `,
            output: `
            const s = 'foo'
            const ret = s.matchAll(/foo/g)
            `,
            errors: [
                {
                    message:
                        "The pattern given to the argument of `String#matchAll()` requires the `g` flag, but is missing it.",
                    line: 3,
                    column: 36,
                },
            ],
        },
        {
            code: `
            const s = 'foo'
            const ret = s.replaceAll(new RegExp('foo'), 'bar')
            `,
            output: `
            const s = 'foo'
            const ret = s.replaceAll(new RegExp('foo', "g"), 'bar')
            `,
            errors: [
                {
                    message:
                        "The pattern given to the argument of `String#replaceAll()` requires the `g` flag, but is missing it.",
                    line: 3,
                    column: 38,
                },
            ],
        },
        {
            code: `
            const s = 'foo'
            const ret = s.matchAll(new RegExp('foo'))
            `,
            output: `
            const s = 'foo'
            const ret = s.matchAll(new RegExp('foo', "g"))
            `,
            errors: [
                {
                    message:
                        "The pattern given to the argument of `String#matchAll()` requires the `g` flag, but is missing it.",
                    line: 3,
                    column: 36,
                },
            ],
        },
        // Unknown pattern
        {
            code: `
            const s = 'foo'
            const ret = s.matchAll(new RegExp(foo))
            `,
            output: `
            const s = 'foo'
            const ret = s.matchAll(new RegExp(foo, "g"))
            `,
            errors: [
                {
                    message:
                        "The pattern given to the argument of `String#matchAll()` requires the `g` flag, but is missing it.",
                    line: 3,
                    column: 36,
                },
            ],
        },
        // Invalid pattern
        {
            code: `
            const s = 'foo'
            const ret = s.matchAll(new RegExp('{', 'u'))
            `,
            output: `
            const s = 'foo'
            const ret = s.matchAll(new RegExp('{', 'ug'))
            `,
            errors: [
                {
                    message:
                        "The pattern given to the argument of `String#matchAll()` requires the `g` flag, but is missing it.",
                    line: 3,
                    column: 36,
                },
            ],
        },
        // can't fix
        {
            code: `
            const p = /foo/
            const s = 'foo'
            const ret = s.replaceAll(p, 'bar')
            `,
            output: null,
            errors: [
                {
                    message:
                        "The pattern given to the argument of `String#replaceAll()` requires the `g` flag, but is missing it.",
                    line: 4,
                    column: 38,
                },
            ],
        },
        {
            // Variable flag
            code: `
            const s = 'foo'
            const flag = 'i'
            const ret = s.replaceAll(new RegExp('foo', flag), 'bar')
            `,
            output: null,
            errors: [
                {
                    message:
                        "The pattern given to the argument of `String#replaceAll()` requires the `g` flag, but is missing it.",
                    line: 4,
                    column: 38,
                },
            ],
        },
        {
            // Object property flag
            code: `
            const s = 'foo'
            const f = { flag: 'i' }
            const ret = s.replaceAll(new RegExp('foo', f.flag), 'bar')
            `,
            output: null,
            errors: [
                {
                    message:
                        "The pattern given to the argument of `String#replaceAll()` requires the `g` flag, but is missing it.",
                    line: 4,
                    column: 38,
                },
            ],
        },
        // unknown type with strictTypes: false
        {
            code: `
            const ret = s.replaceAll(/foo/, 'bar')
            `,
            output: `
            const ret = s.replaceAll(/foo/g, 'bar')
            `,
            options: [{ strictTypes: false }],
            errors: [
                {
                    message:
                        "The pattern given to the argument of `String#replaceAll()` requires the `g` flag, but is missing it.",
                    line: 2,
                    column: 38,
                },
            ],
        },
        {
            // ES2024
            code: String.raw`
            const s = 'foo'
            const ret = s.replaceAll(/[\q{foo}]/v, 'bar')
            `,
            output: String.raw`
            const s = 'foo'
            const ret = s.replaceAll(/[\q{foo}]/vg, 'bar')
            `,
            options: [{ strictTypes: false }],
            errors: [
                {
                    message:
                        "The pattern given to the argument of `String#replaceAll()` requires the `g` flag, but is missing it.",
                    line: 3,
                    column: 38,
                },
            ],
        },
    ],
})
