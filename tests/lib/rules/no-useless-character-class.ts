import { RuleTester } from "eslint"
import rule from "../../../lib/rules/no-useless-character-class"

const tester = new RuleTester({
    parserOptions: {
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
            options: [{ ignores: ["\\d"] }],
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
        `/\\xF[F]/`,
        `/\\xf[f]/`,
        `/\\x4[4]/`,
        `/\\uF[F]FF/`,
        `/\\uf[f]ff/`,
        `/\\u4[4]44/`,
        String.raw`/\c[M]/`,
        String.raw`/\c[A]/`,
        String.raw`/\c[Z]/`,
        String.raw`/\c[m]/`,
        String.raw`/[\q{abc}]/v`,
    ],
    invalid: [
        {
            code: `/[a]/`,
            output: `/a/`,
            errors: [
                {
                    message:
                        "Unexpected character class with one character. Can remove brackets.",
                    line: 1,
                    column: 2,
                },
            ],
        },
        {
            code: `/[a-a]/`,
            output: `/a/`,
            errors: [
                {
                    message:
                        "Unexpected character class with one character class range. Can remove brackets and range.",
                    line: 1,
                    column: 2,
                },
            ],
        },
        {
            code: String.raw`/[\d]/`,
            output: String.raw`/\d/`,
            errors: [
                {
                    message:
                        "Unexpected character class with one character class escape. Can remove brackets.",
                    line: 1,
                    column: 2,
                },
            ],
        },
        {
            code: `/[=]/`,
            output: `/=/`,
            options: [{ ignores: [] }],
            errors: [
                "Unexpected character class with one character. Can remove brackets.",
            ],
        },
        {
            code: String.raw`/[\D]/`,
            output: String.raw`/\D/`,
            options: [{ ignores: ["\\d"] }],
            errors: [
                "Unexpected character class with one character class escape. Can remove brackets.",
            ],
        },
        {
            code: String.raw`/(,)[\0]/`,
            output: String.raw`/(,)\0/`,
            errors: [
                "Unexpected character class with one character. Can remove brackets.",
            ],
        },
        {
            code: String.raw`/(,)[\01]/`,
            output: String.raw`/(,)\01/`,
            errors: [
                "Unexpected character class with one character. Can remove brackets.",
            ],
        },
        {
            code: String.raw`/[.] [*] [+] [?] [\^] [=] [!] [:] [$] [{] [}] [(] [)] [|] [[] [\]] [/] [\\]/`,
            output: String.raw`/\. \* \+ \? \^ = ! : \$ \{ } \( \) \| \[ \] \/ \\/`,
            options: [{ ignores: [] }],
            errors: 18,
        },
        {
            code: String.raw`/[.] [*] [+] [?] [\^] [=] [!] [:] [$] [{] [}] [(] [)] [|] [[] [\]] [/] [\\]/u`,
            output: String.raw`/\. \* \+ \? \^ = ! : \$ \{ \} \( \) \| \[ \] \/ \\/u`,
            options: [{ ignores: [] }],
            errors: 18,
        },
        {
            code: String.raw`/[.] [*] [+] [?] [\^] [=] [!] [:] [$] [\{] [\}] [\(] [\)] [\|] [\[] [\]] [\/] [\\]/v`,
            output: String.raw`/\. \* \+ \? \^ = ! : \$ \{ \} \( \) \| \[ \] \/ \\/v`,
            options: [{ ignores: [] }],
            errors: 18,
        },
        {
            code: String.raw`/[.-.]/u`,
            output: String.raw`/\./u`,
            options: [{ ignores: [] }],
            errors: 1,
        },
        {
            code: String.raw`new RegExp("[.] [*] [+] [?] [\\^] [=] [!] [:] [$] [{] [}] [(] [)] [|] [[] [\\]] [/] [\\\\]", "u")`,
            output: String.raw`new RegExp("\\. \\* \\+ \\? \\^ = ! : \\$ \\{ \\} \\( \\) \\| \\[ \\] \\/ \\\\", "u")`,
            options: [{ ignores: [] }],
            errors: 18,
        },
        {
            code: String.raw`new RegExp("[.] [*] [+] [?] [\\^] [=] [!] [:]" + " [$] [{] [}] [(] [)] [|] [[] [\\]] [/] [\\\\]")`,
            output: String.raw`new RegExp("\\. \\* \\+ \\? \\^ = ! :" + " \\$ \\{ } \\( \\) \\| \\[ \\] \\/ \\\\")`,
            options: [{ ignores: [] }],
            errors: 18,
        },
        {
            code: String.raw`RegExp("[\"]" + '[\']')`,
            output: String.raw`RegExp("\"" + '\'')`,
            options: [{ ignores: [] }],
            errors: 2,
        },
        {
            code: String.raw`/[ [.] [*] [+] [?] [\^] [=] [!] [:] [$] [\{] [\}] [\(] [\)] [\|] [\[] [\]] [\/] [\\] ]/v`,
            output: String.raw`/[ . * + ? \^ = ! : $ \{ \} \( \) \| \[ \] \/ \\ ]/v`,
            options: [{ ignores: [] }],
            errors: 18,
        },
        {
            code: String.raw`/[[\^]A]/v`,
            output: String.raw`/[\^A]/v`,
            errors: 1,
        },
        {
            code: String.raw`/[[A]--[B]]/v`,
            output: String.raw`/[A--B]/v`,
            errors: 2,
        },
        {
            code: String.raw`/[A[&]&B]/v; /[A&&[&]]/v`,
            output: String.raw`/[A\&&B]/v; /[A&&\&]/v`,
            errors: 2,
        },
        {
            code: String.raw`/[A[&-&]&B]/v`,
            output: String.raw`/[A\&&B]/v`,
            errors: 1,
        },
        {
            code: String.raw`/[[&]&&[&]]/v`,
            output: String.raw`/[\&&&\&]/v`,
            errors: 2,
        },
        {
            code: String.raw`/[[abc]]/v`,
            output: String.raw`/[abc]/v`,
            errors: 1,
        },
        {
            code: String.raw`/[[A&&B]]/v`,
            output: String.raw`/[A&&B]/v`,
            errors: 1,
        },
        {
            code: String.raw`/[[\q{abc}]]/v`,
            output: String.raw`/[\q{abc}]/v`,
            errors: 2,
        },
    ],
})
