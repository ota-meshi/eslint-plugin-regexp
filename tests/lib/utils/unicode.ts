import assert from "node:assert"
import { toCharSetSource } from "../../../lib/utils/refa.ts"
import {
    isSpace,
    isInvisible,
    CP_NEL,
    CP_ZWSP,
} from "../../../lib/utils/unicode.ts"

const SPACES =
    " \f\n\r\t\v\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff"

describe("isSpace", () => {
    for (const c of SPACES) {
        it(`${toCharSetSource(c.codePointAt(0)!, {})} is space`, () => {
            assert.ok(isSpace(c.codePointAt(0)!))
        })
    }

    for (const c of [CP_NEL, CP_ZWSP]) {
        it(`${toCharSetSource(c, {})} is not space`, () => {
            assert.ok(!isSpace(c))
        })
    }
})

describe("isInvisible", () => {
    const str = `${SPACES}\u0085\u200b\u200c\u200d\u200e\u200f\u2800`

    for (const c of str) {
        it(`${toCharSetSource(c.codePointAt(0)!, {})} is invisible`, () => {
            assert.ok(isInvisible(c.codePointAt(0)!))
        })
    }
})
