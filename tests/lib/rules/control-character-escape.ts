import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/control-character-escape"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("control-character-escape", rule as any, {
    valid: [
        String.raw`/\0\t\n\v\f\r/`,
        String.raw`RegExp(/\0\t\n\v\f\r/, "i")`,
        String.raw`RegExp("\0\t\n\v\f\r", "i")`,
        String.raw`RegExp("\\0\\t\\n\\v\\f\\r", "i")`,
        "/\\t/",
        "new RegExp('\t')",
        String.raw`/[\q{\0\t\n\v\f\r}]/v`,
    ],
    invalid: [
        String.raw`/\x00/`,
        String.raw`/\x0a/`,
        String.raw`/\cJ/`,
        String.raw`/\u{a}/u`,
        String.raw`RegExp("\\cJ")`,
        String.raw`RegExp("\\u{a}", "u")`,

        "/\\u0009/",
        "/\t/",
        String.raw`
            const s = "\\u0009"
            new RegExp(s)
            `,
        String.raw`
            const s = "\\u"+"0009"
            new RegExp(s)
            `,
        String.raw`RegExp("\t\r\n\0" + /	/.source)`,
        String.raw`/[\q{\x00}]/v`,
    ],
})
