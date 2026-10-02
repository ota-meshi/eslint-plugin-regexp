import { SnapshotRuleTester } from "eslint-snapshot-rule-tester"
import rule from "../../../lib/rules/prefer-regexp-exec.ts"

const tester = new SnapshotRuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("prefer-regexp-exec", rule, {
    valid: [
        `
        /thing/.exec('something');

        'some things are just things'.match(/thing/g);

        const text = 'something';
        const search = /thing/;
        search.exec(text);
        `,
        `
        /thin[[g]]/v.exec('something');
        `,
        // The flags of the regular expression are unknown.
        `
        function fn(search) {
            return 'something'.match(search);
        }
        `,
        String.raw`
        class A {
            PATH_REGEXP = /^.*\//g;

            getLogPath(filepath) {
                return String(filepath).match(this.PATH_REGEXP)?.[0];
            }
        }
        `,
        `
        function fn(pattern, flags) {
            const text = 'something';
            text.match(new RegExp(pattern, 'g'));
            text.match(new RegExp(pattern, flags));
            text.match(new RegExp(pattern, ...flags));
            // \`new RegExp(re)\` copies the flags of \`re\`.
            text.match(new RegExp(pattern));
            text.match(RegExp(pattern));
        }
        `,
        // Not the global \`RegExp\`.
        `
        function fn(RegExp, pattern) {
            'something'.match(new RegExp(pattern));
        }
        `,
        // The object may have its own \`Symbol.match\` method.
        `
        function fn(matcher) {
            'something'.match({ [Symbol.match]: matcher });
        }
        `,
    ],
    invalid: [
        `
            'something'.match(/thing/);

            'some things are just things'.match(/thing/);

            const text = 'something';
            const search = /thing/;
            text.match(search);
            `,
        `
            const search = /search/;

            const fn = (a) => a + ''
            fn(1).match(search);
            `,
        `
            const search = /search/;

            const v = a + b
            v.match(search);

            const n = 1 + 2
            n.match(search); // ignore
            `,
        `
            'something'.match(/thin[[g]]/v);
            `,
        `
            'something'.match('thing');
            `,
        `
            'something'.match(new RegExp('thing'));
            'something'.match(new RegExp('thing', 'i'));
            `,
        `
            function fn(pattern) {
                const text = 'something';
                // The pattern is known to be a string, so it contributes no flags.
                text.match(new RegExp(\`^\${pattern}$\`));
                text.match(new RegExp(pattern + ''));
                // The flags argument takes precedence over the flags of the pattern.
                text.match(new RegExp(pattern, 'i'));
            }
            `,
    ],
})
