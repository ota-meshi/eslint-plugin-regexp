import { RuleTester } from "eslint"
import rule from "../../../lib/rules/prefer-regexp-exec"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("prefer-regexp-exec", rule as any, {
    valid: [
        `
        /thing/.exec('something');
        
        'some things are just things'.match(/thing/g);
        
        const text = 'something';
        const search = /thing/;
        search.exec(text);
        `,
    ],
    invalid: [
        {
            code: `
            'something'.match(/thing/);
            
            'some things are just things'.match(/thing/);
            
            const text = 'something';
            const search = /thing/;
            text.match(search);
            `,
            errors: [
                {
                    message: "Use the `RegExp#exec()` method instead.",
                    line: 2,
                    column: 13,
                },
                {
                    message: "Use the `RegExp#exec()` method instead.",
                    line: 4,
                    column: 13,
                },
                {
                    message: "Use the `RegExp#exec()` method instead.",
                    line: 8,
                    column: 13,
                },
            ],
        },
        {
            code: `
            const fn = (a) => a + ''
            fn(1).match(search);
            `,
            errors: ["Use the `RegExp#exec()` method instead."],
        },
        {
            code: `
            const v = a + b
            v.match(search);

            const n = 1 + 2
            n.match(search); // ignore
            `,
            errors: [
                {
                    message: "Use the `RegExp#exec()` method instead.",
                    line: 3,
                    column: 13,
                },
            ],
        },
    ],
})
