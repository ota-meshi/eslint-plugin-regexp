import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-unused-capturing-group"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-unused-capturing-group", rule as any, {
    valid: [
        String.raw`
        var replaced = '2000-12-31'.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1/$2/$3') // "2000/12/31"
        var replaced = '2000-12-31'.replace(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/u, '$<y>/$<m>/$<d>') // "2000/12/31"
        
        var isDate = /(?:\d{4})-(?:\d{2})-(?:\d{2})/.test('2000-12-31') // true
        
        var matches = '2000-12-31 2001-01-01'.match(/(\d{4})-(\d{2})-(\d{2})/)
        var y = matches[1] // "2000"
        var m = matches[2] // "12"
        var d = matches[3] // "31"
        
        var index = '2000-12-31'.search(/(?:\d{4})-(?:\d{2})-(?:\d{2})/) // 0
        `,
        "var replaced = '2000-12-31'.replace(/(\\d{4})-(\\d{2})-(\\d{2})/, (_, y, m, d) => `${y}/${m}/${d}`)",
        "var replaced = '2000-12-31'.replace(/(?<y>\\d{4})-(?<m>\\d{2})-(?<d>\\d{2})/, (_, y, m, d, o, s, g) => `${g.y}/${g.m}/${g.d}`)",
        String.raw`
        // var replaced = '2000-12-31'.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1/$2')
        var replaced = '2000-12-31'.replace(/\d{4}-\d{2}-\d{2}/, '$1/$2')
        var replaced = (20001231).replace(/(\d{4})-(\d{2})-(\d{2})/, '$1/$2')
        var replaced = '2000-12-31'.replace(unknown, '$1/$2')
        var replaced = '2000-12-31'.replace(/(\d{4})-(\d{2})-(\d{2})/, 1234)
        var replaced = '2000-12-31'.repl(/(\d{4})-(\d{2})-(\d{2})/, '$1/$2')

        // var isDate = /(\d{4})-(\d{2})-(\d{2})/.test('2000-12-31')
        var isDate = /(\d{4})-(\d{2})-(\d{2})/.test(123)
        
        // var matches = '2000-12-31 2001-01-01'.match(/(\d{4})-(\d{2})-(\d{2})/g)
        var matches = '2000-12-31 2001-01-01'.match(/\d{4}-\d{2}-\d{2}/g)
        var matches = '2000-12-31 2001-01-01'.match(unknown)
        var matches = (20001231).match(/(\d{4})-(\d{2})-(\d{2})/g)
        
        // var index = '2000-12-31'.search(/(\d{4})-(\d{2})-(\d{2})/)
        var index = '2000-12-31'.search(/\d{4}-\d{2}-\d{2}/)
        var index = '2000-12-31'.search(unknown)
        var index = (20001231).search(/(\d{4})-(\d{2})-(\d{2})/)
        `,
        "var replaced = '2000-12-31'.replace(/(?<y>\\d{4})-(?<m>\\d{2})-(?<d>\\d{2})/, (_, y, m, ...d) => `${y}/${m}/${d}`)",
        // Duplicate capture group name
        // String.raw`var replaced = '2000-12-31'.replace(/(?<n>\d{4})|(?<n>\d{2})|(?<n>\d{1})/, '$<n>')`,
        String.raw`
        const regexp = /(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/
        let re 
        while(re = regexp.exec('2000-12-31 2001-01-01')) {
            const y = re.groups.y // "2000"
            const m = re.groups.m // "12"
            const d = re.groups.d // "31"
        }
        `,
        String.raw`
        const { groups: {...ymd} } = '2000-12-31'.match(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/)
        `,
        String.raw`
        for (const matches of '2000-12-31 2000-12-31'.matchAll(/(\d{4})-(\d{2})-(\d{2})/g)) {
            var y = matches[1] // "2000"
            var m = matches[2] // "12"
            var d = matches[3] // "31"
        }
        `,
    ],
    invalid: [
        {
            code: String.raw`
            var replaced = '2000-12-31'.replace(/(\d{4})-(\d{2})-(\d{2})/, 'Date') // "Date"
            var replaced = '2000-12-31'.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1/$2') // "2000/12"
            var replaced = '2000-12-31'.replace(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/u, '$<y>/$<m>') // "2000/12"
            var replaced = '2000-12-31'.replace(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/u, '$1/$2/$3') // "2000/12/31"
            
            var isDate = /(\d{4})-(\d{2})-(\d{2})/.test('2000-12-31') // true
            
            var matches = '2000-12-31 2001-01-01'.match(/(\d{4})-(\d{2})-(\d{2})/g) // ["2000-12-31", "2001-01-01"]
            
            var index = '2000-12-31'.search(/(\d{4})-(\d{2})-(\d{2})/) // 0
            `,
            errors: [
                {
                    message: "Capturing group is defined but never used.",
                    line: 2,
                    column: 50,
                    endLine: 2,
                    endColumn: 57,
                },
                {
                    message: "Capturing group is defined but never used.",
                    line: 2,
                    column: 58,
                    endLine: 2,
                    endColumn: 65,
                },
                {
                    message: "Capturing group is defined but never used.",
                    line: 2,
                    column: 66,
                    endLine: 2,
                    endColumn: 73,
                },
                {
                    message: "Capturing group is defined but never used.",
                    line: 3,
                    column: 66,
                    endLine: 3,
                    endColumn: 73,
                },
                {
                    message: "'d' capturing group is defined but never used.",
                    line: 4,
                    column: 74,
                    endLine: 4,
                    endColumn: 85,
                },
                {
                    message:
                        "'y' is defined for capturing group, but it name is never used.",
                    line: 5,
                    column: 50,
                    endLine: 5,
                    endColumn: 61,
                },
                {
                    message:
                        "'m' is defined for capturing group, but it name is never used.",
                    line: 5,
                    column: 62,
                    endLine: 5,
                    endColumn: 73,
                },
                {
                    message:
                        "'d' is defined for capturing group, but it name is never used.",
                    line: 5,
                    column: 74,
                    endLine: 5,
                    endColumn: 85,
                },
                {
                    message: "Capturing group is defined but never used.",
                    line: 7,
                    column: 27,
                    endLine: 7,
                    endColumn: 34,
                },
                {
                    message: "Capturing group is defined but never used.",
                    line: 7,
                    column: 35,
                    endLine: 7,
                    endColumn: 42,
                },
                {
                    message: "Capturing group is defined but never used.",
                    line: 7,
                    column: 43,
                    endLine: 7,
                    endColumn: 50,
                },
                {
                    message: "Capturing group is defined but never used.",
                    line: 9,
                    column: 58,
                    endLine: 9,
                    endColumn: 65,
                },
                {
                    message: "Capturing group is defined but never used.",
                    line: 9,
                    column: 66,
                    endLine: 9,
                    endColumn: 73,
                },
                {
                    message: "Capturing group is defined but never used.",
                    line: 9,
                    column: 74,
                    endLine: 9,
                    endColumn: 81,
                },
                {
                    message: "Capturing group is defined but never used.",
                    line: 11,
                    column: 46,
                    endLine: 11,
                    endColumn: 53,
                },
                {
                    message: "Capturing group is defined but never used.",
                    line: 11,
                    column: 54,
                    endLine: 11,
                    endColumn: 61,
                },
                {
                    message: "Capturing group is defined but never used.",
                    line: 11,
                    column: 62,
                    endLine: 11,
                    endColumn: 69,
                },
            ],
        },
        {
            code:
                "var replaced = '2000-12-31'.replace(/(\\d{4})-(\\d{2})-(\\d{2})/, (_, y, m) => `${y}/${m}`)",
            errors: [
                {
                    message: "Capturing group is defined but never used.",
                    line: 1,
                    column: 54,
                    endLine: 1,
                    endColumn: 61,
                },
            ],
        },
        {
            code:
                "var replaced = '2000-12-31'.replace(/(?<y>\\d{4})-(?<m>\\d{2})-(?<d>\\d{2})/, (_, y, m, d) => `${y}/${m}/${d}`)",
            errors: [
                "'y' is defined for capturing group, but it name is never used.",
                "'m' is defined for capturing group, but it name is never used.",
                "'d' is defined for capturing group, but it name is never used.",
            ],
        },
        {
            code: String.raw`
            var replaced = '2000-12-31'.replace(/(\d{4})-(\d{2})-(\d{2})/, '$4/$5/$6')
            var replaced = '2000-12-31'.replace(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/u, '$<yy>/$<mm>/$<dd>')
            `,
            errors: [
                "Capturing group is defined but never used.",
                "Capturing group is defined but never used.",
                "Capturing group is defined but never used.",
                "'y' capturing group is defined but never used.",
                "'m' capturing group is defined but never used.",
                "'d' capturing group is defined but never used.",
            ],
        },
        {
            code: String.raw`
            var replaced = '2000-12-31'.replaceAll(/(\d{4})-(\d{2})-(\d{2})/g, 'foo')
            `,
            errors: [
                "Capturing group is defined but never used.",
                "Capturing group is defined but never used.",
                "Capturing group is defined but never used.",
            ],
        },
        {
            code: String.raw`var index = '2000-12-31 2000-12-31'.search(/(\d{4})-(\d{2})-(\d{2}) \1-\2-\2/)`,
            errors: [
                {
                    message: "Capturing group is defined but never used.",
                    line: 1,
                    column: 61,
                    endLine: 1,
                    endColumn: 68,
                },
            ],
        },
        {
            code: String.raw`var index = '2000-12-31 2000-12-31'.search(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2}) \k<y>-\k<d>-\k<d>/)`,
            errors: [
                {
                    message: "'m' capturing group is defined but never used.",
                    line: 1,
                    column: 57,
                    endLine: 1,
                    endColumn: 68,
                },
            ],
        },
        {
            code: String.raw`
            var matches = '2000-12-31'.match(/(\d{4})-(\d{2})-(\d{2})/)
            var y = matches[1] // "2000"
            var m = matches[2] // "12"
            // var d = matches[3] // "31"
            `,
            errors: [
                {
                    message: "Capturing group is defined but never used.",
                    line: 2,
                    column: 63,
                    endLine: 2,
                    endColumn: 70,
                },
            ],
        },
        {
            code: String.raw`
            const groups = '2000-12-31'.match(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/).groups
            const y = groups.y // "2000"
            const d = groups.d // "31"
            `,
            errors: ["'m' capturing group is defined but never used."],
        },
        {
            code: String.raw`
            const { groups } = '2000-12-31'.match(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/)
            const y = groups.y // "2000"
            const d = groups.d // "31"
            `,
            errors: ["'m' capturing group is defined but never used."],
        },
        {
            code: String.raw`
            const { groups: {y,d} } = '2000-12-31'.match(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/)
            `,
            errors: ["'m' capturing group is defined but never used."],
        },
        {
            code: String.raw`
            const [,y,m,d] = '2000-12-31'.match(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/)
            `,
            errors: [
                "'y' is defined for capturing group, but it name is never used.",
                "'m' is defined for capturing group, but it name is never used.",
                "'d' is defined for capturing group, but it name is never used.",
            ],
        },
        {
            code: String.raw`
            const {y,m} = '2000-12-31'.match(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/)["groups"]
            `,
            errors: ["'d' capturing group is defined but never used."],
        },
        {
            code: String.raw`
            const { groups: {m, d} = {} } = '2000-12-31'.match(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/)
            `,
            errors: ["'y' capturing group is defined but never used."],
        },
        {
            code: String.raw`
            const { ["groups"]: {m, d} = {} } = '2000-12-31'.match(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/)
            `,
            errors: ["'y' capturing group is defined but never used."],
        },
        {
            code: String.raw`
            for (const matches of '2000-12-31 2000-12-31'.matchAll(/(\d{4})-(\d{2})-(\d{2})/g)) {
                var y = matches[1] // "2000"
                // var m = matches[2] // "12"
                // var d = matches[3] // "31"
            }
            
            `,
            errors: [
                {
                    message: "Capturing group is defined but never used.",
                    line: 2,
                    column: 77,
                    endLine: 2,
                    endColumn: 84,
                },
                {
                    message: "Capturing group is defined but never used.",
                    line: 2,
                    column: 85,
                    endLine: 2,
                    endColumn: 92,
                },
            ],
        },
        {
            code: String.raw`
            const re = '2000-12-31 2000-12-31'.matchAll(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/g)
            for (const matches of re) {
                var y = matches[1] // "2000"
                var m = matches.groups.m // "12"
                // var d = matches[3] // "31"
            }
            
            `,
            errors: [
                "'y' is defined for capturing group, but it name is never used.",
                "'d' capturing group is defined but never used.",
            ],
        },
        {
            code: String.raw`
            let re
            re = '2000-12-31 2000-12-31'.matchAll(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/g)
            for (const matches of re) {
                var y = matches[1] // "2000"
                var m = matches.groups.m // "12"
                // var d = matches[3] // "31"
            }
            
            `,
            errors: [
                "'y' is defined for capturing group, but it name is never used.",
                "'d' capturing group is defined but never used.",
            ],
        },
        {
            code: String.raw`
            let re
            re = '2000-12-31 2000-12-31'.matchAll(/(?<y>\d{4})-(?<m>\d{2})-(\d{2})/g)
            for (const matches of re) {
                var y = matches[1] // "2000"
                const {...groups} = matches.groups
                var m = groups.m // "12"
                // var d = matches[3] // "31"
            }
            
            `,
            errors: ["Capturing group is defined but never used."],
        },
    ],
})
