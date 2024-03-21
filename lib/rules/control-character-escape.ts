import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils"
import {
    CP_VT,
    CP_CR,
    CP_FF,
    CP_LF,
    CP_TAB,
    createRule,
    defineRegexpVisitor,
} from "../utils"
import type { PatternRange } from "../utils/ast-utils/pattern-source"
import { isRegexpLiteral } from "../utils/ast-utils/utils"
import { mentionChar } from "../utils/mention"

const CONTROL_CHARS = new Map<number, string>([
    [0, "\\0"],
    [CP_TAB, "\\t"],
    [CP_LF, "\\n"],
    [CP_VT, "\\v"],
    [CP_FF, "\\f"],
    [CP_CR, "\\r"],
])

/**
 * Returns whether the regex is represented by a RegExp literal in source code
 * at the given range.
 */
function isRegExpLiteralAt(
    { node, patternSource }: RegExpContext,
    at: PatternRange,
): boolean {
    if (isRegexpLiteral(node)) {
        return true
    }

    const replaceRange = patternSource.getReplaceRange(at)
    if (replaceRange && replaceRange.type === "RegExp") {
        return true
    }

    return false
}

export default createRule("control-character-escape", {
    meta: {
        docs: {
            description: "enforce consistent escaping of control characters",
            category: "Best Practices",
            recommended: true,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected:
                "Unexpected control character escape {{actual}}. Use '{{expected}}' instead.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, getRegexpLocation, fixReplaceNode } = regexpContext

            return {
                onCharacterEnter(cNode) {
                    if (cNode.parent.type === "CharacterClassRange") {
                        // ignore ranges
                        return
                    }

                    const expectedRaw = CONTROL_CHARS.get(cNode.value)
                    if (expectedRaw === undefined) {
                        // not a known control character
                        return
                    }
                    if (cNode.raw === expectedRaw) {
                        // all good
                        return
                    }
                    if (
                        !isRegExpLiteralAt(regexpContext, cNode) &&
                        cNode.raw === String.fromCodePoint(cNode.value)
                    ) {
                        // we allow the direct usage of control characters in
                        // string if it's not in regexp literal
                        // e.g. `RegExp("[\t\n]")` is ok
                        return
                    }

                    context.report({
                        node,
                        loc: getRegexpLocation(cNode),
                        messageId: "unexpected",
                        data: {
                            actual: mentionChar(cNode),
                            expected: expectedRaw,
                        },
                        fix: fixReplaceNode(cNode, expectedRaw),
                    })
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
