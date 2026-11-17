import assert from "node:assert"
import { Linter } from "eslint"
import regexp from "../../lib/index.ts"

describe("Modifier groups", () => {
    const linter = new Linter({ configType: "flat" })

    function check(rule: string, code: string) {
        return linter.verifyAndFix(code, {
            languageOptions: { ecmaVersion: 2025 },
            plugins: { regexp },
            rules: { [`regexp/${rule}`]: "error" },
        })
    }

    const unchanged = [
        ["no-useless-non-capturing-group", "x(?i:ab)", ""],
        ["no-useless-non-capturing-group", "(?-i:a)b", "i"],
        ["no-useless-non-capturing-group", "(?m:^a$)", ""],
        ["no-useless-non-capturing-group", "(?-s:.)", "s"],
        ["no-useless-non-capturing-group", "(?i:a|b)", ""],
        ["no-useless-non-capturing-group", "(?=(?i:a))a", ""],
        ["optimal-quantifier-concatenation", "(?i:a)a*", ""],
        ["optimal-quantifier-concatenation", "(?i:a*)a*", ""],
        ["optimal-quantifier-concatenation", "(?i:(?-i:a)a*)", ""],
        ["prefer-question-quantifier", "(?i:a|)", ""],
        ["prefer-question-quantifier", "(?-i:a|)?", "i"],
        ["prefer-question-quantifier", "(?i:(?-i:a|))", ""],
        ["letter-case", "(?-i:x|X)", "i"],
        ["letter-case", "(?i:(?-i:x|X))", "i"],
        ["letter-case", "(?-i:[A-Z])", "i"],
        ["letter-case", "(?i:X)", ""],
        ["letter-case", "(?-i:(?i:[A-Z]))", "i"],
        ["prefer-character-class", "(?i:a|b|c)", ""],
        ["prefer-character-class", "(?-i:a|A|b)", "i"],
        ["prefer-character-class", "(?i:(?:a|b|c))", ""],
        ["prefer-character-class", "a|b|(?i:c)", ""],
    ]
    for (const [rule, pattern, flags] of unchanged) {
        for (const code of [
            `const r = /${pattern}/${flags};`,
            `const r = new RegExp(${JSON.stringify(pattern)}, "${flags}");`,
        ]) {
            it(`preserves ${code} with ${rule}`, () => {
                const result = check(rule, code)
                assert.deepStrictEqual(result.messages, [])
                assert.strictEqual(result.output, code)
                assert.strictEqual(result.fixed, false)
            })
        }
    }

    const fixes = [
        ["no-useless-non-capturing-group", "x(?:(?i:ab))", "x(?i:ab)", ""],
        ["no-useless-non-capturing-group", "(?i:(?:ab))", "(?i:ab)", ""],
        ["no-useless-non-capturing-group", "(?i:a)(?:bc)", "(?i:a)bc", ""],
        ["prefer-question-quantifier", "(?i:a{0,1})", "(?i:a?)", ""],
        ["prefer-question-quantifier", "(?i:(?:a|))", "(?i:(?:a)?)", ""],
        ["prefer-question-quantifier", "(?i:a)(?:b|)", "(?i:a)(?:b)?", ""],
        ["letter-case", "(?-i:X)Y", "(?-i:X)y", "i"],
        [
            "letter-case",
            String.raw`(?-i:\u004A)`,
            String.raw`(?-i:\u004a)`,
            "i",
        ],
    ]
    for (const [rule, pattern, expected, flags] of fixes) {
        for (const constructor of [false, true]) {
            const code = constructor
                ? `new RegExp(${JSON.stringify(pattern)}, "${flags}")`
                : `/${pattern}/${flags}`
            const output = constructor
                ? `new RegExp(${JSON.stringify(expected)}, "${flags}")`
                : `/${expected}/${flags}`
            it(`still fixes ${code} with ${rule}`, () => {
                const result = check(rule, code)
                assert.deepStrictEqual(result.messages, [])
                assert.strictEqual(result.output, output)
                assert.strictEqual(result.fixed, true)
            })
        }
    }

    it("still fixes ordinary patterns in the same file", () => {
        const result = check(
            "optimal-quantifier-concatenation",
            "const a = /(?i:a)a*/; const b = /aa*/;",
        )
        assert.deepStrictEqual(result.messages, [])
        assert.strictEqual(
            result.output,
            "const a = /(?i:a)a*/; const b = /a+/;",
        )
    })

    it("still reports unrelated rules inside modifier groups", () => {
        const code = "/(?i:a{0})b/"
        const result = check("no-zero-quantifier", code)
        assert.strictEqual(result.output, code)
        assert.strictEqual(result.messages.length, 1)
        assert.strictEqual(
            result.messages[0].ruleId,
            "regexp/no-zero-quantifier",
        )
        assert.strictEqual(result.messages[0].messageId, "unexpected")
        assert.strictEqual(result.messages[0].suggestions?.length, 1)
    })

    it("still reports invalid modifier groups in constructors", () => {
        const result = check("no-invalid-regexp", 'new RegExp("(?ii:a)")')
        assert.strictEqual(result.messages.length, 1)
        assert.strictEqual(
            result.messages[0].ruleId,
            "regexp/no-invalid-regexp",
        )
    })
})
