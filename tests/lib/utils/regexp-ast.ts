/*
eslint-disable
    eslint-comments/disable-enable-pair,
    regexp/no-dupe-characters-character-class,
    regexp/match-any,
    regexp/prefer-question-quantifier,
    regexp/prefer-star-quantifier,
--------------------------------------------- ignore */
import assert from "assert"
import { parseRegExpLiteral } from "regexpp"
import { isEqualNodes } from "../../../lib/utils/regexp-ast"
type TestCase = {
    a: RegExp
    b: RegExp
    result: boolean
}
const TESTCASES: TestCase[] = [
    {
        a: /a/,
        b: /a/,
        result: true,
    },
    {
        a: /a/,
        b: /b/,
        result: false,
    },
    {
        a: /a|b/,
        b: /b|a/,
        result: true,
    },
    {
        a: /a|b/,
        b: /b|a /,
        result: false,
    },
    {
        a: /^(a|b)$/,
        b: /^(b|a)$/,
        result: true,
    },
    {
        a: /^/,
        b: /$/,
        result: false,
    },
    {
        a: /^(a|b)$/,
        b: /^(b|a) $/,
        result: false,
    },
    {
        a: /a\b/,
        b: /a\b/,
        result: true,
    },
    {
        a: /(?=a)/,
        b: /(?=a)/,
        result: true,
    },
    {
        a: /(?=a)/,
        b: /(?=b)/,
        result: false,
    },
    {
        a: /(?=a|b)/,
        b: /(?=b|a)/,
        result: true,
    },
    {
        a: /(?=a)/,
        b: /(?!a)/,
        result: false,
    },
    {
        a: /(?!a)/,
        b: /(?!a)/,
        result: true,
    },
    {
        a: /(?<=a)/,
        b: /(?<=a)/,
        result: true,
    },
    {
        a: /(?<=a)/,
        b: /(?<=b)/,
        result: false,
    },
    {
        a: /(?<=a|b)/,
        b: /(?<=b|a)/,
        result: true,
    },
    {
        a: /(?<=a)/,
        b: /(?<!a)/,
        result: false,
    },
    {
        a: /(?<!a)/,
        b: /(?<!a)/,
        result: true,
    },
    {
        a: /(a)\1/,
        b: /(a)\1/,
        result: true,
    },
    {
        a: /(a)\1/,
        b: /(a)\2/,
        result: false,
    },
    {
        a: /(abc|def|\d{1,3})/,
        b: /(\d{1,3}|abc|def)/,
        result: true,
    },
    {
        a: /(abc|def)/,
        b: /(\d{1,3}|abc|def)/,
        result: false,
    },
    {
        a: /(?:abc|def|\d{1,3})/,
        b: /(?:\d{1,3}|abc|def)/,
        result: true,
    },
    {
        a: /(?:abc|def)/,
        b: /(?:\d{1,3}|abc|def)/,
        result: false,
    },
    {
        a: /AB/u,
        b: /\u{41}\u0042/u,
        result: true,
    },
    {
        a: /AB/u,
        b: /\u{41}b/u,
        result: false,
    },
    {
        a: /[abc]/u,
        b: /[cba]/u,
        result: true,
    },
    {
        a: /[abc]/u,
        b: /[cb]/u,
        result: false,
    },
    {
        a: /[a-cdef]/u,
        b: /[defa-c]/u,
        result: true,
    },
    {
        a: /[a-cdef]/u,
        b: /[defa-d]/u,
        result: false,
    },
    {
        a: /[A-C]/u,
        b: /[\u{41}-C]/u,
        result: true,
    },
    {
        a: /.|\s|\w/u,
        b: /\s|.|\w/u,
        result: true,
    },
    {
        a: /.|\s|\w/u,
        b: /\s|_|\w/u,
        result: false,
    },
    {
        a: /[\p{ASCII}\P{ASCII}]/u,
        b: /[\P{ASCII}\p{ASCII}]/u,
        result: true,
    },
    {
        a: /abc/iu,
        b: /abc/u,
        result: false,
    },
    {
        a: /a*/u,
        b: /a*/u,
        result: true,
    },
    {
        a: /a*/u,
        b: /a{0,}/u,
        result: true,
    },
    {
        a: /a?/u,
        b: /a{0,1}/u,
        result: true,
    },
]
describe("regexp-ast isEqualNodes", () => {
    for (const testCase of TESTCASES) {
        it(`${testCase.a.source} : ${testCase.b.source}`, () => {
            const ast1 = parseRegExpLiteral(testCase.a)
            const ast2 = parseRegExpLiteral(testCase.b)

            assert.deepStrictEqual(isEqualNodes(ast1, ast2), testCase.result)
        })
    }
})
