import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-unused-global-flag"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-unused-global-flag", rule as any, {
    valid: [
        `
        let c = 0
        for (const regex = /foo/g; c<=5; c++) {
            console.log(c, regex.test(''));
        } 
        `,
        `
        const regex = /foo/g;
        regex.test(bar);
        regex.test(bar);
        `,
        `
        const regex = /foo/g;
        regex.exec(bar);
        regex.exec(bar);
        `,
        `
        const regex = /foo/g;
        `,
        `
        const regex = /foo/g;
        function fn () {
            return regex.test(bar);
        }
        `,
        `
        const regex = /foo/g;
        while (foo) {
            regex.test(bar);
        }
        `,
        `
        const regex = /foo/g;
        for (;foo;) {
            regex.test(bar);
        }
        `,
        `
        const regex = /foo/g;
        for (const foo of bar) {
            regex.test(bar);
        }
        `,
        `
        const regex = /foo/g;
        for (const foo in bar) {
            regex.test(bar);
        }
        `,
        `
        const regex = /foo/g;
        do {
            regex.test(bar);
        } while (foo)
        `,
        `
        let c = 0
        for (const regex = /foo/g; c<=5; c++) {
            console.log(c, regex.test(''));
        }
        `,
        `
        const regex = /foo/g;
        unknown.search(regex)
        'str'.search(regex)
        `,
        `
        const regex = /foo/g;
        unknown(regex)
        'str'.search(regex)
        `,
        `
        const regex = /foo/g;
        regex.split(unknown)
        `,
        `
        const regex = /foo/g;
        unknown.exec(regex)
        `,
    ],
    invalid: [
        {
            code: `
            /* ✓ GOOD */
            const regex1 = /foo/g;
            const str = 'table football, foosball';
            while ((array = regex1.exec(str)) !== null) {
              //
            }
            
            const regex2 = /foo/g;
            regex2.test(string);
            regex2.test(string);
            
            str.replace(/foo/g, 'bar');
            str.replaceAll(/foo/g, 'bar');
            
            /* ✗ BAD */
            /foo/g.test(string);
            const regex3 = /foo/g;
            regex3.test(string); // You have used it only once.
            
            /foo/g.exec(string);
            const regex4 = /foo/g;
            regex4.exec(string); // You have used it only once.
            
            new RegExp('foo', 'g').test(string);
            
            str.search(/foo/g);
            `,
            errors: [
                {
                    message:
                        "'g' flag has been set, but not using global testing.",
                    line: 17,
                    column: 18,
                    endLine: 17,
                    endColumn: 19,
                },
                {
                    message:
                        "'g' flag has been set, but not using global testing.",
                    line: 18,
                    column: 33,
                    endLine: 18,
                    endColumn: 34,
                },
                {
                    message:
                        "'g' flag has been set, but not using global testing.",
                    line: 21,
                    column: 18,
                    endLine: 21,
                    endColumn: 19,
                },
                {
                    message:
                        "'g' flag has been set, but not using global testing.",
                    line: 22,
                    column: 33,
                    endLine: 22,
                    endColumn: 34,
                },
                {
                    message:
                        "'g' flag has been set, but not using global testing.",
                    line: 25,
                    column: 31,
                    endLine: 25,
                    endColumn: 34,
                },
                {
                    message:
                        "'g' flag has been set, but not using global testing.",
                    line: 27,
                    column: 29,
                    endLine: 27,
                    endColumn: 30,
                },
            ],
        },
        {
            code: `
            /foo/g.test(bar);
            `,
            errors: [
                {
                    message:
                        "'g' flag has been set, but not using global testing.",
                    line: 2,
                    column: 18,
                },
            ],
        },
        {
            code: `
            /foo/g.exec(bar);
            `,
            errors: [
                {
                    message:
                        "'g' flag has been set, but not using global testing.",
                    line: 2,
                    column: 18,
                },
            ],
        },
        {
            code: `
            new RegExp('foo', 'g').test(bar);
            `,
            errors: [
                {
                    message:
                        "'g' flag has been set, but not using global testing.",
                    line: 2,
                    column: 31,
                },
            ],
        },
        {
            code: `
            "foo foo".search(/foo/g);
            `,
            errors: [
                {
                    message:
                        "'g' flag has been set, but not using global testing.",
                    line: 2,
                    column: 35,
                },
            ],
        },
        {
            code: `
            const regex = /foo/g;
            regex.test(bar);
            `,
            errors: [
                {
                    message:
                        "'g' flag has been set, but not using global testing.",
                    line: 2,
                    column: 32,
                },
            ],
        },
        {
            code: `
            function fn () {
                const regex = /foo/g;
                return regex.test(bar);
            }
            `,
            errors: [
                {
                    message:
                        "'g' flag has been set, but not using global testing.",
                    line: 3,
                    column: 36,
                },
            ],
        },
        {
            code: `
            const a = /foo/g;
            const b = a;
            const regex = b;
             
            regex.test(bar);

            'str'.split(b)
            `,
            errors: [
                {
                    message:
                        "'g' flag has been set, but not using global testing.",
                    line: 2,
                    column: 28,
                },
            ],
        },
    ],
})
