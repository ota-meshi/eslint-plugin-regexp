import assert from "node:assert"
import { Linter } from "eslint"
import regexp from "../../lib/index.ts"

describe("Modifier groups", () => {
    const linter = new Linter({ configType: "flat" })
    const cases = [
        ["no-useless-non-capturing-group", "x(?i:ab)", ""],
        ["no-useless-non-capturing-group", "(?-i:a)b", "i"],
        ["optimal-quantifier-concatenation", "(?i:a)a*", ""],
        ["prefer-question-quantifier", "(?i:a|)", ""],
        ["letter-case", "(?-i:x|X)", "i"],
        ["prefer-character-class", "(?i:a|b|c)", ""],
        ["no-useless-non-capturing-group", "(?:(?i:ab))", ""],
        ["letter-case", "(?i:(?-i:x|X))", "i"],
        ["no-useless-non-capturing-group", "x(?m:^a$)", ""],
        ["no-useless-non-capturing-group", "x(?-s:.)", "s"],
        ["no-useless-non-capturing-group", "(?=(?i:a))a", ""],
    ]

    for (const [rule, pattern, flags] of cases) {
        for (const code of [
            `const r = /${pattern}/${flags};`,
            `const r = new RegExp(${JSON.stringify(pattern)}, "${flags}");`,
        ]) {
            it(`does not report or fix ${code} with ${rule}`, () => {
                const result = linter.verifyAndFix(code, {
                    languageOptions: { ecmaVersion: 2025 },
                    plugins: { regexp },
                    rules: { [`regexp/${rule}`]: "error" },
                })

                assert.deepStrictEqual(result.messages, [])
                assert.strictEqual(result.output, code)
                assert.strictEqual(result.fixed, false)
            })
        }
    }

    it("keeps modifier groups unchanged with the recommended configuration", () => {
        const code = cases
            .map(([, pattern, flags]) => `/${pattern}/${flags}.test(str);`)
            .join("\n")
        const result = linter.verifyAndFix(code, regexp.configs.recommended)

        assert.deepStrictEqual(result.messages, [])
        assert.strictEqual(result.output, code)
    })

    it("still fixes ordinary patterns in the same file", () => {
        const result = linter.verifyAndFix(
            "const a = /x(?i:ab)/; const b = /x(?:ab)/;",
            {
                plugins: { regexp },
                rules: { "regexp/no-useless-non-capturing-group": "error" },
            },
        )

        assert.deepStrictEqual(result.messages, [])
        assert.strictEqual(
            result.output,
            "const a = /x(?i:ab)/; const b = /xab/;",
        )
    })

    it("still reports invalid modifier groups in constructors", () => {
        const messages = linter.verify('new RegExp("(?ii:a)")', {
            plugins: { regexp },
            rules: { "regexp/no-invalid-regexp": "error" },
        })

        assert.strictEqual(messages.length, 1)
        assert.strictEqual(messages[0].ruleId, "regexp/no-invalid-regexp")
    })
})
