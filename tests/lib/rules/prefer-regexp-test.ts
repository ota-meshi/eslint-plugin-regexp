import { RuleTester } from "eslint"
import rule from "../../../lib/rules/prefer-regexp-test"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("prefer-regexp-test", rule as any, {
    valid: [
        `
        const text = 'something';
        const pattern = /thing/;
        if (pattern.test(text)) {}
        `,
        `
        const text = 'something';
        const pattern = /thing/;
        if (text.exec(pattern)) {}
        if (pattern.match(text)) {}
        `,
        `
        const text = 'something';
        const pattern = /thing/;
        if (pattern.execA(text)) {}
        if (text.matchA(pattern)) {}
        `,
        `
        const text = 'something';
        const pattern = /thing/;
        const a = pattern.exec(text)
        const b = text.match(pattern)
        `,
        `
        const text = 'something';
        if (text.match()) {}
        const pattern1 = 'some';
        if (text.match(pattern1)) {}
        const pattern2 = Infinity;
        if (text.match(pattern2)) {}
        `,
        `
        const text = 'something';
        const pattern = getPattern();
        if (text.match(pattern)) {}
        `,
    ],
    invalid: [
        {
            code: `
            const text = 'something';
            const pattern = /thing/;
            if (pattern.exec(text)) {}
            if (text.match(pattern)) {}
            `,
            output: `
            const text = 'something';
            const pattern = /thing/;
            if (pattern.test(text)) {}
            if (pattern.test(text)) {}
            `,
            errors: [
                {
                    message:
                        "Use the `RegExp#test()` method instead of `RegExp#exec`, if you need a boolean.",
                    line: 4,
                    column: 25,
                    endLine: 4,
                    endColumn: 29,
                },
                {
                    message:
                        "Use the `RegExp#test()` method instead of `String#match`, if you need a boolean.",
                    line: 5,
                    column: 17,
                    endLine: 5,
                    endColumn: 36,
                },
            ],
        },
        {
            code: `
            const text = 'something';
            const pattern = ()=>/thing/;
            if (pattern().exec(text)) {}
            if (text.match(pattern())) {}
            `,
            output: `
            const text = 'something';
            const pattern = ()=>/thing/;
            if (pattern().test(text)) {}
            if (text.match(pattern())) {}
            `,
            errors: [
                "Use the `RegExp#test()` method instead of `RegExp#exec`, if you need a boolean.",
                "Use the `RegExp#test()` method instead of `String#match`, if you need a boolean.",
            ],
        },
        {
            code: `
            const text = 'something';
            const pattern = /thing/;
            const b1 = Boolean(pattern.exec(text))
            const b2 = Boolean(text.match(pattern))
            const b3 = !pattern.exec(text)
            const b4 = !text.match(pattern)
            const b5 = !(foo && pattern.exec(text))
            const b6 = !(foo || text.match(pattern))
            `,
            output: `
            const text = 'something';
            const pattern = /thing/;
            const b1 = Boolean(pattern.test(text))
            const b2 = Boolean(pattern.test(text))
            const b3 = !pattern.test(text)
            const b4 = !pattern.test(text)
            const b5 = !(foo && pattern.test(text))
            const b6 = !(foo || pattern.test(text))
            `,
            errors: [
                "Use the `RegExp#test()` method instead of `RegExp#exec`, if you need a boolean.",
                "Use the `RegExp#test()` method instead of `String#match`, if you need a boolean.",
                "Use the `RegExp#test()` method instead of `RegExp#exec`, if you need a boolean.",
                "Use the `RegExp#test()` method instead of `String#match`, if you need a boolean.",
                "Use the `RegExp#test()` method instead of `RegExp#exec`, if you need a boolean.",
                "Use the `RegExp#test()` method instead of `String#match`, if you need a boolean.",
            ],
        },
        {
            code: `
            const re = /a/g;
            const str = 'abc';
            
            console.log(!!str.match(re)); // ignore
            console.log(!!str.match(re)); // ignore
            console.log(!!re.exec(str));
            console.log(!!re.exec(str));
            console.log(re.test(str));
            console.log(re.test(str));
            `,
            output: `
            const re = /a/g;
            const str = 'abc';
            
            console.log(!!str.match(re)); // ignore
            console.log(!!str.match(re)); // ignore
            console.log(!!re.test(str));
            console.log(!!re.test(str));
            console.log(re.test(str));
            console.log(re.test(str));
            `,
            errors: [
                "Use the `RegExp#test()` method instead of `RegExp#exec`, if you need a boolean.",
                "Use the `RegExp#test()` method instead of `RegExp#exec`, if you need a boolean.",
            ],
        },
        {
            code: `
            const text = 'something';
            /** @type {RegExp} */
            const pattern = getPattern();
            if (text.match(pattern)) {}
            `,
            output: `
            const text = 'something';
            /** @type {RegExp} */
            const pattern = getPattern();
            if (pattern.test(text)) {}
            `,
            errors: [
                "Use the `RegExp#test()` method instead of `String#match`, if you need a boolean.",
            ],
        },
    ],
})
