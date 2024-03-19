import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/prefer-named-replacement"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-named-replacement", rule as any, {
    valid: [
        `"str".replace(/regexp/, "foo")`,
        `"str".replace(/a(b)c/, "_$1_")`,
        `"str".replaceAll(/a(b)c/, "_$1_")`,
        `"str".replace(/a(?<foo>b)c/, "_$<foo>_")`,
        `"str".replaceAll(/a(?<foo>b)c/, "_$<foo>_")`,
        `"str".replace(/a(?<foo>b)c/, "_$0_")`,
        `"str".replace(/(a)(?<foo>b)c/, "_$1_")`,
        `"str".replace(/a(b)c/, "_$2_")`,
        `unknown.replace(/a(?<foo>b)c/, "_$1_")`,
        `unknown.replaceAll(/a(?<foo>b)c/, "_$1_")`,
    ],
    invalid: [
        `"str".replace(/a(?<foo>b)c/, "_$1_")`,
        `"str".replace(/a(?<foo>b)c/v, "_$1_")`,
        `"str".replaceAll(/a(?<foo>b)c/, "_$1_")`,
        `"str".replace(/(a)(?<foo>b)c/, "_$1$2_")`,
        {
            code: `unknown.replace(/a(?<foo>b)c/, "_$1_")`,
            options: [{ strictTypes: false }],
        },
        {
            code: `unknown.replaceAll(/a(?<foo>b)c/, "_$1_")`,
            options: [{ strictTypes: false }],
        },
    ],
})
