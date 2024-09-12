import * as tsParser from "@typescript-eslint/parser"
import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/prefer-result-array-groups"

const filename = "tests/lib/rules/prefer-result-array-groups.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-result-array-groups", rule as any, {
    valid: [
        `
        const regex = /regexp/
        let match
        while (match = regex.exec(foo)) {
            const match = match[0]
            // ...
        }
        `,
        `
        const regex = /a(b)c/
        let match
        while (match = regex.exec(foo)) {
            const p1 = match[1]
            // ...
        }
        `,
        `
        const regex = /a(b)c/
        let match
        while (match = regex.exec(foo)) {
            const p1 = match?.[1]
            // ...
        }
        `,
        `
        const regex = /a(b)c/
        let match
        while (match = regex.exec(foo)) {
            const p1 = match.unknown
            // ...
        }
        `,
        `
        const regex = /a(?<foo>b)c/
        let match
        while (match = regex.exec(foo)) {
            const p1 = match.unknown
            // ...
        }
        `,
        `
        const regex = /reg[[exp]]/v
        let match
        while (match = regex.exec(foo)) {
            const match = match[0]
            // ...
        }
        `,
        // String.prototype.match()
        `
        const arr = "str".match(/regexp/)
        const p1 = arr[1]
        `,
        `
        const arr = "str".match(/a(b)c/)
        const p1 = arr[1]
        `,
        `
        const arr = "str".match(/a(?<foo>b)c/)
        const p1 = arr.groups.foo
        `,
        `
        const arr = "str".match(/a(?<foo>b)c/)
        const p1 = arr.unknown
        `,
        `
        const arr = unknown.match(/a(?<foo>b)c/)
        const p1 = arr[1]
        `,
        `
        const arr = "str".match(/a(?<foo>b)c/g)
        const p1 = arr[1]
        `,
        // String.prototype.matchAll()
        `
        const matches = "str".matchAll(/a(?<foo>b)c/);
        for (const match of matches) {
            const p1 = match.groups.foo
            // ..
        }
        `,
        `
        const matches = "str".matchAll(/a(b)c/);
        for (const match of matches) {
            const p1 = match[1]
            // ..
        }
        `,
        `
        const matches = unknown.matchAll(/a(?<foo>b)c/);
        for (const match of matches) {
            const p1 = match.groups.foo
            // ..
        }
        `,
    ],
    invalid: [
        `
            const regex = /a(?<foo>b)c/
            let match
            while (match = regex.exec(foo)) {
                const p1 = match[1]
                // ...
            }
            `,
        `
            const regex = /a(?<foo>b)c/
            let match
            while (match = regex.exec(foo)) {
                const p1 = match?.[1]
                // ...
            }
            `,
        `
            const regex = /a(?<foo>b)c/
            let match
            while (match = regex.exec(foo)) {
                const p1 = match?.[(1)]
                // ...
            }
            `,
        `
            const regex = /(a)(?<foo>b)c/
            let match
            while (match = regex.exec(foo)) {
                const p1 = match[1]
                const p2 = match[2]
                // ...
            }
            `,
        `
            const regex = /(?<foo>a)(?<bar>b)c/
            let match
            while (match = regex.exec(foo)) {
                const [,p1,p2] = match
                // ...
            }
            `,
        `
            const regex = /a(?<foo>[[b]])c/v
            let match
            while (match = regex.exec(foo)) {
                const p1 = match[1]
                // ...
            }
            `,
        // String.prototype.match()
        `
            const arr = "str".match(/a(?<foo>b)c/)
            const p1 = arr[1]
            `,
        {
            code: `
            const arr = unknown.match(/a(?<foo>b)c/)
            const p1 = arr[1]
            `,
            options: [{ strictTypes: false }],
        },
        // String.prototype.matchAll()
        `
            const matches = "str".matchAll(/a(?<foo>b)c/);
            for (const match of matches) {
                const p1 = match[1]
                // ..
            }
            `,
        {
            code: `
            const matches = unknown.matchAll(/a(?<foo>b)c/);
            for (const match of matches) {
                const p1 = match[1]
                // ..
            }
            `,
            options: [{ strictTypes: false }],
        },
        // with TypeScript
        {
            filename,
            code: `
            const regex = /a(?<foo>b)c/
            let match
            while (match = regex.exec(foo)) {
                const p1 = match[1]
                // ...
            }
            `,
            files: ["**/*.*"],
            languageOptions: {
                parser: tsParser,
                parserOptions: {
                    project: require.resolve("../../../tsconfig.json"),
                    disallowAutomaticSingleRunInference: true,
                },
            },
        },
        {
            // If don't give type information.
            code: `
            const regex = /a(?<foo>b)c/
            let match
            while (match = regex.exec(foo)) {
                const p1 = match[1]
                // ...
            }
            `,
            languageOptions: {
                parser: tsParser,
            },
        },
        {
            // Not using RegExpExecArray
            filename,
            code: `
            const regex = /a(?<foo>b)c/
            let match: any[] | null
            while (match = regex.exec(foo)) {
                const p1 = match[1]
                // ...
            }
            `,
            files: ["**/*.*"],
            languageOptions: {
                parser: tsParser,
                parserOptions: {
                    project: require.resolve("../../../tsconfig.json"),
                    disallowAutomaticSingleRunInference: true,
                },
            },
        },
        {
            // Using `any` type.
            filename,
            code: `
            const regex = /a(?<foo>b)c/
            let match: any
            while (match = regex.exec(foo)) {
                const p1 = match[1]
                // ...
            }
            `,
            files: ["**/*.*"],
            languageOptions: {
                parser: tsParser,
                parserOptions: {
                    project: require.resolve("../../../tsconfig.json"),
                    disallowAutomaticSingleRunInference: true,
                },
            },
        },
        {
            // https://github.com/ota-meshi/eslint-plugin-regexp/issues/355
            filename,
            code: `
            const match = /(?<foo>foo)/u.exec(str)!
            match[1]; // <-

            /(?<bar>bar)/u.exec(str)?.[1]; // <-
            const match2 = /(?<baz>baz)/u.exec(str)
            match2?.[1] // <-

            const match3 = /(?<qux>qux)/u.exec(str) as RegExpExecArray
            match3[1] // <-
            `,
            files: ["**/*.*"],
            languageOptions: {
                parser: tsParser,
                parserOptions: {
                    project: require.resolve("../../../tsconfig.json"),
                    disallowAutomaticSingleRunInference: true,
                },
            },
        },
        `
            const match = /(?<foo>foo)/u.exec(str)
            if (match) {
                match[1] // <-
            }

            const match2 = /(?<bar>bar)/u.exec(str)
            match2
                ? match2[1] // <-
                : null;

            const match3 = /(?<baz>baz)/u.exec(str)
            match3 && match3[1] // <-

            const match4 = /(?<qux>qux)/u.exec(str)
            if (!match4) {
            } else {
                match4[1] // <-
            }
            `,
    ],
})
