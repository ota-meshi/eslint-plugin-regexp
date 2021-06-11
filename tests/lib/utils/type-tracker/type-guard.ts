import type { TestCase } from "./test-utils"
import { testTypeTrackerWithLinter } from "./test-utils"

const TESTCASES: TestCase[] = [
    {
        code: `
        // no type guard
        function fn(a) {
            a
        }
        `,
        type: [],
    },
    {
        code: `
        // typeof type guard
        function fn(a) {
            if(typeof a === 'string') {
                a
            }
        }
        `,
        type: ["String"],
    },
    {
        code: `
        // no type guard
        function fn(a, b) {
            if(typeof a === 'string') {
                b
            }
        }
        `,
        type: [],
    },
    {
        code: `
        // typeof type guard with &&
        function fn(a, b) {
            if(typeof a === 'string' && b) {
                a
            }
        }
        `,
        type: ["String"],
    },
    {
        code: `
        // typeof type guard (number)
        function fn(a) {
            if(typeof a === 'number') {
                a
            }
        }
        `,
        type: ["Number"],
    },
    {
        code: `
        // typeof type guard (boolean)
        function fn(a) {
            if(typeof a === 'boolean') {
                a
            }
        }
        `,
        type: ["Boolean"],
    },
    {
        code: `
        // instanceof type guard
        function fn(a) {
            if(a instanceof RegExp) {
                a
            }
        }
        `,
        type: ["RegExp"],
    },
    {
        code: `
        // constant type guard
        function fn(a) {
            if(a === 'str') {
                a
            }
        }
        `,
        type: ["String"],
    },
    {
        code: `
        // else block type guard
        function fn(a) {
            if(a !== 'str') {
            } else {
                a
            }
        }
        `,
        type: ["String"],
    },
    {
        code: `
        // isArray type guard
        function fn(a) {
            if(Array.isArray(a)) {
                a
            }
        }
        `,
        type: ["Array"],
    },
    {
        code: `
        // early return type guard
        function fn(a) {
            if(a !== 'str') {
                return
            }
            a
        }
        `,
        type: ["String"],
    },
    {
        code: `
        // early return type guard
        function fn(a) {
            if(a !== 'str') return
            a
        }
        `,
        type: ["String"],
    },
    {
        code: `
        // early return type guard with else
        function fn(a) {
            if(a === 'str') {
            } else {
                return
            }
            a
        }
        `,
        type: ["String"],
    },
    {
        code: `
        // early return type guard with not
        function fn(a) {
            if(a !== 'str') {
                return
            } else {
            }
            a
        }
        `,
        type: ["String"],
    },
    {
        code: `
        // not early return
        function fn(a) {
            if(a !== 'str') {
            } else {
            }
            a
        }
        `,
        type: [],
    },
    {
        code: `
        // complexity early return type guard
        function fn(a, b) {
            if(b) {
                if (a !== 'str') {
                    return
                }
            } else {
                if (a !== 'str') {
                    return
                }
            }
            a
        }
        `,
        type: ["String"],
    },
    {
        code: `
        // complexity early return type guard
        function fn(a) {
            if((typeof a !== 'number') || a) {
                return
            }
            a
        }
        `,
        type: ["Number"],
    },
    {
        code: `
        // not early return
        function fn(a, b) {
            if(b) {
                if (a !== 'str') {
                    return
                }
            } else {
            }
            a
        }
        `,
        type: [],
    },
    {
        code: `
        // member
        function fn(a) {
            if(a?.b === 'str') {
                a.b
            }
        }
        `,
        type: ["String"],
    },
    {
        code: `
        // member
        function fn(a) {
            if(a.b === 'str') {
                a?.b
            }
        }
        `,
        type: ["String"],
    },
    {
        code: `
        // member
        function fn(a) {
            if((a?.b).c === 'str') {
                a.b.c
            }
        }
        `,
        type: ["String"],
    },
    {
        code: `
        // member
        function fn(a) {
            if(a.b.c === 'str') {
                (a?.b).c
            }
        }
        `,
        type: ["String"],
    },
    {
        code: `
        // member no type guard
        function fn(a) {
            if(a?.b === 'str') {
                a.b()
            }
        }
        `,
        type: [],
    },
    {
        code: `
        // member no type guard
        function fn(a) {
            if(a?.b === 'str') {
                a.c
            }
        }
        `,
        type: [],
    },
    {
        code: `
        // union type guard
        function fn(a) {
            if(a === 'str' || typeof a == 'number') {
                a
            }
        }
        `,
        type: ["Number", "String"],
    },
    {
        code: `
        // union type guard with early return
        function fn(a) {
            if(a === 'str' || typeof a == 'number') {
            } else {
                return
            }
            a
        }
        `,
        type: ["Number", "String"],
    },
    {
        code: `
        // type guard with this
        class A {
            fn() {
                if(this.a === 'str') {
                    /* target */
                    (this.a)
                }
            }
        }`,
        type: ["String"],
    },
    {
        code: `
        // complexity type guard
        function fn(a) {
            if(!Boolean(typeof a === 'number')) {
                return
            }
            a
        }
        `,
        type: ["Number"],
    },
    {
        code: `
        // switch type guard
        function fn(a) {
            switch (a) {
                case 'str':
                    a
            }
        }
        `,
        type: ["String"],
    },
    {
        code: `
        // switch type guard
        function fn(a) {
            switch (typeof a) {
                case 'number':
                    a
            }
        }
        `,
        type: ["Number"],
    },
    {
        code: `
        // switch type guard with early return
        function fn(a) {
            switch (typeof a) {
                case 'number':
                    break;
                default:
                    return;
            }
            a
        }
        `,
        type: ["Number"],
    },
    {
        code: `
        // switch type guard with early return
        function fn(a) {
            switch (a) {
                case 'a':
                case 'b':
                    break;
                default:
                    return;
            }
            a
        }
        `,
        type: ["String"],
    },
    {
        code: `
        // switch without early return
        function fn(a) {
            switch (a) {
                case 'a':
                case 'b':
                    break;
                default:
                    break;
            }
            a
        }
        `,
        type: [],
    },
    {
        code: `
        // no type guard
        function fn(a) {
            if(typeof a + 'str') {
                a
            }
        }
        `,
        type: [],
    },
    {
        code: `
        // no type guard
        function fn(a) {
            const b = typeof a === 'str'
            a
        }
        `,
        type: [],
    },
    {
        code: `
        // no type guard
        function fn(a) {
            if (RegExp instanceof a) {
                a
            }
        }
        `,
        type: [],
    },
    {
        code: `
        // no type guard
        function fn(a) {
            const b = a instanceof RegExp
            a
        }
        `,
        type: [],
    },
    {
        code: `
        // no type guard
        function fn(a) {
            const b = a == 'str'
            a
        }
        `,
        type: [],
    },
    {
        code: `
        // no type guard
        function fn(a) {
            const b = Array.isArray(a)
            a
        }
        `,
        type: [],
    },
    {
        code: `
        // no type guard
        function fn(a) {
            if (ArrayLike.isArray(a)) {
                a
            }
        }
        `,
        type: [],
    },
    {
        code: `
        // no type guard
        function fn(a) {
            if(!Number(typeof a !== 'number')) {
                a
            }
        }
        `,
        type: [],
    },
    {
        code: `
        // no type guard
        function fn(a, b) {
            if(Number(typeof a === 'number' || a === 'str')) {
                a
            }
        }
        `,
        type: [],
    },
    {
        code: `
        // no type guard
        function fn(a) {
            if(+Boolean(typeof a !== 'number')) {
                a
            }
        }
        `,
        type: [],
    },
    {
        code: `
        // no type guard
        function fn(a, b) {
            if(+Boolean(typeof a === 'number' || a === 'str')) {
                return
            }
            a
        }
        `,
        type: [],
    },
    {
        code: `
        // no type guard
        function fn(a) {
            if((typeof a === 'number') ?? (typeof a === 'string')) {
                a
            }
        }
        `,
        type: [],
    },
    {
        code: `
        // no type guard
        function fn(a) {
            if((typeof a !== 'number') && a) {
                return
            }
            a
        }
        `,
        type: [],
    },
    {
        code: `
        // no type guard
        function fn(a) {
            if((typeof a !== 'number') && a) {
                a
            }
        }
        `,
        type: [],
    },
    {
        code: `
        // no type guard
        function fn(a) {
            if(!((typeof a !== 'number') && a)) {
            } else {
                return
            }
            a
        }
        `,
        type: [],
    },
    {
        code: `
        // no type guard
        function fn(a,b) {
            switch (a) {
                case b:
                    a
            }
        }
        `,
        type: [],
    },
    {
        code: `
        // complexity union type guard with early return
        function fn(a) {
            if(!((typeof a === 'number') || (typeof a === 'string'))) {
                return
            }
            a
        }
        `,
        type: ["Number", "String"],
    },
    {
        code: `
        // complexity union type guard
        function fn(a) {
            if(Boolean((typeof a === 'number') || (typeof a === 'string'))) {
                a
            }
        }
        `,
        type: ["Number", "String"],
    },
    {
        code: `
        // complexity union type guard
        function fn(a, b) {
            if(Boolean((typeof a === 'number') || (typeof a === 'string')) && b) {
                a
            }
        }
        `,
        type: ["Number", "String"],
    },
    {
        code: `
        // complexity type guard
        function fn(a, b) {
            if((b && typeof a === 'number') ) {
                a
            }
        }
        `,
        type: ["Number"],
    },
    {
        code: `
        // complexity type guard
        function fn(a, b) {
            if( !(b && typeof a === 'number') ) {
                return
            }
            a
        }
        `,
        type: ["Number"],
    },
    {
        code: `
        // complexity no type guard
        function fn(a, b) {
            if( !(b && typeof a === 'number') ) {
                a
            }
        }
        `,
        type: [],
    },
    {
        code: `
        // complexity no type guard
        function fn(a, b) {
            if( !(b && typeof a === 'number') && a) { }
        }
        `,
        type: [],
    },
    {
        code: `
        // complexity type guard
        function fn(a, b, c) {
            if(c && !!(b && typeof a === 'number') ) {
                a
            }
        }
        `,
        type: ["Number"],
    },
    {
        code: `
        // complexity no type guard
        function fn(a, b) {
            if( (b || typeof a !== 'number') ) {
                a
            }
        }
        `,
        type: [],
    },
    {
        code: `
        // complexity type guard
        function fn(a, b) {
            if( (b || typeof a !== 'number') ) {
                return
            }
            a
        }
        `,
        type: ["Number"],
    },
    {
        code: `
        // complexity no type guard
        function fn(a, b) {
            if( (b || a !== 'str') ) {
                return
            }
            a
        }
        `,
        type: [],
    },
    {
        code: `
        // complexity no type guard
        function fn(a, b) {
            if( typeof a === 'string' || b ) {
                a
            }
        }
        `,
        type: [],
    },
    {
        code: `
        // complexity no type guard
        function fn(a, b) {
            if( typeof a === 'string' || b ) {
            } else {
                a
            }
        }
        `,
        type: [],
    },
    {
        code: `
        // complexity no type guard
        function fn(a, b) {
            if( b || typeof a === 'string' ) {
                a
            }
        }
        `,
        type: [],
    },
    {
        code: `
        // complexity no type guard
        function fn(a, b) {
            if( b || typeof a === 'string' ) {
            } else {
                a
            }
        }
        `,
        type: [],
    },
    {
        code: `
        // constant complexity type guard
        function fn(a, b) {
            if (!(a !== 'str')) {
                a
            } else {}
        }
        `,
        type: ["String"],
    },
    {
        code: `
        // constant no type guard
        function fn(a, b) {
            if (!(a !== 'str')) {
            } else {
                a
            }
        }
        `,
        type: [],
    },
    {
        code: `
        // constant no type guard
        function fn(a, b) {
            if ((a !== 'str')) {
                a
            }
        }
        `,
        type: [],
    },
    {
        code: `
        // constant type guard with not with else
        function fn(a, b) {
            if ((a !== 'str')) {
            } else {
                a
            }
        }
        `,
        type: ["String"],
    },
    {
        code: `
        // constant type guard  with early return
        function fn(a, b) {
            if ((a !== 'str')) {
                return
            }
            a
        }
        `,
        type: ["String"],
    },
    {
        code: `
        // complexity no type guard
        function fn(a) {
            if ((typeof a === 'string') && (typeof a === 'number')) {
                a
            }
        }
        `,
        type: [],
    },
    {
        code: `
        // complexity type guard
        function fn(a) {
            if (typeof a === 'string' || typeof a === 'number') {
                if (typeof a === 'string') {
                    a
                }
            }
        }
        `,
        type: ["String"],
    },
    {
        code: `
        // complexity type guard
        function fn(a) {
            if (typeof a === 'string') {
                if (typeof a === 'string' || typeof a === 'number') {
                    a
                }
            }
        }
        `,
        type: ["String"],
    },
]
describe("type track for type guard", () => {
    for (const testCase of TESTCASES.reverse()) {
        it(testCase.code, () => {
            testTypeTrackerWithLinter(testCase)
        })
    }
})
