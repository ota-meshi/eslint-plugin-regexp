import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/no-useless-character-class.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-useless-character-class", rule as any, {
    valid: [
        `/regexp/`,
        `/[^a]/`,
        String.raw`/[^\d]/`,
        String.raw`/[\s\S]/`,
        `/[a-z]/`,
        `/[=]/ // ignore`,
        {
            code: `/[a]/`,
            options: [{ ignores: ["a"] }],
        },
        {
            code: String.raw`/[\d]/`,
            options: [{ ignores: [String.raw`\d`] }],
        },
        {
            code: String.raw`/[\u0061]/`,
            options: [{ ignores: ["a"] }],
        },
        String.raw`/[\b]/ // backspace`,
        String.raw`/(,)[\1]/ // back reference escape`,
        String.raw`/(,)(,)(,)(,)(,) (,)(,)(,)(,)(,) (,)[\7]/ // back reference escape`,
        String.raw`/(,)(,)(,)(,)(,) (,)(,)(,)(,)(,) (,)[\11]/ // back reference escape`,
        String.raw`/\0/`,
        String.raw`/\1[0]/`,
        String.raw`/\0[1]/`,
        String.raw`/a{[0]}/`,
        String.raw`/a{123[0]}/`,
        String.raw`/\xF[F]/`,
        String.raw`/\xf[f]/`,
        String.raw`/\x4[4]/`,
        String.raw`/\uF[F]FF/`,
        String.raw`/\uf[f]ff/`,
        String.raw`/\u4[4]44/`,
        String.raw`/\c[M]/`,
        String.raw`/\c[A]/`,
        String.raw`/\c[Z]/`,
        String.raw`/\c[m]/`,
        String.raw`/[\q{abc}]/v`,
    ],
    invalid: [
        `/[a]/`,
        `/[a-a]/`,
        String.raw`/[\d]/`,
        {
            code: `/[=]/`,
            options: [{ ignores: [] }],
        },
        {
            code: String.raw`/[\D]/`,
            options: [{ ignores: [String.raw`\d`] }],
        },
        String.raw`/(,)[\0]/`,
        String.raw`/(,)[\01]/`,
        {
            code: String.raw`/[.] [*] [+] [?] [\^] [=] [!] [:] [$] [{] [}] [(] [)] [|] [[] [\]] [/] [\\]/`,
            options: [{ ignores: [] }],
        },
        {
            code: String.raw`/[.] [*] [+] [?] [\^] [=] [!] [:] [$] [{] [}] [(] [)] [|] [[] [\]] [/] [\\]/u`,
            options: [{ ignores: [] }],
        },
        {
            code: String.raw`/[.] [*] [+] [?] [\^] [=] [!] [:] [$] [\{] [\}] [\(] [\)] [\|] [\[] [\]] [\/] [\\]/v`,
            options: [{ ignores: [] }],
        },
        {
            code: String.raw`/[.-.]/u`,
            options: [{ ignores: [] }],
        },
        {
            code: String.raw`new RegExp("[.] [*] [+] [?] [\\^] [=] [!] [:] [$] [{] [}] [(] [)] [|] [[] [\\]] [/] [\\\\]", "u")`,
            options: [{ ignores: [] }],
        },
        {
            code: String.raw`new RegExp("[.] [*] [+] [?] [\\^] [=] [!] [:]" + " [$] [{] [}] [(] [)] [|] [[] [\\]] [/] [\\\\]")`,
            options: [{ ignores: [] }],
        },
        {
            code: String.raw`RegExp("[\"]" + '[\']')`,
            options: [{ ignores: [] }],
        },
        {
            code: String.raw`/[ [.] [*] [+] [?] [\^] [=] [!] [:] [$] [\{] [\}] [\(] [\)] [\|] [\[] [\]] [\/] [\\] ]/v`,
            options: [{ ignores: [] }],
        },
        String.raw`/[[\^]A]/v`,
        String.raw`/[[A]--[B]]/v`,
        String.raw`/[A[&]&B]/v; /[A&&[&]]/v`,
        String.raw`/[A[&-&]&B]/v`,
        String.raw`/[[&]&&[&]]/v`,
        String.raw`/[[abc]]/v`,
        String.raw`/[[A&&B]]/v`,
        String.raw`/[[\q{abc}]]/v`,
        String.raw`/[[^\w&&\d]]/v`,
        String.raw`/[^[abc]]/v`,
        String.raw`/[^[abc]d]/v`,
        String.raw`/[[abc][def]ghi]/v`,
        String.raw`/[abc[def]ghi]/v`,
        String.raw`/[[abc&]&[&bd]]/v`,
        String.raw`/[[abc!-&]&[&-1bd]]/v`,
        // We don't need to do anything with auto-fix escaping because the original pattern will cause a parsing error.
        // {
        //     code: String.raw`/[a[-b]]/v`,
        //     output: String.raw`/[a\-b]/v`,
        //     errors: 1,
        // },
        String.raw`/[[]^]/v`,
        String.raw`/[&[]&]/v`,
    ],
})
