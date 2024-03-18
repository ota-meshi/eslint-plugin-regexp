import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/prefer-w"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-w", rule as any, {
    valid: ["/\\w/", "/[\\Da-zA-Z_#]/", "/\\w/v", "/[\\Da-zA-Z_#]/v"],
    invalid: [
        "/[0-9a-zA-Z_]/",
        "/[0-9a-zA-Z_#]/",
        "/[\\da-zA-Z_#]/",
        "/[0-9a-z_[\\s&&\\p{ASCII}]]/iv",
        "/[0-9a-z_]/i",
        "/[^0-9a-zA-Z_]/",
        "/[^0-9A-Z_]/i",
        `
            const s = "[0-9A-Z_]"
            new RegExp(s, 'i')
            `,
        `
            const s = "[0-9"+"A-Z_]"
            new RegExp(s, 'i')
            `,
        `
            const s = "[0-9A-Z_c]"
            new RegExp(s, 'i')
            `,
        `
            const s = "[0-9"+"A-Z_c]"
            new RegExp(s, 'i')
            `,
        `
            const s = "[0-9A-Z_-]"
            new RegExp(s, 'i')
            `,
    ],
})
