import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-invisible-character.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-invisible-character", rule as any, {
    valid: [
        "/a/",
        "/ /",
        "/[a]/",
        "/[ ]/",
        String.raw`/\t/`,
        String.raw`new RegExp('\t')`,
        `
        const a = '' + '\t';
        new RegExp(a)`,
        "new RegExp(' ')",
        "new RegExp('a')",
        "new RegExp('[ ]')",
        String.raw`/[\q{\t}]/v`,
    ],
    invalid: [
        "/\u00a0/",
        "/[\t]/",
        "/[\t\u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\ufeff\u0085\u200b]/",
        "/[\\t\u00a0\\u1680\u180e\\u2000\u2001\\u2002\u2003\\u2004\u2005\\u2006\u2007\\u2008\u2009\\u200a\u202f\\u205f\u3000\\ufeff\u0085\\u200b]/",
        "new RegExp('\t\u00a0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\ufeff\u0085\u200b')",
        `/[\\q{\t}]/v`,
    ],
})
