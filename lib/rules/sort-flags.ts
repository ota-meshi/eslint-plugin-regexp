import type { Literal } from "estree"
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
         * Report
         */
        function report(
            node: Literal,
            flags: string,
            sortedFlags: string,
            flagsRange: [number, number],
        ) {
            const sourceCode = context.getSourceCode()
            context.report({
                node,
                loc: {
                    start: sourceCode.getLocFromIndex(flagsRange[0]),
                    end: sourceCode.getLocFromIndex(flagsRange[1]),
                },
                messageId: "sortFlags",
                data: { flags, sortedFlags },
                fix(fixer) {
                    return fixer.replaceTextRange(flagsRange, sortedFlags)
                },
            })
        }

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
        }: RegExpContext): RegExpVisitor.Handlers {
            if (regexpNode.type === "Literal") {
                const flags = regexpNode.regex.flags
                const sortedFlags = sortFlags(flags)
                if (flags !== sortedFlags) {
                    report(regexpNode, flags, sortedFlags, [
                        regexpNode.range![1] - regexpNode.regex.flags.length,
                        regexpNode.range![1],
                    ])
                }
            } else {
                const flagsArg = regexpNode.arguments[1]
                if (
                    flagsArg.type === "Literal" &&
                    typeof flagsArg.value === "string"
                ) {
                    const flags = flagsArg.value
                    const sortedFlags = sortFlags(flags)
                    if (flags !== sortedFlags) {
                        report(flagsArg, flags, sortedFlags, [
                            flagsArg.range![0] + 1,
                            flagsArg.range![1] - 1,
                        ])
                    }
                }
            }

            return {} // not visit RegExpNodes
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
