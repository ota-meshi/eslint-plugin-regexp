import type {
    Alternative,
    Character,
    CharacterClass,
    CharacterSet,
    ExpressionCharacterClass,
    LookaroundAssertion,
    Node,
} from "@eslint-community/regexpp/ast"
import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import { hasStrings } from "regexp-ast-analysis"
import type { RegExpContext } from "../utils/index.ts"
import { createRule, defineRegexpVisitor } from "../utils/index.ts"

type CharElement =
    | Character
    | CharacterSet
    | CharacterClass
    | ExpressionCharacterClass

function isCharElement(node: Node): node is CharElement {
    return (
        node.type === "Character" ||
        node.type === "CharacterSet" ||
        node.type === "CharacterClass" ||
        node.type === "ExpressionCharacterClass"
    )
}

type CharLookaround = LookaroundAssertion & {
    alternatives: [Alternative & { elements: [CharElement] }]
}

function isCharLookaround(node: Node): node is CharLookaround {
    return (
        node.type === "Assertion" &&
        (node.kind === "lookahead" || node.kind === "lookbehind") &&
        node.alternatives.length === 1 &&
        node.alternatives[0].elements.length === 1 &&
        isCharElement(node.alternatives[0].elements[0])
    )
}

function escapeRaw(raw: string): string {
    if (/^[&\-^]$/u.test(raw)) {
        return `\\${raw}`
    }
    return raw
}

export default createRule("prefer-set-operation", {
    meta: {
        docs: {
            description:
                "prefer character class set operations instead of lookarounds",
            category: "Best Practices",
            recommended: true,
        },
        fixable: "code",
        schema: [],
        messages: {
            unexpected:
                "This lookaround can be combined with '{{char}}' using a set operation.",
        },
        type: "suggestion",
    },
    create(context) {
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, flags, getRegexpLocation, fixReplaceNode } =
                regexpContext

            if (!flags.unicodeSets) {
                // set operations are exclusive to the v flag.
                return {}
            }

            function tryApply(
                element: CharElement,
                assertion: CharLookaround,
                parent: Alternative,
            ): void {
                const assertElement = assertion.alternatives[0].elements[0]
                if (hasStrings(assertElement, flags)) {
                    return
                }

                context.report({
                    node,
                    loc: getRegexpLocation(assertion),
                    messageId: "unexpected",
                    data: {
                        char: element.raw,
                    },
                    fix: fixReplaceNode(parent, () => {
                        const op = assertion.negate ? "--" : "&&"
                        const left = escapeRaw(element.raw)
                        const right = escapeRaw(assertElement.raw)
                        const replacement = `[${left}${op}${right}]`

                        return parent.elements
                            .map((e) => {
                                if (e === assertion) {
                                    return ""
                                } else if (e === element) {
                                    return replacement
                                }
                                return e.raw
                            })
                            .join("")
                    }),
                })
            }

            return {
                onAlternativeEnter(alternative) {
                    const { elements } = alternative
                    for (let i = 1; i < elements.length; i++) {
                        const a = elements[i - 1]
                        const b = elements[i]

                        if (
                            isCharElement(a) &&
                            isCharLookaround(b) &&
                            b.kind === "lookbehind"
                        ) {
                            tryApply(a, b, alternative)
                        }
                        if (
                            isCharLookaround(a) &&
                            a.kind === "lookahead" &&
                            isCharElement(b)
                        ) {
                            tryApply(b, a, alternative)
                        }
                    }
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
