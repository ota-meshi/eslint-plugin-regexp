import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/prefer-regexp-test"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
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
        const pattern = /thin[[g]]/v;
        if (pattern.test(text)) {}
        `,
    ],
    invalid: [
        `
            const text = 'something';
            const pattern = /thing/;
            if (pattern.exec(text)) {}
            if (text.match(pattern)) {}
            `,
        `
            const text = 'something';
            const pattern = ()=>/thing/;
            if (pattern().exec(text)) {}
            if (text.match(pattern())) {}
            `,
        `
            const text = 'something';
            const pattern = /thing/;
            const b1 = Boolean(pattern.exec(text))
            const b2 = Boolean(text.match(pattern))
            const b3 = !pattern.exec(text)
            const b4 = !text.match(pattern)
            const b5 = !(foo && pattern.exec(text))
            const b6 = !(foo || text.match(pattern))
            `,
        `
            const re = /a/g;
            const str = 'abc';

            console.log(!!str.match(re)); // ignore
            console.log(!!str.match(re)); // ignore
            console.log(!!re.exec(str));
            console.log(!!re.exec(str));
            console.log(re.test(str));
            console.log(re.test(str));
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
        `
            const text = 'something';
            /** @type {RegExp} */
            const pattern = getPattern();
            if (text.match(pattern)) {}
            `,
        `
            const text = 'something';
            const pattern = /thin[[g]]/v;
            if (pattern.exec(text)) {}
            if (text.match(pattern)) {}
            `,
    ],
})
