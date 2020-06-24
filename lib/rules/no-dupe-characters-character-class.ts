import { createRule, defineRegexpVisitor } from "../utils"
module.exports = createRule("no-dupe-characters-character-class", {
    meta: {
        type: "suggestion",
        docs: {
            description:
                "disallow duplicate characters in the RegExp character class",
            recommended: true,
        },
        schema: [],
        messages: {},
    },
    create(context) {
        return defineRegexpVisitor(context, {})
    },
})
