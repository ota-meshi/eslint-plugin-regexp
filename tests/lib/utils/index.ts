import assert from "assert"
import { charToRegExpText } from "../../../lib/utils"

describe("charToRegExpText", () => {
    for (const c of "abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789") {
        const cp = c.codePointAt(0)!
        it(`0x${cp.toString(16)} to ${c}`, () => {
            assert.strictEqual(charToRegExpText(cp, {}), c)
        })
    }
    it(`0x9 to \\t`, () => {
        assert.strictEqual(charToRegExpText(9, {}), "\\t")
    })
    it(`0xA to \\n`, () => {
        assert.strictEqual(charToRegExpText(10, {}), "\\n")
    })
    it(`0xC to \\f`, () => {
        assert.strictEqual(charToRegExpText(12, {}), "\\f")
    })
    it(`0xD to \\n`, () => {
        assert.strictEqual(charToRegExpText(13, {}), "\\r")
    })
})

describe("charToRegExpText for invisible", () => {
    const str =
        "\v\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff" +
        "\u0085\u200b\u200c\u200d\u200e\u200f\u2800"

    for (const c of str) {
        const cp = c.codePointAt(0)!
        it(`0x${cp.toString(16)}`, () => {
            assert.notStrictEqual(charToRegExpText(cp, {}), c)
        })
    }
})
