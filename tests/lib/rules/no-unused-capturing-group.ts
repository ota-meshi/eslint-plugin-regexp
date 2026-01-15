import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-unused-capturing-group.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-unused-capturing-group", rule as any, {
    valid: [
        `
        const computed = \`---\\n\${Object.keys(fileIntro)
            .map((key) => \`\${key}: \${yamlValue(fileIntro[key])}\`)
            .join("\\n")}\\n---\\n\`

        const fileIntroPattern = /^---\\n(.*\\n)+---\\n*/gu

        if (fileIntroPattern.test(this.content)) {
            this.content = this.content.replace(fileIntroPattern, computed)
        } else {
            this.content = \`\${computed}\${this.content.trim()}\\n\`
        }
        `,
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
        String.raw`
        // var replaced = '2000-12-31'.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1/$2')
        var replaced = '2000-12-31'.replace(/\d{4}-\d{2}-\d{2}/, '$1/$2')
        var replaced = (20001231).replace(/(\d{4})-(\d{2})-(\d{2})/, '$1/$2')
        var replaced = '2000-12-31'.replace(unknown, '$1/$2')
        var replaced = '2000-12-31'.repl(/(\d{4})-(\d{2})-(\d{2})/, '$1/$2')

        // var isDate = /(\d{4})-(\d{2})-(\d{2})/.test('2000-12-31')

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
        String.raw`
        const s = '2000-12-31 2000-12-31'
        const reg = /(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/g;
        if(reg.test(s)) {
            s.replace(reg, '$<y>/$<m>/$<d>');
        }
        `,
        String.raw`
        const reg = /(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/g;
        '2000-12-31 2000-12-31'.replace(reg, '$<y>/$<m>');
        '2000-12-31 2000-12-31'.replace(reg, '$<m>/$<d>');
        `,
        String.raw`
        const reg = /,/;
        'a,b,c'.split(reg)
        `,
        String.raw`
        const reg = /(,)/;
        'a,b,c'.split(reg)
        `,
        {
            // exported
            code: String.raw`
            /* exported regexp */
            const regexp = /(\d{4})-(\d{2})-(\d{2})/
            const replaced = '2000-12-31'.replace(regexp, 'Date') // "Date"
            `,
            languageOptions: {
                ecmaVersion: 2020,
                sourceType: "script",
            },
        },
        // Unused names.
        "var replaced = '2000-12-31'.replace(/(?<y>\\d{4})-(?<m>\\d{2})-(?<d>\\d{2})/, (_, y, m, d) => `${y}/${m}/${d}`)",
        "var replaced = '2000-12-31'.replace(/(?<y>\\d{4})-(?<m>\\d{2})-(?<d>\\d{2})/, function (_, y, m, d) {return `${y}/${m}/${d}`})",
        "var replaced = '2000-12-31'.replaceAll(/(?<y>\\d{4})-(?<m>\\d{2})-(?<d>\\d{2})/g, (_, y, m, d) => `${y}/${m}/${d}`)",
        "var replaced = '2000-12-31'.replace(/(?<y>\\d{4})-(?<m>\\d{2})-(?<d>\\d{2})/, (_, y, m, d, o, s, g) => `${g.y}/${g.m}/${g.d}`)",
        String.raw`'2000-12-31'.replace(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/u, '$1/$2/$3') // "2000/12/31"`,
        String.raw`const [,y,m,d] = '2000-12-31'.match(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/)`,
        // https://github.com/ota-meshi/eslint-plugin-regexp/issues/353
        `const string = 'foo:abc,bar:def'.replace(/foo:(?<foo>\\w+),bar:(?<bar>\\w+)/, (...args) => {
            const { foo, bar } = args.at(-1);
            return \`\${ bar },\${ foo }\`;
        });`,
        String.raw`
        const regexp = /(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/
        let match
        while(match = regexp.exec(foo)) {
            const m = [...match]
        }
        `,
        String.raw`
        const matches = [...('2000-12-31 2000-12-31'.matchAll(/(\d{4})-(\d{2})-(\d{2})/g))]
        `,
        String.raw`
        const bs = [...'abc_abc'.matchAll(/a(b)/g)].map(m => m[1])
        `,
        String.raw`
        ;[...'abc_abc'.matchAll(/a(b)(c)/g)].forEach(m => console.log(m[1], m[2]))
        `,
        String.raw`
        const filtered = [...'abc_abc_abb_acc'.matchAll(/(?<a>.)(?<b>.)(?<c>.)/g)].filter(m => m.groups.b === m.groups.c);
        console.log(filtered[0].groups.a);
        `,
        String.raw`
        const element = [...'abc_abc_abb_acc'.matchAll(/(?<a>.)(?<b>.)(?<c>.)/g)].find(m => m.groups.b === m.groups.c);
        console.log(element.groups.a);
        `,
        String.raw`
        const text = 'Lorem ipsum dolor sit amet'
        const replaced = text.replace(/([\q{Lorem|ipsum}])/vg, '**$1**')
        `,
        // hasIndices
        String.raw`const re = /(foo)/d
        console.log(re.exec('foo').indices[1])
        `,
        String.raw`const re = /(?<f>foo)/d
        console.log(re.exec('foo').indices.groups.f)
        `,
        String.raw`const re = /(foo)/d
        console.log(re.exec('foo').indices[unknown])
        `,

        {
            code: String.raw`const REGEX_SEMANTIC_VERSION = /(?<majorVersion>\d+)\.(?<minorVersion>\d+)\.(?<patchVersion>\d+)(?:-(?<suffix>.+))?/;`,
            options: [{ allowNamed: true }],
        },
    ],
    invalid: [
        {
            code: String.raw`'2000-12-31'.replace(/(\d{4})-(\d{2})-(\d{2})/, 'Date') `,
            options: [{ fixable: true }],
        },
        {
            code: String.raw`'2000-12-31'.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1/$2') // "2000/12"`,
            options: [{ fixable: true }],
        },
        {
            code: String.raw`'2000-12-31'.replace(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/u, '$<y>/$<m>') // "2000/12"`,
            options: [{ fixable: true }],
        },
        String.raw`/(\d{4})-(\d{2})-(\d{2})/.test('2000-12-31') // true`,
        String.raw`'2000-12-31 2001-01-01'.match(/(\d{4})-(\d{2})-(\d{2})/g) // ["2000-12-31", "2001-01-01"]`,
        String.raw`'2000-12-31'.search(/(\d{4})-(\d{2})-(\d{2})/) // 0`,
        "var replaced = '2000-12-31'.replace(/(\\d{4})-(\\d{2})-(\\d{2})/, (_, y, m) => `${y}/${m}`)",
        String.raw`
            var replaced = '2000-12-31'.replace(/(\d{4})-(\d{2})-(\d{2})/, '$4/$5/$6')
            var replaced = '2000-12-31'.replace(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/u, '$<yy>/$<mm>/$<dd>')
            `,
        String.raw`
            var replaced = '2000-12-31'.replaceAll(/(\d{4})-(\d{2})-(\d{2})/g, 'foo')
            `,
        String.raw`var index = '2000-12-31 2000-12-31'.search(/(\d{4})-(\d{2})-(\d{2}) \1-\2-\2/)`,
        String.raw`var index = '2000-12-31 2000-12-31'.search(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2}) \k<y>-\k<d>-\k<d>/)`,
        String.raw`
            var matches = '2000-12-31'.match(/(\d{4})-(\d{2})-(\d{2})/)
            var y = matches[1] // "2000"
            var m = matches[2] // "12"
            // var d = matches[3] // "31"
            `,
        String.raw`
            const groups = '2000-12-31'.match(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/).groups
            const y = groups.y // "2000"
            const d = groups.d // "31"
            `,
        String.raw`
            const { groups } = '2000-12-31'.match(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/)
            const y = groups.y // "2000"
            const d = groups.d // "31"
            `,
        String.raw`
            const { groups: {y,d} } = '2000-12-31'.match(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/)
            `,
        String.raw`
            const {y,m} = '2000-12-31'.match(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/)["groups"]
            `,
        String.raw`
            const { groups: {m, d} = {} } = '2000-12-31'.match(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/)
            `,
        String.raw`
            const { ["groups"]: {m, d} = {} } = '2000-12-31'.match(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/)
            `,
        String.raw`
            for (const matches of '2000-12-31 2000-12-31'.matchAll(/(\d{4})-(\d{2})-(\d{2})/g)) {
                var y = matches[1] // "2000"
                // var m = matches[2] // "12"
                // var d = matches[3] // "31"
            }

            `,
        String.raw`
            const re = '2000-12-31 2000-12-31'.matchAll(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/g)
            for (const matches of re) {
                var y = matches[1] // "2000"
                var m = matches.groups.m // "12"
                // var d = matches[3] // "31"
            }
            `,
        String.raw`
            let re
            re = '2000-12-31 2000-12-31'.matchAll(/(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/g)
            for (const matches of re) {
                var y = matches[1] // "2000"
                var m = matches.groups.m // "12"
                // var d = matches[3] // "31"
            }
            `,
        String.raw`
            let re
            re = '2000-12-31 2000-12-31'.matchAll(/(?<y>\d{4})-(?<m>\d{2})-(\d{2})/g)
            for (const matches of re) {
                var y = matches[1] // "2000"
                const {...groups} = matches.groups
                var m = groups.m // "12"
                // var d = matches[3] // "31"
            }
            `,
        String.raw`
            const result = [...'2000-12-31 2000-12-31'.matchAll(/(?<y>\d{4})-(?<m>\d{2})-(\d{2})/g)]
            for (const matches of result) {
                var y = matches[1] // "2000"
                var m = matches.groups.m // "12"
                // var d = matches[3] // "31"
            }
            `,
        String.raw`
            const result = [
                { 1: 2000, groups: { m: 12 } },
                ...'2000-12-31 2000-12-31'.matchAll(/(?<y>\d{4})-(?<m>\d{2})-(\d{2})/g),
                ...'2000/12/31 2000/12/31'.matchAll(/(?<y>\d{4})\/(?<m>\d{2})\/(?<d>\d{2})/g),
            ]
            for (const matches of result) {
                var y = matches[1]
                var m = matches.groups.m
                // var d = matches[3]
            }
            `,
        String.raw`var isDate = /(\d{4})-(\d{2})-(\d{2})/.test(foo)`,
        String.raw`
            const regexp = /(?<y>\d{4})-(?<m>\d{2})-(?<d>\d{2})/
            let re
            while(re = regexp.exec(foo)) {
                const y = re.groups.y
                // const m = re.groups.m
                const d = re.groups.d
            }
            `,
        String.raw`
            const regexp = /(\d{4})-(\d{2})-(\d{2})/
            let re
            while(re = regexp.exec(foo)) {
                const [,y,m] = re
            }
            `,
        String.raw`'str'.replace(/(?<foo>\w+)/, () => {});`,
        {
            code: String.raw`
            const bs = [...'abc_abc'.matchAll(/a(b)/g)].map(m => m[0])
            `,
            options: [{ fixable: true }],
        },
        {
            code: String.raw`
            ;[...'abc_abc'.matchAll(/a(b)(c)/g)].forEach(m => console.log(m[1]))
            `,
            options: [{ fixable: true }],
        },
        {
            code: String.raw`
            const filtered = [...'abc_abc_abb_acc'.matchAll(/(?<a>.)(?<b>.)(?<c>.)/g)].filter(m => m.groups.b === m.groups.c);
            console.log(filtered[0].groups.b);
            `,
            options: [{ fixable: true }],
        },
        {
            code: String.raw`
            const filtered = [...'abc_abc_abb_acc'.matchAll(/(?<a>.)(?<b>.)(?<c>.)/g)].filter(m => m.groups.a === m.groups.c);
            console.log(filtered[0].groups.a);
            `,
            options: [{ fixable: true }],
        },
        {
            code: String.raw`
            const element = [...'abc_abc_abb_acc'.matchAll(/(?<a>.)(?<b>.)(?<c>.)/g)].find(m => m.groups.a === m.groups.c);
            console.log(element.groups.a);
            `,
            options: [{ fixable: true }],
        },
        {
            code: String.raw`
            const text = 'Lorem ipsum dolor sit amet'
            const replaced = text.replace(/([\q{Lorem|ipsum}])/gv, '**Lorem ipsum**')
            `,
            options: [{ fixable: true }],
        },
        // hasIndices
        {
            code: String.raw`const re = /(foo)/d
            console.log(re.exec('foo').indices[2])
            `,
            options: [{ fixable: true }],
        },
        {
            code: String.raw`const re = /(?<f>foo)/d
            console.log(re.exec('foo').indices.groups.x)
            `,
            options: [{ fixable: true }],
        },
    ],
})
