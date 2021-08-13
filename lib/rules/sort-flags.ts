import type { RegExpContext, UnparsableRegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"

export default createRule("sort-flags", {
    meta: {
        docs: {
            description: "require regex flags to be sorted",
            category: "Stylistic Issues",
            recommended: true,
        },
        fixable: "code",
        schema: [],
        messages: {
            sortFlags:
                "The flags '{{flags}}' should be in the order '{{sortedFlags}}'.",
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

        /** The logic of this rule */
        function visit({
            regexpNode,
            flagsString,
            ownsFlags,
            getFlagsLocation,
            fixReplaceFlags,
        }: RegExpContext | UnparsableRegExpContext) {
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
        }

        return defineRegexpVisitor(context, {
            createVisitor(regexpContext) {
                visit(regexpContext)
                return {}
            },
            visitInvalid: visit,
            visitUnknown: visit,
        })
    },
})
