import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import type { Node as RegExpNode, LookaroundAssertion } from "regexpp/ast"
import { createRule, defineRegexpVisitor } from "../utils"

/* istanbul ignore file */
/**
 * Finds the path from the given `regexpp` AST node to the root node.
 * @param {regexpp.Node} node Node.
 * @returns {regexpp.Node[]} Array that starts with the given node and ends with the root node.
 */
function getPathToRoot(node: RegExpNode) {
    const path = []
    let current = node

    while (current) {
        path.push(current)
        if (!current.parent) {
            break
        }
        current = current.parent
    }

    return path
}

/**
 * Determines whether the given `regexpp` AST node is a lookaround node.
 * @param {regexpp.Node} node Node.
 * @returns {boolean} `true` if it is a lookaround node.
 */
function isLookaround(node: RegExpNode): node is LookaroundAssertion {
    return (
        node.type === "Assertion" &&
        (node.kind === "lookahead" || node.kind === "lookbehind")
    )
}

/**
 * Determines whether the given `regexpp` AST node is a negative lookaround node.
 * @param {regexpp.Node} node Node.
 * @returns {boolean} `true` if it is a negative lookaround node.
 */
function isNegativeLookaround(node: RegExpNode) {
    return isLookaround(node) && node.negate
}

/**
 * Get last element
 */
function last<T>(arr: T[]): T {
    return arr[arr.length - 1]
}

export default createRule("no-useless-backreference", {
    meta: {
        docs: {
            description:
                "disallow useless backreferences in regular expressions",
            recommended: false,
        },
        schema: [],
        messages: {
            nested:
                "Backreference '{{ bref }}' will be ignored. It references group '{{ group }}' from within that group.",
            forward:
                "Backreference '{{ bref }}' will be ignored. It references group '{{ group }}' which appears later in the pattern.",
            backward:
                "Backreference '{{ bref }}' will be ignored. It references group '{{ group }}' which appears before in the same lookbehind.",
            disjunctive:
                "Backreference '{{ bref }}' will be ignored. It references group '{{ group }}' which is in another alternative.",
            intoNegativeLookaround:
                "Backreference '{{ bref }}' will be ignored. It references group '{{ group }}' which is in a negative lookaround.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        /**
         * Create visitor
         * @param node
         */
        function createVisitor(node: Expression): RegExpVisitor.Handlers {
            return {
                onBackreferenceEnter(bref) {
                    const group = bref.resolved,
                        brefPath = getPathToRoot(bref),
                        groupPath = getPathToRoot(group)
                    let messageId = null

                    if (brefPath.includes(group)) {
                        // group is bref's ancestor => bref is nested ('nested reference') => group hasn't matched yet when bref starts to match.
                        messageId = "nested"
                    } else {
                        // Start from the root to find the lowest common ancestor.
                        let i = brefPath.length - 1,
                            j = groupPath.length - 1

                        do {
                            i--
                            j--
                        } while (brefPath[i] === groupPath[j])

                        const indexOfLowestCommonAncestor = j + 1,
                            groupCut = groupPath.slice(
                                0,
                                indexOfLowestCommonAncestor,
                            ),
                            commonPath = groupPath.slice(
                                indexOfLowestCommonAncestor,
                            ),
                            lowestCommonLookaround = commonPath.find(
                                isLookaround,
                            ),
                            isMatchingBackward =
                                lowestCommonLookaround &&
                                lowestCommonLookaround.kind === "lookbehind"

                        if (!isMatchingBackward && bref.end <= group.start) {
                            // bref is left, group is right ('forward reference') => group hasn't matched yet when bref starts to match.
                            messageId = "forward"
                        } else if (
                            isMatchingBackward &&
                            group.end <= bref.start
                        ) {
                            // the opposite of the previous when the regex is matching backward in a lookbehind context.
                            messageId = "backward"
                        } else if (last(groupCut).type === "Alternative") {
                            // group's and bref's ancestor nodes below the lowest common ancestor are sibling alternatives => they're disjunctive.
                            messageId = "disjunctive"
                        } else if (groupCut.some(isNegativeLookaround)) {
                            // group is in a negative lookaround which isn't bref's ancestor => group has already failed when bref starts to match.
                            messageId = "intoNegativeLookaround"
                        }
                    }

                    if (messageId) {
                        context.report({
                            node,
                            messageId,
                            data: {
                                bref: bref.raw,
                                group: group.raw,
                            },
                        })
                    }
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
