import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-useless-dollar-replacements"

const tester = new RuleTester({
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
        String.raw`
        'abc'.foo(/./, '$1');
        `,
        String.raw`
        'abc'.replace(/./);
        `,
        String.raw`
        const s = '$1'
        'abc'.replace(/./, s);
        `,
        String.raw`
        const r = /./
        'abc'.replace(...r, '$1');
        `,
        String.raw`
        str.replace(/./, '$1');
        `,
        String.raw`
        'abc'.replaceAll('a', '$1');
        `,
        String.raw`
        const str = '0123456789_';
        str.replace(/(0)(1)(2)(3)(4)(5)(6)(7)(8)(9)(_)/, '_$11_'); // "___"
        `,
        String.raw`
        const str = '0123456789_';
        str.replace(/(0)(1)(2)(3)(4)(5)(6)(7)(8)(9)(_)/, '_$12_'); // "_02_"
        `,
        String.raw`
        "abc".replaceAll(/./g, '$'); // "$$$"
        `,
        String.raw`
        "abc".replaceAll(/./g, '$_'); // "$_$_$_"
        `,
        String.raw`
        "abc".replaceAll(/./g, '$0'); // "$0$0$0"
        `,
        String.raw`
        "abc".replaceAll(/./g, '$0_'); // "$0_$0_$0_"
        `,
        String.raw`
        "abc".replaceAll(/()()(()())()()((.))/g, '$9'); // "abc"
        `,
        String.raw`
        "abc".replaceAll(/()()(()())()()((.))/g, '$09'); // "abc"
        `,
        String.raw`
        "abc".replaceAll(/(.)/g, '$<'); // "$<$<$<"
        `,
        String.raw`
        "abc".replaceAll(/(.)/g, '$<foo'); // "$<foo$<foo$<foo"
        `,
        String.raw`
        var regexp = /./g
        regexp = 'a'
        "abc".replaceAll(regexp, '$1');
        `,
        String.raw`
        const regexp = 'a'
        "abc".replaceAll(regexp, '$1');
        `,
        String.raw`
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
        {
            code: String.raw`
            const str = 'John Smith';

            /* ✗ BAD */
            var newStr = str.replace(/(\w+)\s(\w+)/, '$3, $1 $2');
            // newStr = '$3, John Smith'
            var newStr = str.replace(/(?<first>\w+)\s(?<last>\w+)/, '$<last>, $<first> $<middle>');
            // newStr = 'Smith, John '
            `,
            errors: [
                {
                    message:
                        "'$3' replacement will insert '$3' because there are less than 3 capturing groups. Use '$$' if you want to escape '$'.",
                    line: 5,
                    column: 55,
                    endLine: 5,
                    endColumn: 57,
                },
                {
                    message:
                        "'$<middle>' replacement will be ignored because the named capturing group is not found. Use '$$' if you want to escape '$'.",
                    line: 7,
                    column: 88,
                    endLine: 7,
                    endColumn: 97,
                },
            ],
        },
        {
            code: String.raw`
            const str = 'John Smith';
            var newStr = str.replace(/(\w+)\s(\w+)/, '$03, $01 $02');
            `,
            errors: [
                {
                    message:
                        "'$03' replacement will insert '$03' because there are less than 3 capturing groups. Use '$$' if you want to escape '$'.",
                    line: 3,
                    column: 55,
                    endLine: 3,
                    endColumn: 58,
                },
            ],
        },
        {
            code: String.raw`
            "abc".replaceAll(/()()(()())()()(.)/g, '$9'); // "$9$9$9"
            `,
            errors: [
                "'$9' replacement will insert '$9' because there are less than 9 capturing groups. Use '$$' if you want to escape '$'.",
            ],
        },
        {
            code: String.raw`
            "abc".replaceAll(/()()(()())()()(.)/g, '$09'); // "$09$09$09"
            `,
            errors: [
                "'$09' replacement will insert '$09' because there are less than 9 capturing groups. Use '$$' if you want to escape '$'.",
            ],
        },
        {
            code: String.raw`
            const regexp = /./g
            "abc".replaceAll(regexp, '$1');
            `,
            errors: [
                "'$1' replacement will insert '$1' because capturing group does not found. Use '$$' if you want to escape '$'.",
            ],
        },
        {
            code: String.raw`
            "abc".replaceAll(/(.)/g, '$<a>');
            `,
            errors: [
                "'$<a>' replacement will insert '$<a>' because named capturing group does not found. Use '$$' if you want to escape '$'.",
            ],
        },
        {
            code: String.raw`
            const str = 'John Smith';
            var newStr = str.replace(/([[\w]]+)[\s](\w+)/v, '$3, $1 $2');
            `,
            errors: [
                {
                    message:
                        "'$3' replacement will insert '$3' because there are less than 3 capturing groups. Use '$$' if you want to escape '$'.",
                    line: 3,
                    column: 62,
                },
            ],
        },
    ],
})
