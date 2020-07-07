import assert from "assert"
import {
    isSpace,
    isInvisible,
    invisibleEscape,
    CP_NEL,
    CP_ZWSP,
} from "../../../lib/utils/unicode"

const SPACES =
    " \f\n\r\t\v\u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff"

describe("isSpace", () => {
    for (const c of SPACES) {
        it(`${invisibleEscape(c)} is space`, () => {
            assert.ok(isSpace(c.codePointAt(0)!))
        })
    }

    for (const c of [CP_NEL, CP_ZWSP]) {
        it(`${invisibleEscape(c)} is not space`, () => {
            assert.ok(!isSpace(c))
        })
    }
})

describe("isInvisible", () => {
    const str = `${SPACES}\u0085\u200b\u200c\u200d\u200e\u200f\u2800`

    for (const c of str) {
        it(`${invisibleEscape(c)} is invisible`, () => {
            assert.ok(isInvisible(c.codePointAt(0)!))
        })
    }
})
