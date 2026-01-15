import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-missing-g-flag.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
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
        `
            const s = 'foo'
            const ret = s.replaceAll(/foo/, 'bar')
            `,
        `
            const s = 'foo'
            const ret = s.matchAll(/foo/)
            `,
        `
            const s = 'foo'
            const ret = s.replaceAll(new RegExp('foo'), 'bar')
            `,
        `
            const s = 'foo'
            const ret = s.matchAll(new RegExp('foo'))
            `,
        // Unknown pattern
        `
            const s = 'foo'
            const ret = s.matchAll(new RegExp(foo))
            `,
        // Invalid pattern
        `
            const s = 'foo'
            const ret = s.matchAll(new RegExp('{', 'u'))
            `,
        // can't fix
        `
            const p = /foo/
            const s = 'foo'
            const ret = s.replaceAll(p, 'bar')
            `,
        // Variable flag
        `
            const s = 'foo'
            const flag = 'i'
            const ret = s.replaceAll(new RegExp('foo', flag), 'bar')
            `,
        // Object property flag
        `
            const s = 'foo'
            const f = { flag: 'i' }
            const ret = s.replaceAll(new RegExp('foo', f.flag), 'bar')
            `,
        // unknown type with strictTypes: false
        {
            code: `
            const ret = s.replaceAll(/foo/, 'bar')
            `,
            options: [{ strictTypes: false }],
        },
        {
            // ES2024
            code: String.raw`
            const s = 'foo'
            const ret = s.replaceAll(/[\q{foo}]/v, 'bar')
            `,
            options: [{ strictTypes: false }],
        },
    ],
})
