"use strict"

const { rules } = require("eslint-plugin-regexp")

module.exports = {
    rules: Object.keys(rules)
        .map((name) => `regexp/${name}`)
        .reduce((p, c) => {
            p[c] = "off"
            return p
        }, {}),
}
