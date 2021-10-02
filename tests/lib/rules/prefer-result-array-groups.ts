import { RuleTester } from "eslint"
import rule from "../../../lib/rules/prefer-result-array-groups"

const tester = new RuleTester({
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
    },
})

tester.run("prefer-result-array-groups", rule as any, {
    valid: [
        `
        const regex = /regexp/
        let re
        while (re = regex.exec(foo)) {
            const match = re[0]
            // ...
        }
        `,
        `
        const regex = /a(b)c/
        let re
        while (re = regex.exec(foo)) {
            const p1 = re[1]
            // ...
        }
        `,
        `
        const regex = /a(b)c/
        let re
        while (re = regex.exec(foo)) {
            const p1 = re?.[1]
            // ...
        }
        `,
        `
        const regex = /a(b)c/
        let re
        while (re = regex.exec(foo)) {
            const p1 = re.unknown
            // ...
        }
        `,
        `
        const regex = /a(?<foo>b)c/
        let re
        while (re = regex.exec(foo)) {
            const p1 = re.unknown
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
        {
            code: `
            const regex = /a(?<foo>b)c/
            let re
            while (re = regex.exec(foo)) {
                const p1 = re[1]
                // ...
            }
            `,
            output: `
            const regex = /a(?<foo>b)c/
            let re
            while (re = regex.exec(foo)) {
                const p1 = re.groups.foo
                // ...
            }
            `,
            errors: [
                {
                    message:
                        "Unexpected indexed access from regexp result array.",
                    line: 5,
                    column: 28,
                },
            ],
        },
        {
            code: `
            const regex = /a(?<foo>b)c/
            let re
            while (re = regex.exec(foo)) {
                const p1 = re?.[1]
                // ...
            }
            `,
            output: `
            const regex = /a(?<foo>b)c/
            let re
            while (re = regex.exec(foo)) {
                const p1 = re?.groups.foo
                // ...
            }
            `,
            errors: [
                {
                    message:
                        "Unexpected indexed access from regexp result array.",
                    line: 5,
                    column: 28,
                },
            ],
        },
        {
            code: `
            const regex = /a(?<foo>b)c/
            let re
            while (re = regex.exec(foo)) {
                const p1 = re?.[(1)]
                // ...
            }
            `,
            output: `
            const regex = /a(?<foo>b)c/
            let re
            while (re = regex.exec(foo)) {
                const p1 = re?.groups.foo
                // ...
            }
            `,
            errors: [
                {
                    message:
                        "Unexpected indexed access from regexp result array.",
                    line: 5,
                    column: 28,
                },
            ],
        },
        {
            code: `
            const regex = /(a)(?<foo>b)c/
            let re
            while (re = regex.exec(foo)) {
                const p1 = re[1]
                const p2 = re[2]
                // ...
            }
            `,
            output: `
            const regex = /(a)(?<foo>b)c/
            let re
            while (re = regex.exec(foo)) {
                const p1 = re[1]
                const p2 = re.groups.foo
                // ...
            }
            `,
            errors: [
                {
                    message:
                        "Unexpected indexed access from regexp result array.",
                    line: 6,
                    column: 28,
                },
            ],
        },
        {
            code: `
            const regex = /(?<foo>a)(?<bar>b)c/
            let re
            while (re = regex.exec(foo)) {
                const [,p1,p2] = re
                // ...
            }
            `,
            output: null,
            errors: [
                {
                    message:
                        "Unexpected indexed access from regexp result array.",
                    line: 5,
                    column: 25,
                },
                {
                    message:
                        "Unexpected indexed access from regexp result array.",
                    line: 5,
                    column: 28,
                },
            ],
        },
        // String.prototype.match()
        {
            code: `
            const arr = "str".match(/a(?<foo>b)c/)
            const p1 = arr[1]
            `,
            output: `
            const arr = "str".match(/a(?<foo>b)c/)
            const p1 = arr.groups.foo
            `,
            errors: [
                {
                    message:
                        "Unexpected indexed access from regexp result array.",
                    line: 3,
                    column: 24,
                },
            ],
        },
        {
            code: `
            const arr = unknown.match(/a(?<foo>b)c/)
            const p1 = arr[1]
            `,
            output: `
            const arr = unknown.match(/a(?<foo>b)c/)
            const p1 = arr.groups.foo
            `,
            options: [{ strictTypes: false }],
            errors: [
                {
                    message:
                        "Unexpected indexed access from regexp result array.",
                    line: 3,
                    column: 24,
                },
            ],
        },
        // String.prototype.matchAll()
        {
            code: `
            const matches = "str".matchAll(/a(?<foo>b)c/);
            for (const match of matches) {
                const p1 = match[1]
                // ..
            }
            `,
            output: `
            const matches = "str".matchAll(/a(?<foo>b)c/);
            for (const match of matches) {
                const p1 = match.groups.foo
                // ..
            }
            `,
            errors: [
                {
                    message:
                        "Unexpected indexed access from regexp result array.",
                    line: 4,
                    column: 28,
                },
            ],
        },
        {
            code: `
            const matches = unknown.matchAll(/a(?<foo>b)c/);
            for (const match of matches) {
                const p1 = match[1]
                // ..
            }
            `,
            output: `
            const matches = unknown.matchAll(/a(?<foo>b)c/);
            for (const match of matches) {
                const p1 = match.groups.foo
                // ..
            }
            `,
            options: [{ strictTypes: false }],
            errors: [
                {
                    message:
                        "Unexpected indexed access from regexp result array.",
                    line: 4,
                    column: 28,
                },
            ],
        },
    ],
})
