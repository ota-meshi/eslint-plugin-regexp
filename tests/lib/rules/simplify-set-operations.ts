import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/simplify-set-operations.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("simplify-set-operations", rule as any, {
    valid: [
        "/[[abc]]/v",
        String.raw`/[\d]/u`,
        String.raw`/[^\d]/v`,
        "/[a--b]/v",
        "/[a&&b]/v",
        "/[^ab]/v",
        "/[^a&&b]/v;",
        String.raw`/[\s\p{ASCII}]/u`,
        String.raw`/[^\S\P{ASCII}]/u`,
        "/[^[]]/v",
        "/[a&&b&&[c]]/v",
        "/[a--b--[c]]/v",
    ],
    invalid: [
        "/[a&&[^b]]/v",
        "/[a&&b&&[^c]]/v",
        "/[a&&[^b]&&c]/v",
        "/[a&&b&&[^c]&&d]/v",
        "/[[^a]&&b&&c]/v",
        "/[[^b]&&a]/v",
        "/[[abc]&&[^def]]/v",
        "/[a--[^b]]/v",
        "/[a--[^b]--c]/v",
        "/[a--b--[^c]]/v",
        "/[[abc]--[^def]]/v",
        "/[[^a]&&[^b]]/v",
        "/[^[^a]&&[^b]]/v",
        String.raw`/[[^a]&&[^b]&&\D]/v`,
        String.raw`/[^[^a]&&[^b]&&\D]/v`,
        String.raw`/[[^a]&&\D&&b]/v`,
        String.raw`/[[^abc]&&[^def]&&\D]/v`,
        "/[[^a]&&[b]&&[^c]]/v",
        "/[[^a][^b]]/v",
        "/[[^abc][^def]]/v",
        "/[^[^a][^b]]/v",
        String.raw`/[^\S\P{ASCII}]/v`,
        "/[a&&[^b]&&[^c]&&d]/v",
        "/[[^bc]&&a&&d]/v",
    ],
})
