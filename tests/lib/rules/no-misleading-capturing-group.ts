import { RuleTester } from "../rule-tester"
import rule from "../../../lib/rules/no-misleading-capturing-group"

const tester = new RuleTester({
    languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
    },
})

tester.run("no-misleading-capturing-group", rule as any, {
    valid: [
        String.raw`/a+a+/`,
        String.raw`/(a+a+)/`,
        String.raw`/(a+a+)b+/`,

        String.raw`/^(a*(?!a)).+/u`,
        String.raw`/(^~~?)(?!~)[\s\S]+(?=\1$)/m`,
        String.raw`/(^~~?(?!~))[\s\S]+(?=\1$)/m`,
        String.raw`/(^~(?:~|(?!~)))[\s\S]+(?=\1$)/m`,
        {
            code: String.raw`/^(a*).+/u`,
            options: [{ reportBacktrackingEnds: false }],
        },
    ],
    invalid: [
        {
            code: String.raw`/\d+(\d*)/`,
            errors: [
                {
                    message:
                        "'\\d*' can be removed because it is already included by '\\d+'. This makes the capturing group misleading, because it actually captures less text than its pattern suggests.",
                    suggestions: [
                        {
                            messageId: "suggestionRemove",
                            output: String.raw`/\d+()/`,
                        },
                    ],
                },
            ],
        },
        {
            code: String.raw`/(?:!\d+|%\w+)(\d*)/`,
            errors: [
                {
                    message:
                        "'\\d*' can be removed because it is already included by '\\d+' and '\\w+'. This makes the capturing group misleading, because it actually captures less text than its pattern suggests.",
                    suggestions: [
                        {
                            messageId: "suggestionRemove",
                            output: String.raw`/(?:!\d+|%\w+)()/`,
                        },
                    ],
                },
            ],
        },

        // backtracking ends
        {
            code: String.raw`/^(a*).+/u`,
            errors: [
                "The quantifier 'a*' can exchange characters (a) with '.+'. This makes the capturing group misleading, because the quantifier will capture fewer characters than its pattern suggests.",
            ],
        },
        {
            code: String.raw`/^([\t ]*).+/gmu`,
            errors: [
                "The quantifier '[\\t ]*' can exchange characters ([\\t ]) with '.+'. This makes the capturing group misleading, because the quantifier will capture fewer characters than its pattern suggests.",
            ],
        },
        {
            code: String.raw`/('{2,5}).+?\1/`,
            errors: [
                "The quantifier ''{2,5}' can exchange characters (') with '.+?'. This makes the capturing group misleading, because the quantifier will capture fewer characters than its pattern suggests.",
            ],
        },
        {
            code: String.raw`/^(---.*(?:\n|\r\n?))[\s\S]+?(?=(?:\n|\r\n?)^---$)/m`,
            errors: [
                "The quantifier '\\n?' can exchange characters (\\n) with '[\\s\\S]+?'. This makes the capturing group misleading, because the quantifier will capture fewer characters than its pattern suggests.",
            ],
        },
        {
            code: String.raw`/(^~~?)[\s\S]+(?=\1$)/m`,
            errors: [
                "The quantifier '~?' can exchange characters (~) with '[\\s\\S]+'. This makes the capturing group misleading, because the quantifier will capture fewer characters than its pattern suggests.",
            ],
        },
        {
            code: String.raw`/^([a\q{abc}]*).+/v`,
            errors: [
                "The quantifier '[a\\q{abc}]*' can exchange characters (a) with '.+'. This makes the capturing group misleading, because the quantifier will capture fewer characters than its pattern suggests.",
            ],
        },
    ],
})
