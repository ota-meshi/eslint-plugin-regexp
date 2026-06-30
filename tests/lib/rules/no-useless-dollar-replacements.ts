import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-useless-dollar-replacements.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-useless-dollar-replacements", rule as any, {
    valid: [
        String.raw`
        const str = 'John Smith';

        /* ✓ GOOD */
        var newStr = str.replace(/(\w+)\s(\w+)/, '$2, $1');
        // newStr = 'Smith, John'
        var newStr = str.replace(/(?<first>\w+)\s(?<last>\w+)/, '$<last>, $<first>');
        // newStr = 'Smith, John'
        `,
        String.raw`
        const str = 'John Smith';

        var newStr = str.replace(/(\w+)\s(\w+)/, '$$3, $1 $2');
        var newStr = str.replace(/(?<first>\w+)\s(?<last>\w+)/, '$<last>, $<first> $$<middle>');
        `,
        `
        'abc'.foo(/./, '$1');
        `,
        `
        'abc'.replace(/./);
        `,
        `
        const s = '$1'
        'abc'.replace(/./, s);
        `,
        `
        const r = /./
        'abc'.replace(...r, '$1');
        `,
        `
        str.replace(/./, '$1');
        `,
        `
        'abc'.replaceAll('a', '$1');
        `,
        `
        const str = '0123456789_';
        str.replace(/(0)(1)(2)(3)(4)(5)(6)(7)(8)(9)(_)/, '_$11_'); // "___"
        `,
        `
        const str = '0123456789_';
        str.replace(/(0)(1)(2)(3)(4)(5)(6)(7)(8)(9)(_)/, '_$12_'); // "_02_"
        `,
        `
        "abc".replaceAll(/./g, '$'); // "$$$"
        `,
        `
        "abc".replaceAll(/./g, '$_'); // "$_$_$_"
        `,
        `
        "abc".replaceAll(/./g, '$0'); // "$0$0$0"
        `,
        `
        "abc".replaceAll(/./g, '$0_'); // "$0_$0_$0_"
        `,
        `
        "abc".replaceAll(/()()(()())()()((.))/g, '$9'); // "abc"
        `,
        `
        "abc".replaceAll(/()()(()())()()((.))/g, '$09'); // "abc"
        `,
        `
        "abc".replaceAll(/(.)/g, '$<'); // "$<$<$<"
        `,
        `
        "abc".replaceAll(/(.)/g, '$<foo'); // "$<foo$<foo$<foo"
        `,
        `
        var regexp = /./g
        regexp = 'a'
        "abc".replaceAll(regexp, '$1');
        `,
        `
        const regexp = 'a'
        "abc".replaceAll(regexp, '$1');
        `,
        `
        const regexp = /(.)/g
        regexp = 'a'
        "abc".replaceAll(regexp, 'foo');
        `,
        String.raw`
        const str = 'John Smith';
        var newStr = str.replace(/(\w+)\s(\w+)/v, '$2, $1');
        `,
    ],
    invalid: [
        String.raw`
            const str = 'John Smith';

            /* ✗ BAD */
            var newStr = str.replace(/(\w+)\s(\w+)/, '$3, $1 $2');
            // newStr = '$3, John Smith'
            var newStr = str.replace(/(?<first>\w+)\s(?<last>\w+)/, '$<last>, $<first> $<middle>');
            // newStr = 'Smith, John '
            `,
        String.raw`
            const str = 'John Smith';
            var newStr = str.replace(/(\w+)\s(\w+)/, '$03, $01 $02');
            `,
        `
            "abc".replaceAll(/()()(()())()()(.)/g, '$9'); // "$9$9$9"
            `,
        `
            "abc".replaceAll(/()()(()())()()(.)/g, '$09'); // "$09$09$09"
            `,
        `
            const regexp = /./g
            "abc".replaceAll(regexp, '$1');
            `,
        `
            "abc".replaceAll(/(.)/g, '$<a>');
            `,
        String.raw`
            const str = 'John Smith';
            var newStr = str.replace(/([[\w]]+)[\s](\w+)/v, '$3, $1 $2');
            `,
    ],
})
