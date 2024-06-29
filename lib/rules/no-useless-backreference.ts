import type {
    Node as RegExpNode,
    Backreference,
    Alternative,
    CapturingGroup,
} from "@eslint-community/regexpp/ast"
import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type { ReadonlyFlags } from "regexp-ast-analysis"
import {
    getClosestAncestor,
    getMatchingDirection,
    isZeroLength,
} from "regexp-ast-analysis"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import { mention } from "../utils/mention"

type MessageId =
    | "nested"
    | "disjunctive"
    | "intoNegativeLookaround"
    | "forward"
    | "backward"
    | "empty"

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
 * Returns the problem information specifying the reason why the backreference is
 * useless.
 */
function getUselessProblem(
    backRef: Backreference,
    flags: ReadonlyFlags,
): { messageId: MessageId; group: CapturingGroup; otherGroups: string } | null {
    const groups = [backRef.resolved].flat()

    const problems: { messageId: MessageId; group: CapturingGroup }[] = []
    for (const group of groups) {
        const messageId = getUselessMessageId(backRef, group, flags)
        if (!messageId) {
            return null
        }
        problems.push({ messageId, group })
    }
    if (problems.length === 0) {
        return null
    }

    let problemsToReport

    // Gets problems that appear in the same disjunction.
    const problemsInSameDisjunction = problems.filter(
        (problem) => problem.messageId !== "disjunctive",
    )

    if (problemsInSameDisjunction.length) {
        // Only report problems that appear in the same disjunction.
        problemsToReport = problemsInSameDisjunction
    } else {
        // If all groups appear in different disjunctions, report it.
        problemsToReport = problems
    }

    const [{ messageId, group }, ...other] = problemsToReport
    let otherGroups = ""

    if (other.length === 1) {
        otherGroups = " and another group"
    } else if (other.length > 1) {
        otherGroups = ` and other ${other.length} groups`
    }
    return {
        messageId,
        group,
        otherGroups,
    }
}

/**
 * Returns the message id specifying the reason why the backreference is
 * useless.
 */
function getUselessMessageId(
    backRef: Backreference,
    group: CapturingGroup,
    flags: ReadonlyFlags,
): MessageId | null {
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

    if (isZeroLength(group, flags)) {
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
            nested: "Backreference {{ bref }} will be ignored. It references group {{ group }}{{ otherGroups }} from within that group.",
            forward:
                "Backreference {{ bref }} will be ignored. It references group {{ group }}{{ otherGroups }} which appears later in the pattern.",
            backward:
                "Backreference {{ bref }} will be ignored. It references group {{ group }}{{ otherGroups }} which appears before in the same lookbehind.",
            disjunctive:
                "Backreference {{ bref }} will be ignored. It references group {{ group }}{{ otherGroups }} which is in another alternative.",
            intoNegativeLookaround:
                "Backreference {{ bref }} will be ignored. It references group {{ group }}{{ otherGroups }} which is in a negative lookaround.",
            empty: "Backreference {{ bref }} will be ignored. It references group {{ group }}{{ otherGroups }} which always captures zero characters.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        function createVisitor({
            node,
            flags,
            getRegexpLocation,
        }: RegExpContext): RegExpVisitor.Handlers {
            return {
                onBackreferenceEnter(backRef) {
                    const problem = getUselessProblem(backRef, flags)

                    if (problem) {
                        context.report({
                            node,
                            loc: getRegexpLocation(backRef),
                            messageId: problem.messageId,
                            data: {
                                bref: mention(backRef),
                                group: mention(problem.group),
                                otherGroups: problem.otherGroups,
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
