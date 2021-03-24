/*
eslint-disable
    eslint-comments/disable-enable-pair,
    regexp/no-dupe-characters-character-class,
    regexp/prefer-question-quantifier,
    regexp/prefer-star-quantifier,
    regexp/prefer-character-class,
    regexp/prefer-range,
    regexp/order-in-character-class,
    regexp/no-useless-character-class,
    regexp/no-useless-non-capturing-group,
    regexp/no-useless-range,
    regexp/prefer-quantifier,
--------------------------------------------- ignore */
import assert from "assert"
import { parseRegExpLiteral } from "regexpp"
import { isCoveredNode, isEqualNodes } from "../../../lib/utils/regexp-ast"
type TestCase = {
    a: RegExp | string
    b: RegExp | string
    result: boolean
}
const TESTCASES_FOR_IS_EQUAL_NODES: TestCase[] = [
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
        a: String.raw`/[\p{ASCII}\P{ASCII}]/u`,
        b: String.raw`/[\P{ASCII}\p{ASCII}]/u`,
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
    for (const testCase of TESTCASES_FOR_IS_EQUAL_NODES) {
        it(`${
            typeof testCase.a === "string" ? testCase.a : testCase.a.source
        } : ${
            typeof testCase.b === "string" ? testCase.b : testCase.b.source
        }`, () => {
            const ast1 = parseRegExpLiteral(testCase.a)
            const ast2 = parseRegExpLiteral(testCase.b)

            assert.deepStrictEqual(isEqualNodes(ast1, ast2), testCase.result)
        })
    }
})

const TESTCASES_FOR_COVERED_NODE: TestCase[] = [
    {
        a: /./,
        b: /abc/,
        result: true,
    },
    {
        a: /ab|ba/,
        b: /ba|ac/,
        result: false,
    },
    {
        a: /a/,
        b: /a/,
        result: true,
    },
    {
        a: /a/,
        b: /ab/,
        result: true,
    },
    {
        a: /abcd/,
        b: /abc/,
        result: false,
    },
    {
        a: /abc/,
        b: /abcd/,
        result: true,
    },
    {
        a: /a.c/,
        b: /abc/,
        result: true,
    },
    {
        a: /a.[c]/,
        b: /abc/,
        result: true,
    },
    {
        a: /[a-d]/,
        b: /[a-c]/,
        result: true,
    },
    {
        a: /[a-b]/,
        b: /[a-b]/,
        result: true,
    },
    {
        a: /[a-b]/,
        b: /[a-c]/,
        result: false,
    },
    {
        a: /[^a-c]/,
        b: /[^a-d]/,
        result: true,
    },
    {
        a: /[^a-c]/,
        b: /[^a-b]/,
        result: false,
    },
    {
        a: /[^a-c]/,
        b: /[d-f]/,
        result: true,
    },
    {
        a: /ab|(d)(ef)/,
        b: /abc|(?:def)/,
        result: true,
    },
    {
        a: /abc|(?:def)/,
        b: /ab|(d)(ef)/,
        result: false,
    },
    {
        a: /a/,
        b: /ab|(ad)|[a]bc/,
        result: true,
    },
    {
        a: /a{3}/,
        b: /a{4}/,
        result: true,
    },
    {
        a: /a{2,5}/,
        b: /a{3,4}/,
        result: true,
    },
    {
        a: /a{3,4}/,
        b: /a{3,5}/,
        result: true,
    },
    {
        a: /a{3,4}/,
        b: /a{3,5}/,
        result: true,
    },
    {
        a: /a{3,4}/,
        b: /a{2,5}/,
        result: false,
    },
    {
        a: /a{4}/,
        b: /a{3}/,
        result: false,
    },
    {
        a: /a{3}/,
        b: /a{4}/,
        result: true,
    },
    {
        a: /a{3}/,
        b: /aaaa/,
        result: true,
    },
    {
        a: /a+/,
        b: /aaaa/,
        result: true,
    },
    {
        a: /aaaa/,
        b: /a+/,
        result: false,
    },
    {
        a: /(?=a)/,
        b: /(?=a)a/,
        result: true,
    },
    {
        a: /(?=a)a/,
        b: /(?=a)ab/,
        result: true,
    },
    {
        a: /(?=a)ab/,
        b: /(?=a)a/,
        result: false,
    },
    {
        a: /^/,
        b: /^abc/,
        result: true,
    },
    {
        a: /^abc/,
        b: /^/,
        result: false,
    },
]
describe("regexp-ast isCoveredNode", () => {
    for (const testCase of [
        ...TESTCASES_FOR_COVERED_NODE,
        ...TESTCASES_FOR_IS_EQUAL_NODES.filter((t) => t.result),
    ]) {
        it(`${
            typeof testCase.a === "string" ? testCase.a : testCase.a.source
        } : ${
            typeof testCase.b === "string" ? testCase.b : testCase.b.source
        }`, () => {
            const ast1 = parseRegExpLiteral(testCase.a)
            const ast2 = parseRegExpLiteral(testCase.b)

            assert.deepStrictEqual(isCoveredNode(ast1, ast2), testCase.result)
        })
    }
})
