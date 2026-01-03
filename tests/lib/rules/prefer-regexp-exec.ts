import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/prefer-regexp-exec.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
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
        `
        /thin[[g]]/v.exec('something');
        `,
    ],
    invalid: [
        `
            'something'.match(/thing/);

            'some things are just things'.match(/thing/);

            const text = 'something';
            const search = /thing/;
            text.match(search);
            `,
        `
            const fn = (a) => a + ''
            fn(1).match(search);
            `,
        `
            const v = a + b
            v.match(search);

            const n = 1 + 2
            n.match(search); // ignore
            `,
        `
            'something'.match(/thin[[g]]/v);
            `,
    ],
})
