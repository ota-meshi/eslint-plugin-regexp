import type { RegExpVisitor } from "regexpp/visitor"
import type { RegExpContext } from "../utils"
import {
    CP_VT,
    CP_CR,
    CP_FF,
    CP_LF,
    CP_TAB,
    createRule,
    defineRegexpVisitor,
    isRegexpLiteral,
} from "../utils"

const CONTROL_CHARS = new Map<number, string>([
    [0, "\\0"],
    [CP_TAB, "\\t"],
    [CP_LF, "\\n"],
    [CP_VT, "\\v"],
    [CP_FF, "\\f"],
    [CP_CR, "\\r"],
])

export default createRule("control-character-escape", {
    meta: {
        docs: {
            description: "enforce consistent escaping of control characters",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected:
                "Unexpected control character escape '{{actual}}' ({{cp}}). Use '{{expected}}' instead.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        /**
         * Create visitor
         */
        function createVisitor({
            node,
            getRegexpLocation,
            fixReplaceNode,
        }: RegExpContext): RegExpVisitor.Handlers {
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
                        !isRegexpLiteral(node) &&
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
                            actual: cNode.raw,
                            cp: `U+${cNode.value
                                .toString(16)
                                .padStart(4, "0")}`,
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
