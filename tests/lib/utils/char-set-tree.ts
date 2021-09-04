import chai from "chai"
import assert from "assert"
import type { RegExpContext } from "../../../lib/utils"
import { parseFlags } from "../../../lib/utils"
import { jestSnapshotPlugin } from "mocha-chai-jest-snapshot"
import type { CharSetTree } from "../../../lib/utils/char-set-tree"
import { CharSetTreeRoot } from "../../../lib/utils/char-set-tree"
import { parseRegExpLiteral } from "regexpp"

chai.use(jestSnapshotPlugin())

function toTree(regex: RegExp) {
    const ast = parseRegExpLiteral(regex)
    return CharSetTreeRoot.fromElements(ast.pattern.alternatives[0].elements, {
        flags: parseFlags(""),
    } as RegExpContext)
}

describe("CharSetTree", function () {
    const regexes = [
        /abc/,
        /abcd/,
        /a[bc]d/,
        /ab(c|d)/,
        /a(b|c)d/,
        /ab?cd{3,6}/,
        /ab?cd?/,
        /a(b|c)d?(e|f|[ghi])/,
        /a*/,
        /a+/,
        /a{0,10}/,
        /a{0,11}/,
    ]
    describe("matching strings", function () {
        for (const regex of regexes) {
            it(regex.toString(), function () {
                const tree = toTree(regex)
                chai.expect(tree && treeToStrings(tree)).toMatchSnapshot()
            })
        }
    })
    describe("tree", function () {
        for (const regex of regexes) {
            it(regex.toString(), function () {
                const tree = toTree(regex)
                chai.expect(tree && normalizeTree(tree)).toMatchSnapshot()
            })
        }
    })
    describe("`includes` should return the expected result.", function () {
        const tests = [
            { base: /abcd/, target: /abcd/, result: true },
            { base: /abcd/, target: /abc/, result: true },
            { base: /abcd/, target: /bcd/, result: true },
            { base: /abcd/, target: /bc/, result: true },
            { base: /abc/, target: /abcd/, result: false },
            { base: /bcd/, target: /abcd/, result: false },
            { base: /bc/, target: /abcd/, result: false },
            { base: /abcd/, target: /\w[a-z]/, result: true },
            { base: /a\w[a-z]d/, target: /abcd/, result: true },
            { base: /a\w[a-z]/, target: /abcd/, result: false },
        ]

        for (const { base, target, result } of tests) {
            it(`${base.toString()} includes ${target.toString()}`, function () {
                const treeBase = toTree(base)
                const treeTarget = toTree(target)
                assert.deepStrictEqual(
                    result,
                    treeBase && treeTarget && treeBase.includes(treeTarget),
                )
            })
        }
    })
})

function treeToStrings(root: CharSetTreeRoot): string[] {
    const result: string[] = []
    for (const n of root.elements) {
        result.push(...toStrings(n))
    }
    return result

    function toStrings(tree: CharSetTree): string[] {
        const chars: string[] = []
        if (tree.charSet.size > 3) {
            chars.push(tree.raw)
        } else {
            for (const c of tree.charSet.characters()) {
                chars.push(String.fromCodePoint(c))
            }
        }
        if (!tree.next.length) {
            return chars
        }
        const results: string[] = []
        if (tree.end) {
            results.push(...chars)
        }
        for (const n of tree.next) {
            for (const next of toStrings(n)) {
                results.push(...chars.map((c) => c + next))
            }
        }
        return results
    }
}

function normalizeTree(root: CharSetTreeRoot): any {
    return root.elements.map(normalize)

    function normalize(tree: CharSetTree): any {
        const chars: string[] = []
        if (tree.charSet.size > 1) {
            chars.push(tree.raw)
        } else {
            for (const c of tree.charSet.characters()) {
                chars.push(String.fromCodePoint(c))
            }
        }
        return {
            charSet: chars.length === 1 ? chars[0] : chars.join(),
            end: tree.end,
            next: tree.next.map(normalize),
        }
    }
}
