import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-useless-flag"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-useless-flag", rule as any, {
    valid: [
        // i
        `/foo/i`,
        `/BAR/i`,
        `/\\w\\W/iu`,
        `/\\p{Lu}/i`,
        `/\u212A/iu`,
        `/\\b/iu`,
        String.raw`/\x41/i`,
        `/[a-zA-Z]/i`, // in that case you should use the i flag instead of removing it

        // m
        `/^foo/m`,
        `/foo$/m`,
        `/^foo$/m`,

        // s
        `/./s`,

        // g
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

        // ignore
        { code: String.raw`/\w/i`, options: [{ ignore: ["i"] }] },
        { code: String.raw`/\w/m`, options: [{ ignore: ["m"] }] },
        { code: String.raw`/\w/s`, options: [{ ignore: ["s"] }] },
        { code: `/foo/g.test(string)`, options: [{ ignore: ["g"] }] },
    ],
    invalid: [
        // i
        {
            code: String.raw`/\w \W \s \S \d \D . \b/i`,
            output: String.raw`/\w \W \s \S \d \D . \b/`,
            errors: [
                {
                    message:
                        "The 'i' flags is unnecessary because the pattern does not contain case-variant characters.",
                },
            ],
        },
        {
            code: `/\u212A/i`,
            output: `/\u212A/`,
            errors: [
                {
                    message:
                        "The 'i' flags is unnecessary because the pattern does not contain case-variant characters.",
                },
            ],
        },

        // m
        {
            code: String.raw`/\w/m`,
            output: String.raw`/\w/`,
            errors: [
                {
                    message:
                        "The 'm' flags is unnecessary because the pattern does not contain start (^) or end ($) assertions.",
                },
            ],
        },

        // s
        {
            code: String.raw`/\w/s`,
            output: String.raw`/\w/`,
            errors: [
                {
                    message:
                        "The 's' flags is unnecessary because the pattern does not contain dots (.).",
                },
            ],
        },

        // i & m & s
        {
            code: String.raw`/\w/ims`,
            output: String.raw`/\w/m`,
            errors: [
                {
                    message:
                        "The 'i' flags is unnecessary because the pattern does not contain case-variant characters.",
                    line: 1,
                    column: 5,
                },
                {
                    message:
                        "The 'm' flags is unnecessary because the pattern does not contain start (^) or end ($) assertions.",
                    line: 1,
                    column: 6,
                },
                {
                    message:
                        "The 's' flags is unnecessary because the pattern does not contain dots (.).",
                    line: 1,
                    column: 7,
                },
            ],
        },
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
            output: null,
            errors: [
                {
                    message:
                        "The 'g' flags is unnecessary because not using global testing.",
                    line: 17,
                    column: 18,
                    endLine: 17,
                    endColumn: 19,
                },
                {
                    message:
                        "The 'g' flags is unnecessary because not using global testing.",
                    line: 18,
                    column: 33,
                    endLine: 18,
                    endColumn: 34,
                },
                {
                    message:
                        "The 'g' flags is unnecessary because not using global testing.",
                    line: 21,
                    column: 18,
                    endLine: 21,
                    endColumn: 19,
                },
                {
                    message:
                        "The 'g' flags is unnecessary because not using global testing.",
                    line: 22,
                    column: 33,
                    endLine: 22,
                    endColumn: 34,
                },
                {
                    message:
                        "The 'g' flags is unnecessary because not using global testing.",
                    line: 25,
                    column: 31,
                    endLine: 25,
                    endColumn: 34,
                },
                {
                    message:
                        "The 'g' flags is unnecessary because not using global testing.",
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
            output: null,
            errors: [
                {
                    message:
                        "The 'g' flags is unnecessary because not using global testing.",
                    line: 2,
                    column: 18,
                },
            ],
        },
        {
            code: `
            /foo/g.exec(bar);
            `,
            output: null,
            errors: [
                {
                    message:
                        "The 'g' flags is unnecessary because not using global testing.",
                    line: 2,
                    column: 18,
                },
            ],
        },
        {
            code: `
            new RegExp('foo', 'g').test(bar);
            `,
            output: null,
            errors: [
                {
                    message:
                        "The 'g' flags is unnecessary because not using global testing.",
                    line: 2,
                    column: 31,
                },
            ],
        },
        {
            code: `
            "foo foo".search(/foo/g);
            `,
            output: null,
            errors: [
                {
                    message:
                        "The 'g' flags is unnecessary because not using global testing.",
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
            output: null,
            errors: [
                {
                    message:
                        "The 'g' flags is unnecessary because not using global testing.",
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
            output: null,
            errors: [
                {
                    message:
                        "The 'g' flags is unnecessary because not using global testing.",
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
            output: null,
            errors: [
                {
                    message:
                        "The 'g' flags is unnecessary because not using global testing.",
                    line: 2,
                    column: 28,
                },
            ],
        },
    ],
})
