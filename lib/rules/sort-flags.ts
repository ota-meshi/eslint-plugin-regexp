import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

export default createRule("sort-flags", {
    meta: {
        docs: {
            description: "require regex flags to be sorted",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
        },
        fixable: "code",
        schema: [],
        messages: {
            sortFlags:
                "The flags '{{flags}}' should in the order '{{sortedFlags}}'.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        /**
         * Sort regexp flags
         */
        function sortFlags(flagsStr: string): string {
            return [...flagsStr]
                .sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!)
                .join("")
        }

        /**
         * Create visitor
         */
        function createVisitor({
            regexpNode,
            flagsString,
            ownsFlags,
            getFlagsLocation,
            fixReplaceFlags,
        }: RegExpContext): RegExpVisitor.Handlers {
            if (flagsString && ownsFlags) {
                const sortedFlags = sortFlags(flagsString)
                if (flagsString !== sortedFlags) {
                    context.report({
                        node: regexpNode,
                        loc: getFlagsLocation(),
                        messageId: "sortFlags",
                        data: { flags: flagsString, sortedFlags },
                        fix: fixReplaceFlags(sortedFlags),
                    })
                }
            }

            return {} // not visit RegExpNodes
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
