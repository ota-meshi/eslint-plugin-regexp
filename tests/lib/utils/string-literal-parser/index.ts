import assert from "node:assert"
import { parseStringLiteral } from "../../../../lib/utils/string-literal-parser/index.ts"

const TESTCASES = [
    {
        code: `"1234567890_abcdefghijklmnopqrstuvwxyz_ABCDEFGHIJKLMNOPQRSTUVWXYZ"`,
        q: '"',
        eval: null,
    },
    {
        code: `"\\n \\r \\t \\b \\v \\f \\\n \\\r\n \\xff \\u00AA \\u{41}"`,
        q: '"',
        eval: null,
    },
    {
        code: "`a\r\nb\nc`",
        q: "`",
        eval: null,
    },
    {
        code: String.raw`'\077'`,
        q: "'",
        eval: "?",
    },
    {
        code: String.raw`'\777'`,
        q: "'",
        eval: "?7",
    },
]

describe("parseStringLiteral", () => {
    for (const test of TESTCASES) {
        describe(test.code, () => {
            const parsed = parseStringLiteral(test.code)
            // eslint-disable-next-line no-eval -- for test
            const evalStr = test.eval ?? eval(test.code)
            it("equals eval", () => {
                assert.strictEqual(parsed.value, evalStr)
            })
            it("equals loc", () => {
                let start = 0
                for (const t of parsed.tokens) {
                    const end = start + t.value.length
                    assert.strictEqual(t.value, evalStr.slice(start, end))
                    start = end
                    if (!test.eval)
                        assert.strictEqual(
                            t.value,
                            // eslint-disable-next-line no-eval -- for test
                            eval(
                                `${test.q}${test.code.slice(...t.range)}${
                                    test.q
                                }`,
                            ),
                        )
                }
            })
        })
    }
})
