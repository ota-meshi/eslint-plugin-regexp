import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-invisible-character"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("no-invisible-character", rule as any, {
    valid: [
        "/a/",
        "/ /",
        "/[a]/",
        "/[ ]/",
        "/\\t/",
        "new RegExp('\\t')",
        `
        const a = '' + '\t';
        new RegExp(a)`,
    ],
    invalid: [
        {
            code: "/\u00a0/",
            output: "/\\xa0/",
            errors: ["Unexpected invisible character. Use '\\xa0' instead."],
        },
        {
            code: "/[\t]/",
            output: "/[\\t]/",
            errors: ["Unexpected invisible character. Use '\\t' instead."],
        },
        {
            code:
                "/[\t\u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\ufeff\u0085\u200b]/",
            output:
                "/[\\t\xa0\\u1680\u180e\\u2000\u2001\\u2002\u2003\\u2004\u2005\\u2006\u2007\\u2008\u2009\\u200a\u202f\\u205f\u3000\\ufeff\x85\\u200b]/",
            errors: [
                "Unexpected invisible character. Use '\\t' instead.",
                "Unexpected invisible character. Use '\\xa0' instead.",
                "Unexpected invisible character. Use '\\u1680' instead.",
                "Unexpected invisible character. Use '\\u180e' instead.",
                "Unexpected invisible character. Use '\\u2000' instead.",
                "Unexpected invisible character. Use '\\u2001' instead.",
                "Unexpected invisible character. Use '\\u2002' instead.",
                "Unexpected invisible character. Use '\\u2003' instead.",
                "Unexpected invisible character. Use '\\u2004' instead.",
                "Unexpected invisible character. Use '\\u2005' instead.",
                "Unexpected invisible character. Use '\\u2006' instead.",
                "Unexpected invisible character. Use '\\u2007' instead.",
                "Unexpected invisible character. Use '\\u2008' instead.",
                "Unexpected invisible character. Use '\\u2009' instead.",
                "Unexpected invisible character. Use '\\u200a' instead.",
                "Unexpected invisible character. Use '\\u202f' instead.",
                "Unexpected invisible character. Use '\\u205f' instead.",
                "Unexpected invisible character. Use '\\u3000' instead.",
                "Unexpected invisible character. Use '\\ufeff' instead.",
                "Unexpected invisible character. Use '\\x85' instead.",
                "Unexpected invisible character. Use '\\u200b' instead.",
            ],
        },
        {
            code:
                "/[\\t\u00a0\\u1680\u180e\\u2000\u2001\\u2002\u2003\\u2004\u2005\\u2006\u2007\\u2008\u2009\\u200a\u202f\\u205f\u3000\\ufeff\u0085\\u200b]/",
            output:
                "/[\\t\\xa0\\u1680\\u180e\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200a\\u202f\\u205f\\u3000\\ufeff\\x85\\u200b]/",
            errors: [
                "Unexpected invisible character. Use '\\xa0' instead.",
                "Unexpected invisible character. Use '\\u180e' instead.",
                "Unexpected invisible character. Use '\\u2001' instead.",
                "Unexpected invisible character. Use '\\u2003' instead.",
                "Unexpected invisible character. Use '\\u2005' instead.",
                "Unexpected invisible character. Use '\\u2007' instead.",
                "Unexpected invisible character. Use '\\u2009' instead.",
                "Unexpected invisible character. Use '\\u202f' instead.",
                "Unexpected invisible character. Use '\\u3000' instead.",
                "Unexpected invisible character. Use '\\x85' instead.",
            ],
        },
        {
            code:
                "new RegExp('\t\u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\ufeff\u0085\u200b')",
            output:
                "new RegExp('\\t\xa0\\u1680\u180e\\u2000\u2001\\u2002\u2003\\u2004\u2005\\u2006\u2007\\u2008\u2009\\u200a\u202f\\u205f\u3000\\ufeff\x85\\u200b')",
            errors: [
                "Unexpected invisible character. Use '\\t' instead.",
                "Unexpected invisible character. Use '\\xa0' instead.",
                "Unexpected invisible character. Use '\\u1680' instead.",
                "Unexpected invisible character. Use '\\u180e' instead.",
                "Unexpected invisible character. Use '\\u2000' instead.",
                "Unexpected invisible character. Use '\\u2001' instead.",
                "Unexpected invisible character. Use '\\u2002' instead.",
                "Unexpected invisible character. Use '\\u2003' instead.",
                "Unexpected invisible character. Use '\\u2004' instead.",
                "Unexpected invisible character. Use '\\u2005' instead.",
                "Unexpected invisible character. Use '\\u2006' instead.",
                "Unexpected invisible character. Use '\\u2007' instead.",
                "Unexpected invisible character. Use '\\u2008' instead.",
                "Unexpected invisible character. Use '\\u2009' instead.",
                "Unexpected invisible character. Use '\\u200a' instead.",
                "Unexpected invisible character. Use '\\u202f' instead.",
                "Unexpected invisible character. Use '\\u205f' instead.",
                "Unexpected invisible character. Use '\\u3000' instead.",
                "Unexpected invisible character. Use '\\ufeff' instead.",
                "Unexpected invisible character. Use '\\x85' instead.",
                "Unexpected invisible character. Use '\\u200b' instead.",
            ],
        },
    ],
})
