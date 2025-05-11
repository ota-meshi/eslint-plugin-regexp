import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-dupe-characters-character-class"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-dupe-characters-character-class", rule as any, {
    valid: [
        String.raw`var re = /[a-zA-Z0-9\s]/`,
        "/[abc]/",
        "/[a][a][a]/",
        String.raw`/[0-9\D]/`,
        String.raw`/[\S \f\n\r\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/`,
        String.raw`/\s \f\n\r\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff/`,
        String.raw`/[\WA-Za-z0-9_]/`,
        String.raw`/[\w \/-:]/`,
        String.raw`/[\w\p{L}]/u`,
        String.raw`/\p{ASCII}abc/u`,
        String.raw`/[\u1fff-\u2020\s]/`,
        String.raw`/[\q{a}\q{ab}\q{abc}[\w--[ab]][\w&&b]]/v`,
        // error
        String.raw`var r = new RegExp('[\\wA-Za-z0-9_][invalid');`,
    ],
    invalid: [
        String.raw`var re = /[\\(\\)]/`,
        String.raw`var re = /[a-z\\s]/`,
        "/[aaa]/",
        String.raw`/[0-9\d]/`,
        String.raw`/[\f\u000C]/`,
        "RegExp(/[bb]/)",
        String.raw`/[\s \f\n\r\t\v\u00a0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/`,
        "/[\\t\t \\u0009]/",
        String.raw`/[\wA-Z a-z:0-9,_]/`,
        "/[!-z_abc-]/",
        String.raw`/[\w_abc-][\s \t\r\n\u2000\u3000]/`,
        "/[a-z a-z]/",
        "/[a-z A-Z]/i",
        "/[a-d e-h_d-e+c-d]/",
        "/[3-6 3-6_2-4+5-7]/",
        "/[3-6 3-6_5-7]/",
        String.raw`/[\s\s \s]/`,
        String.raw`/[\S\S \sa]/`,
        String.raw`/[\d 0-9_!-z]/`,
        String.raw`/[\W\W\w \d\d\D]/`,
        String.raw`/[\p{ASCII}\P{ASCII}\p{Script=Hiragana}\P{Script=Hiragana}\p{ASCII}\p{Script=Hiragana}]/u`,
        String.raw`/[\p{ASCII} abc\P{ASCII}]/u`,
        String.raw`/[\P{Script=Hiragana} abc\p{Script=Hiragana}]/u`,
        String.raw`/[\w /-7+8-:]/`,
        String.raw`/[ -/\s]/`,
        String.raw`/[\wA-_]/`,
        String.raw`/[\w0-z]/`,
        String.raw`/[\t-\uFFFF\s]/`,
        String.raw`/[\Sa]/`,
        String.raw`/[a-z\p{L}]/u`,
        String.raw`/[\d\p{ASCII}]/u`,
        String.raw`/[\t\s]/`,
        String.raw`/[A-Z a-\uFFFF]/i`,
        String.raw`/[\xA0-\uFFFF\s]/`,
        String.raw`/[\u1fff-\u2005\s]/`,
        {
            // GH issue: #189
            code: String(
                // eslint-disable-next-line no-control-regex -- x
                /[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]/i,
            ),
        },

        // sometimes, we might have to do some escaping
        String.raw`/[a^\w]/`,
        String.raw`/[0a-a-9a-z]/`,
        String.raw`/[a:^\w]/`,
        String.raw`/[\sa-\w]/`,
        String.raw`/[\x01\d-\x03\w]/`,
        // sometimes, we can't can't remove the element
        String.raw`/[\x01-\d\x03\w]/`,
        String.raw`/[\s0-\s9]/`,
        String.raw`/[\x0x9]/`,
        // v flags
        String.raw`/[\q{a}aa-c[\w--b][\w&&a]]/v`,
        String.raw`/[\q{abc}\q{abc|ab}[\q{abc}--b][\q{abc}&&\q{abc|ab}]]/v`,
    ],
})
