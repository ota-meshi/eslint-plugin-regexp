import assert from "assert"
import * as plugin from "../../lib"
import { version } from "../../package.json"
const expectedMeta = {
    name: "eslint-plugin-regexp",
    version,
}

describe("Test for meta object", () => {
    it("A plugin should have a meta object.", () => {
        assert.deepStrictEqual(plugin.meta, expectedMeta)
    })
})
