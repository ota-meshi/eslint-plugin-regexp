import type { Expression } from "estree"
import type { RegExpVisitor } from "regexpp/visitor"
import type {
    Alternative,
    Assertion,
    CapturingGroup,
    Group,
    Quantifier,
} from "regexpp/ast"
import { createRule, defineRegexpVisitor, getRegexpLocation } from "../utils"
import { isZeroLength } from "regexp-ast-analysis"

type ZeroQuantifier = Quantifier & { min: 0 }

/**
 * Checks whether the given quantifier is quantifier with a minimum of 0.
 */
function isZeroQuantifier(node: Quantifier): node is ZeroQuantifier {
    return node.min === 0
}

/**
 * Returns whether the given assertion is optional in regard to the given quantifier with a minimum of 0.
 *
 * Optional means that all paths in the element if the quantifier which contain the given assertion also have do not
 * consume characters. For more information and examples on optional assertions, see the documentation page of this
 * rule.
 */
function isOptional(assertion: Assertion, quantifier: ZeroQuantifier): boolean {
    let element: Assertion | Quantifier | Group | CapturingGroup = assertion
    while (element.parent !== quantifier) {
        const parent: Quantifier | Alternative = element.parent
        if (parent.type === "Alternative") {
            // make sure that all element before and after are zero length
            for (const e of parent.elements) {
                if (e === element) {
                    continue // we will ignore this element.
                }

                if (!isZeroLength(e)) {
                    // Some element around our target element can possibly consume characters.
                    // This means, we found a path from or to the assertion which can consume characters.
                    return false
                }
            }

            if (parent.parent.type === "Pattern") {
                throw new Error(
                    "The given assertion is not a descendant of the given quantifier.",
                )
            }
            element = parent.parent
        } else {
            // parent.type === "Quantifier"
            if (parent.max > 1 && !isZeroLength(parent)) {
                // If an ascendant quantifier of the element has maximum of 2 or more, we have to check whether
                // the quantifier itself has zero length.
                // E.g. in /(?:a|(\b|-){2})?/ the \b is not optional
                return false
            }

            element = parent
        }
    }
    // We reached the top.
    // If we made it this far, we could not disprove that the assertion is optional, so it has to optional.
    return true
}

export default createRule("no-optional-assertion", {
    meta: {
        docs: {
            description: "disallow optional assertions",
            // TODO Switch to recommended in the major version.
            // recommended: true,
            recommended: false,
        },
        schema: [],
        messages: {
            optionalAssertion:
                "This assertion effectively optional and does not change the pattern. Either remove the assertion or change the parent quantifier '{{quantifier}}'.",
        },
        type: "problem",
    },
    create(context) {
        const sourceCode = context.getSourceCode()

        /**
         * Create visitor
         * @param node
         */
        function createVisitor(node: Expression): RegExpVisitor.Handlers {
            // The closest quantifier with a minimum of 0 is stored at index = 0.
            const zeroQuantifierStack: ZeroQuantifier[] = []
            return {
                onQuantifierEnter(q) {
                    if (isZeroQuantifier(q)) {
                        zeroQuantifierStack.unshift(q)
                    }
                },
                onQuantifierLeave(q) {
                    if (zeroQuantifierStack[0] === q) {
                        zeroQuantifierStack.shift()
                    }
                },
                onAssertionEnter(assertion) {
                    const q = zeroQuantifierStack[0]

                    if (q && isOptional(assertion, q)) {
                        context.report({
                            node,
                            loc: getRegexpLocation(sourceCode, node, assertion),
                            messageId: "optionalAssertion",
                            data: {
                                quantifier: q.raw.substr(q.element.raw.length),
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
