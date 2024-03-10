"use strict"

module.exports = {
    extends: [require.resolve('./.eslintrc.js')],
    overrides: [
        {
            files: ["tests/lib/rules/*"],
            extends: ['plugin:eslint-rule-tester/recommended-legacy']
        },
    ],
}
