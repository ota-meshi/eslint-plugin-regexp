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
        String.raw`/[[abc]]/v`,
        String.raw`/[\d]/u`,
        String.raw`/[^\d]/v`,
        String.raw`/[a--b]/v`,
        String.raw`/[a&&b]/v`,
        String.raw`/[^ab]/v`,
        String.raw`/[^a&&b]/v;`,
        String.raw`/[\s\p{ASCII}]/u`,
        String.raw`/[^\S\P{ASCII}]/u`,
        String.raw`/[^[]]/v`,
        String.raw`/[a&&b&&[c]]/v`,
        String.raw`/[a--b--[c]]/v`,
    ],
    invalid: [
        String.raw`/[a&&[^b]]/v`,
        String.raw`/[a&&b&&[^c]]/v`,
        String.raw`/[a&&[^b]&&c]/v`,
        String.raw`/[a&&b&&[^c]&&d]/v`,
        String.raw`/[[^a]&&b&&c]/v`,
        String.raw`/[[^b]&&a]/v`,
        String.raw`/[[abc]&&[^def]]/v`,
        String.raw`/[a--[^b]]/v`,
        String.raw`/[a--[^b]--c]/v`,
        String.raw`/[a--b--[^c]]/v`,
        String.raw`/[[abc]--[^def]]/v`,
        String.raw`/[[^a]&&[^b]]/v`,
        String.raw`/[^[^a]&&[^b]]/v`,
        String.raw`/[[^a]&&[^b]&&\D]/v`,
        String.raw`/[^[^a]&&[^b]&&\D]/v`,
        String.raw`/[[^a]&&\D&&b]/v`,
        String.raw`/[[^abc]&&[^def]&&\D]/v`,
        String.raw`/[[^a]&&[b]&&[^c]]/v`,
        String.raw`/[[^a][^b]]/v`,
        String.raw`/[[^abc][^def]]/v`,
        String.raw`/[^[^a][^b]]/v`,
        String.raw`/[^\S\P{ASCII}]/v`,
        String.raw`/[a&&[^b]&&[^c]&&d]/v`,
        String.raw`/[[^bc]&&a&&d]/v`,
    ],
})
