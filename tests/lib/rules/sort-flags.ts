import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/sort-flags.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("sort-flags", rule as any, {
    valid: [
        String.raw`/\w/i`,
        String.raw`/\w/im`,
        String.raw`/\w/gi`,
        String.raw`/\w/gimsuy`,
        String.raw`/\w/gimsvy`,
        String.raw`new RegExp("\\w", "i")`,
        String.raw`new RegExp("\\w", "gi")`,
        String.raw`new RegExp("\\w", "gimsuy")`,
        String.raw`new RegExp("\\w", "dgimsuy")`,
        String.raw`new RegExp("\\w", "dgimsvy")`,

        // ignore
        String.raw`
        const flags = "yusimg"
        new RegExp("\\w", flags)
        new RegExp("\\w", flags)
        `,
    ],
    invalid: [
        String.raw`/\w/yusimg`,
        String.raw`/\w/yvsimg`,
        String.raw`new RegExp("\\w", "yusimg")`,
        String.raw`new RegExp("\\w", "yusimgd")`,

        // sort flags even on invalid patterns
        String.raw`new RegExp("\\w)", "ui")`,
        // sort flags even on unknown
        String.raw`RegExp('a' + b, 'us');`,
        // sort flags even on non-owned pattern
        String.raw`var a = "foo"; RegExp(foo, 'us'); RegExp(foo, 'u');`,
    ],
})
