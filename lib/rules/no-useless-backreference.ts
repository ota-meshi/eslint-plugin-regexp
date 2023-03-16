import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type {
    Node as RegExpNode,
    Backreference,
    Alternative,
    CapturingGroup,
} from "@eslint-community/regexpp/ast"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import {
    getClosestAncestor,
    getMatchingDirection,
    isZeroLength,
} from "regexp-ast-analysis"
import { mention } from "../utils/mention"

/**
 * Returns whether the list of ancestors from `from` to `to` contains a negated
 * lookaround.
 */
function hasNegatedLookaroundInBetween(
    from: CapturingGroup,
    to: Alternative,
): boolean {
    for (let p: RegExpNode | null = from.parent; p && p !== to; p = p.parent) {
        if (
            p.type === "Assertion" &&
            (p.kind === "lookahead" || p.kind === "lookbehind") &&
            p.negate
        ) {
            return true
        }
    }
    return false
}

/**
 * Returns the message id specifying the reason why the backreference is
 * useless.
 */
function getUselessMessageId(backRef: Backreference): string | null {
    const group = backRef.resolved

    const closestAncestor = getClosestAncestor(backRef, group)

    if (closestAncestor === group) {
        return "nested"
    } else if (closestAncestor.type !== "Alternative") {
        // if the closest common ancestor isn't an alternative => they're disjunctive.
        return "disjunctive"
    }

    if (hasNegatedLookaroundInBetween(group, closestAncestor)) {
        // if there are negated lookarounds between the group and the closest ancestor
        // => group has already failed when backRef starts to match.
        // e.g. `/(?!(a))\w\1/`
        return "intoNegativeLookaround"
    }

    const matchingDir = getMatchingDirection(closestAncestor)

    if (matchingDir === "ltr" && backRef.end <= group.start) {
        // backRef is left, group is right ('forward reference')
        // => group hasn't matched yet when backRef starts to match.
        return "forward"
    } else if (matchingDir === "rtl" && group.end <= backRef.start) {
        // the opposite of the previous when the regex is matching backwards
        // in a lookbehind context.
        return "backward"
    }

    if (isZeroLength(group)) {
        // if the referenced group does not consume characters, then any
        // backreference will trivially be replaced with the empty string
        return "empty"
    }

    // not useless
    return null
}

export default createRule("no-useless-backreference", {
    meta: {
        docs: {
            description:
                "disallow useless backreferences in regular expressions",
            category: "Possible Errors",
            recommended: true,
        },
        schema: [],
        messages: {
            nested: "Backreference {{ bref }} will be ignored. It references group {{ group }} from within that group.",
            forward:
                "Backreference {{ bref }} will be ignored. It references group {{ group }} which appears later in the pattern.",
            backward:
                "Backreference {{ bref }} will be ignored. It references group {{ group }} which appears before in the same lookbehind.",
            disjunctive:
                "Backreference {{ bref }} will be ignored. It references group {{ group }} which is in another alternative.",
            intoNegativeLookaround:
                "Backreference {{ bref }} will be ignored. It references group {{ group }} which is in a negative lookaround.",
            empty: "Backreference {{ bref }} will be ignored. It references group {{ group }} which always captures zero characters.",
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
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onBackreferenceEnter(backRef) {
                    const messageId = getUselessMessageId(backRef)

                    if (messageId) {
                        context.report({
                            node,
                            loc: getRegexpLocation(backRef),
                            messageId,
                            data: {
                                bref: mention(backRef),
                                group: mention(backRef.resolved),
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
