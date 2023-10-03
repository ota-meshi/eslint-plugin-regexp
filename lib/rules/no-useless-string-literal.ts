import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import type {
    ClassStringDisjunction,
    StringAlternative,
} from "@eslint-community/regexpp/ast"
import { RESERVED_DOUBLE_PUNCTUATOR_CHARS } from "../utils/unicode-set"

export default createRule("no-useless-string-literal", {
    meta: {
        docs: {
            description:
                "disallow string disjunction of single characters in `\\q{...}`",
            category: "Best Practices",
            recommended: true,
        },
        schema: [],
        messages: {
            unexpected: "Unexpected string disjunction of single character.",
        },
        type: "suggestion",
        fixable: "code",
    },
    create(context) {
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, getRegexpLocation, fixReplaceNode, pattern } =
                regexpContext
            return {
                onStringAlternativeEnter(saNode) {
                    if (saNode.elements.length === 1) {
                        const csdNode = saNode.parent
                        context.report({
                            node,
                            loc: getRegexpLocation(saNode),
                            messageId: "unexpected",
                            fix: fixReplaceNode(csdNode, () => {
                                const alternativesText = csdNode.alternatives
                                    .filter((alt) => alt !== saNode)
                                    .map((alt) => alt.raw)
                                    .join("|")
                                if (!alternativesText.length) {
                                    const escape =
                                        isNeedEscapedInCharacterClass(
                                            csdNode,
                                            saNode,
                                        )
                                            ? "\\"
                                            : ""
                                    return `${escape}${saNode.raw}`
                                }
                                if (
                                    csdNode.parent.type ===
                                        "ClassIntersection" ||
                                    csdNode.parent.type === "ClassSubtraction"
                                ) {
                                    const escape =
                                        saNode.raw === "^" ? "\\" : ""
                                    return String.raw`[${escape}${saNode.raw}\q{${alternativesText}}]`
                                }
                                const escape = isNeedEscapedInCharacterClass(
                                    csdNode,
                                    saNode,
                                )
                                    ? "\\"
                                    : ""
                                return String.raw`${escape}${saNode.raw}\q{${alternativesText}}`
                            }),
                        })
                    }
                },
            }

            /**
             * Checks whether an escape is required if the given character when placed before a \q{...}
             */
            function isNeedEscapedInCharacterClass(
                disjunction: ClassStringDisjunction,
                character: StringAlternative,
            ) {
                const char = character.raw
                // Avoid [A&&\q{&}] => [A&&&]
                if (
                    RESERVED_DOUBLE_PUNCTUATOR_CHARS.has(char) &&
                    // The previous character is the same
                    pattern[disjunction.start - 1] === char
                ) {
                    return true
                }

                // Avoid [\q{^|ab}] => [^\q{ab}]
                return (
                    char === "^" &&
                    disjunction.parent.type === "CharacterClass" &&
                    disjunction.parent.start === disjunction.start - 1
                )
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
