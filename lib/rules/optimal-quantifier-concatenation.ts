import type { RegExpVisitor } from "@eslint-community/regexpp/visitor"
import type {
    Alternative,
    CapturingGroup,
    Character,
    CharacterClass,
    CharacterSet,
    Element,
    Group,
    Node,
    QuantifiableElement,
    Quantifier,
} from "@eslint-community/regexpp/ast"
import type { AST } from "eslint"
import type { RegExpContext, Quant } from "../utils"
import { createRule, defineRegexpVisitor, quantToString } from "../utils"
import type { Ancestor, ReadonlyFlags } from "regexp-ast-analysis"
import {
    Chars,
    hasSomeDescendant,
    getConsumedChars,
    toUnicodeSet,
} from "regexp-ast-analysis"
import { getParser } from "../utils/regexp-ast"
import type { CharSet } from "refa"
import { joinEnglishList, mention } from "../utils/mention"
import { canSimplifyQuantifier } from "../utils/regexp-ast/simplify-quantifier"
import { fixSimplifyQuantifier } from "../utils/fix-simplify-quantifier"
import { assertNever } from "../utils/util"

/**
 * Returns whether the given node is or contains a capturing group.
 */
function hasCapturingGroup(node: Node): boolean {
    return hasSomeDescendant(node, (d) => d.type === "CapturingGroup")
}

interface SingleConsumedChar {
    readonly char: CharSet
    /**
     * Whether the entire element is a single character.
     *
     * If `true`, the element is equivalent to `[char]`.
     *
     * If `false`, the element is equivalent to `[char]|unknown`.
     */
    readonly complete: boolean
}

const EMPTY_UTF16: SingleConsumedChar = {
    char: Chars.empty({}),
    complete: false,
}
const EMPTY_UNICODE: SingleConsumedChar = {
    char: Chars.empty({ unicode: true }),
    complete: false,
}
const EMPTY_UNICODE_SETS: SingleConsumedChar = {
    char: Chars.empty({ unicodeSets: true }),
    complete: false,
}

/**
 * If the given element is guaranteed to only consume a single character set,
 * then this character set will be returned, `null` otherwise.
 */
function getSingleConsumedChar(
    element: Element | Alternative,
    flags: ReadonlyFlags,
): SingleConsumedChar {
    const empty = flags.unicodeSets
        ? EMPTY_UNICODE_SETS
        : flags.unicode
        ? EMPTY_UNICODE
        : EMPTY_UTF16

    switch (element.type) {
        case "Alternative":
            if (element.elements.length === 1) {
                return getSingleConsumedChar(element.elements[0], flags)
            }
            return empty

        case "Character":
        case "CharacterSet":
        case "CharacterClass":
        case "ExpressionCharacterClass": {
            const set = toUnicodeSet(element, flags)
            return {
                char: set.chars,
                complete: set.accept.isEmpty,
            }
        }

        case "Group":
        case "CapturingGroup": {
            const results = element.alternatives.map((a) =>
                getSingleConsumedChar(a, flags),
            )

            return {
                char: empty.char.union(...results.map((r) => r.char)),
                complete: results.every((r) => r.complete),
            }
        }

        case "Assertion":
        case "Backreference":
        case "Quantifier":
            return empty

        default:
            return assertNever(element)
    }
}

/**
 * Returns the sum of the given quant and constant.
 */
function quantAddConst(quant: Readonly<Quant>, constant: number): Quant {
    return {
        min: quant.min + constant,
        max: quant.max + constant,
        greedy: quant.greedy,
    }
}

/**
 * Returns the raw of the given quantifier.
 */
function quantize(element: QuantifiableElement, quant: Quant): string {
    if (quant.min === 0 && quant.max === 0) {
        return ""
    }
    if (quant.min === 1 && quant.max === 1) {
        return element.raw
    }
    return element.raw + quantToString(quant)
}

type GroupOrCharacter =
    | Group
    | CapturingGroup
    | Character
    | CharacterClass
    | CharacterSet

/**
 * Returns whether the given element is a group or character.
 */
function isGroupOrCharacter(element: Element): element is GroupOrCharacter {
    switch (element.type) {
        case "Group":
        case "CapturingGroup":
        case "Character":
        case "CharacterClass":
        case "CharacterSet":
        case "ExpressionCharacterClass":
            return true
        case "Assertion":
        case "Backreference":
        case "Quantifier":
            return false
        default:
            return assertNever(element)
    }
}

type Replacement = BothReplacement | NestedReplacement
/** Replace both the left and right quantifiers. */
interface BothReplacement {
    type: "Both"
    messageId: string
    raw: string
}
/** Replace only the nested quantifier. */
interface NestedReplacement {
    type: "Nested"
    messageId: string
    raw: string
    dominate: Quantifier
    nested: Quantifier
}

/**
 * Returns the replacement for the two adjacent elements.
 */
function getQuantifiersReplacement(
    left: Quantifier,
    right: Quantifier,
    flags: ReadonlyFlags,
): Replacement | null {
    // this only handles quantifiers that aren't simple repetitions
    // e.g. `a*\w*` will be handled but `a{6}\w` will not be.
    if (left.min === left.max || right.min === right.max) {
        return null
    }

    // both quantifiers must have the same greediness
    if (left.greedy !== right.greedy) {
        return null
    }

    // compare
    const lSingle = getSingleConsumedChar(left.element, flags)
    const rSingle = getSingleConsumedChar(right.element, flags)
    const lPossibleChar = lSingle.complete
        ? lSingle.char
        : getConsumedChars(left.element, flags).chars
    const rPossibleChar = rSingle.complete
        ? rSingle.char
        : getConsumedChars(right.element, flags).chars
    const greedy = left.greedy

    let lQuant: Readonly<Quant>, rQuant: Readonly<Quant>
    if (
        lSingle.complete &&
        rSingle.complete &&
        lSingle.char.equals(rSingle.char)
    ) {
        // left is equal to right
        lQuant = {
            min: left.min + right.min,
            max: left.max + right.max,
            greedy,
        }
        rQuant = { min: 0, max: 0, greedy }
    } else if (
        right.max === Infinity &&
        rSingle.char.isSupersetOf(lPossibleChar)
    ) {
        // left is a subset of right
        lQuant = {
            min: left.min,
            max: left.min,
            greedy,
        }
        rQuant = right // unchanged
    } else if (
        left.max === Infinity &&
        lSingle.char.isSupersetOf(rPossibleChar)
    ) {
        // right is a subset of left
        lQuant = left // unchanged
        rQuant = {
            min: right.min,
            max: right.min,
            greedy,
        }
    } else {
        return null
    }

    const raw = quantize(left.element, lQuant) + quantize(right.element, rQuant)

    // eslint-disable-next-line one-var -- rule error
    let messageId
    if (
        lQuant.max === 0 &&
        right.max === rQuant.max &&
        right.min === rQuant.min
    ) {
        messageId = "removeLeft"
    } else if (
        rQuant.max === 0 &&
        left.max === lQuant.max &&
        left.min === lQuant.min
    ) {
        messageId = "removeRight"
    } else {
        messageId = "replace"
    }

    return { type: "Both", raw, messageId }
}

/**
 * A element that is repeated a constant number of times.
 */
interface RepeatedElement {
    type: "Repeated"
    element: GroupOrCharacter
    min: number
}

/**
 * Tries to convert the given element into a repeated element.
 */
function asRepeatedElement(element: Element): RepeatedElement | null {
    if (element.type === "Quantifier") {
        if (
            element.min === element.max &&
            element.min > 0 &&
            isGroupOrCharacter(element.element)
        ) {
            return {
                type: "Repeated",
                element: element.element,
                min: element.min,
            }
        }
    } else if (isGroupOrCharacter(element)) {
        return { type: "Repeated", element, min: 1 }
    }

    return null
}

/**
 * Returns the replacement for the two adjacent elements.
 */
function getQuantifierRepeatedElementReplacement(
    pair: [Quantifier, RepeatedElement] | [RepeatedElement, Quantifier],
    flags: ReadonlyFlags,
): Replacement | null {
    const [left, right] = pair

    // the characters of both elements have to be complete and equal
    const lSingle = getSingleConsumedChar(left.element, flags)
    if (!lSingle.complete) {
        return null
    }

    const rSingle = getSingleConsumedChar(right.element, flags)
    if (!rSingle.complete) {
        return null
    }

    if (!rSingle.char.equals(lSingle.char)) {
        return null
    }

    let elementRaw, quant
    if (left.type === "Quantifier") {
        elementRaw = left.element.raw
        quant = quantAddConst(left, right.min)
    } else if (right.type === "Quantifier") {
        elementRaw = right.element.raw
        quant = quantAddConst(right, left.min)
    } else {
        throw new Error()
    }

    const raw = elementRaw + quantToString(quant)

    return { type: "Both", messageId: "combine", raw }
}

/**
 * Returns a replacement for the nested quantifier.
 */
function getNestedReplacement(
    dominate: Quantifier,
    nested: Quantifier,
    flags: ReadonlyFlags,
): Replacement | null {
    if (dominate.greedy !== nested.greedy) {
        return null
    }

    if (dominate.max < Infinity || nested.min === nested.max) {
        return null
    }

    const single = getSingleConsumedChar(dominate.element, flags)
    if (single.char.isEmpty) {
        return null
    }

    const nestedPossible = getConsumedChars(nested.element, flags)
    if (single.char.isSupersetOf(nestedPossible.chars)) {
        const { min } = nested
        if (min === 0) {
            return {
                type: "Nested",
                messageId: "nestedRemove",
                raw: "",
                nested,
                dominate,
            }
        }
        return {
            type: "Nested",
            messageId: "nestedReplace",
            raw: quantize(nested.element, { ...nested, max: min }),
            nested,
            dominate,
        }
    }

    return null
}

/** Yields all quantifiers at the start/end of the given element. */
function* nestedQuantifiers(
    root: Element | Alternative,
    direction: "start" | "end",
): Iterable<Quantifier> {
    switch (root.type) {
        case "Alternative":
            if (root.elements.length > 0) {
                const index =
                    direction === "start" ? 0 : root.elements.length - 1
                yield* nestedQuantifiers(root.elements[index], direction)
            }
            break

        case "CapturingGroup":
        case "Group":
            for (const a of root.alternatives) {
                yield* nestedQuantifiers(a, direction)
            }
            break

        case "Quantifier":
            yield root

            if (root.max === 1) {
                yield* nestedQuantifiers(root.element, direction)
            }
            break

        default:
            break
    }
}

/**
 * Whether the computed replacement is to be ignored.
 */
function ignoreReplacement(
    left: Element,
    right: Element,
    result: Replacement,
): boolean {
    // There is a relatively common case for which we want to make
    // an exception: `aa?`
    // We will only suggest the replacement if the new raw is
    // shorter than the current one.
    if (left.type === "Quantifier") {
        if (
            left.raw.length + right.raw.length <= result.raw.length &&
            isGroupOrCharacter(right) &&
            left.min === 0 &&
            left.max === 1
        ) {
            return true
        }
    }
    if (right.type === "Quantifier") {
        if (
            left.raw.length + right.raw.length <= result.raw.length &&
            isGroupOrCharacter(left) &&
            right.min === 0 &&
            right.max === 1
        ) {
            return true
        }
    }
    return false
}

/**
 * Returns the replacement for the two adjacent elements.
 */
function getReplacement(
    left: Element,
    right: Element,
    flags: ReadonlyFlags,
): Replacement | null {
    if (left.type === "Quantifier" && right.type === "Quantifier") {
        const result = getQuantifiersReplacement(left, right, flags)
        if (result && !ignoreReplacement(left, right, result)) return result
    }

    if (left.type === "Quantifier") {
        const rightRep = asRepeatedElement(right)
        if (rightRep) {
            const result = getQuantifierRepeatedElementReplacement(
                [left, rightRep],
                flags,
            )
            if (result && !ignoreReplacement(left, right, result)) return result
        }
    }

    if (right.type === "Quantifier") {
        const leftRep = asRepeatedElement(left)
        if (leftRep) {
            const result = getQuantifierRepeatedElementReplacement(
                [leftRep, right],
                flags,
            )
            if (result && !ignoreReplacement(left, right, result)) return result
        }
    }

    if (left.type === "Quantifier" && left.max === Infinity) {
        for (const nested of nestedQuantifiers(right, "start")) {
            const result = getNestedReplacement(left, nested, flags)
            if (result) return result
        }
    }

    if (right.type === "Quantifier" && right.max === Infinity) {
        for (const nested of nestedQuantifiers(left, "end")) {
            const result = getNestedReplacement(right, nested, flags)
            if (result) return result
        }
    }

    return null
}

/**
 * Returns the combined location of two adjacent elements.
 */
function getLoc(
    left: Element,
    right: Element,
    { patternSource }: RegExpContext,
): AST.SourceLocation {
    return patternSource.getAstLocation({
        start: Math.min(left.start, right.start),
        end: Math.max(left.end, right.end),
    })
}

/**
 * Returns a string representation of all capturing groups that the given
 * element is inside of.
 *
 * This function is guaranteed to return the same value for 2 elements that are
 * inside the same set of capturing groups.
 *
 * Note: The string itself is likely nonsensical.
 */
function getCapturingGroupStack(element: Element): string {
    let result = ""
    for (
        let p: Ancestor<Element> = element.parent;
        p.type !== "Pattern";
        p = p.parent
    ) {
        if (p.type === "CapturingGroup") {
            // We just need a unique number for each group.
            // Regexpp doesn't give us the group number, so we'll use its position instead.
            const id = p.start
            result += String.fromCodePoint(32 + id)
        }
    }
    return result
}

const enum CapturingGroupReporting {
    ignore = "ignore",
    report = "report",
}

export default createRule("optimal-quantifier-concatenation", {
    meta: {
        docs: {
            description:
                "require optimal quantifiers for concatenated quantifiers",
            category: "Best Practices",
            recommended: true,
        },
        fixable: "code",
        schema: [
            {
                type: "object",
                properties: {
                    capturingGroups: {
                        enum: ["ignore", "report"],
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            combine:
                "{{left}} and {{right}} can be combined into one quantifier {{fix}}.{{cap}}",
            removeLeft:
                "{{left}} can be removed because it is already included by {{right}}.{{cap}}",
            removeRight:
                "{{right}} can be removed because it is already included by {{left}}.{{cap}}",
            replace:
                "{{left}} and {{right}} can be replaced with {{fix}}.{{cap}}",
            nestedRemove:
                "{{nested}} can be removed because of {{dominate}}.{{cap}}",
            nestedReplace:
                "{{nested}} can be replaced with {{fix}} because of {{dominate}}.{{cap}}",
            removeQuant:
                "{{quant}} can be removed because it is already included by {{cause}}.{{cap}}",
            replaceQuant:
                "{{quant}} can be replaced with {{fix}} because of {{cause}}.{{cap}}",
        },
        type: "suggestion",
    },
    create(context) {
        const cgReporting: CapturingGroupReporting =
            context.options[0]?.capturingGroups ??
            CapturingGroupReporting.report

        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, flags, getRegexpLocation, fixReplaceNode } =
                regexpContext

            const parser = getParser(regexpContext)
            const simplifiedAlready: Quantifier[] = []

            /** Returns whether the given element is included an element that was processed already. */
            function isSimplifiedAlready(element: Element): boolean {
                return simplifiedAlready.some((q) => {
                    return hasSomeDescendant(q, element)
                })
            }

            return {
                onQuantifierEnter(quantifier) {
                    const result = canSimplifyQuantifier(
                        quantifier,
                        flags,
                        parser,
                    )
                    if (!result.canSimplify) return

                    const quantStack = getCapturingGroupStack(quantifier)
                    // This means that we crossed into or out of a capturing group somewhere
                    const crossesCapturingGroup = result.dependencies.some(
                        (e) => getCapturingGroupStack(e) !== quantStack,
                    )

                    const removesCapturingGroup =
                        quantifier.min === 0 && hasCapturingGroup(quantifier)

                    const involvesCapturingGroup =
                        removesCapturingGroup || crossesCapturingGroup
                    if (
                        involvesCapturingGroup &&
                        cgReporting === CapturingGroupReporting.ignore
                    ) {
                        return
                    }

                    // this ensures that neither the neither the quantifier itself
                    // nor its dependencies are reported again by this rule
                    simplifiedAlready.push(quantifier, ...result.dependencies)

                    const cause = joinEnglishList(
                        result.dependencies.map((d) => mention(d)),
                    )

                    const [replacement, fix] = fixSimplifyQuantifier(
                        quantifier,
                        result,
                        regexpContext,
                    )

                    if (quantifier.min === 0) {
                        const cap = involvesCapturingGroup
                            ? removesCapturingGroup
                                ? " This cannot be fixed automatically because it removes a capturing group."
                                : " This cannot be fixed automatically because it involves a capturing group."
                            : ""

                        context.report({
                            node,
                            loc: getRegexpLocation(quantifier),
                            messageId: "removeQuant",
                            data: {
                                quant: mention(quantifier),
                                cause,
                                cap,
                            },
                            fix: involvesCapturingGroup ? undefined : fix,
                        })
                    } else {
                        const cap = involvesCapturingGroup
                            ? " This cannot be fixed automatically because it involves a capturing group."
                            : ""

                        context.report({
                            node,
                            loc: getRegexpLocation(quantifier),
                            messageId: "replaceQuant",
                            data: {
                                quant: mention(quantifier),
                                fix: mention(replacement),
                                cause,
                                cap,
                            },
                            fix: involvesCapturingGroup ? undefined : fix,
                        })
                    }
                },
                onAlternativeLeave(aNode) {
                    for (let i = 0; i < aNode.elements.length - 1; i++) {
                        const left = aNode.elements[i]
                        const right = aNode.elements[i + 1]
                        if (
                            isSimplifiedAlready(left) ||
                            isSimplifiedAlready(right)
                        ) {
                            // we already handled at least one element
                            continue
                        }

                        const replacement = getReplacement(left, right, flags)
                        if (!replacement) {
                            continue
                        }

                        const involvesCapturingGroup =
                            hasCapturingGroup(left) || hasCapturingGroup(right)
                        if (
                            involvesCapturingGroup &&
                            cgReporting === CapturingGroupReporting.ignore
                        ) {
                            continue
                        }

                        const cap = involvesCapturingGroup
                            ? " This cannot be fixed automatically because it might change or remove a capturing group."
                            : ""

                        if (replacement.type === "Both") {
                            context.report({
                                node,
                                loc: getLoc(left, right, regexpContext),
                                messageId: replacement.messageId,
                                data: {
                                    left: mention(left),
                                    right: mention(right),
                                    fix: mention(replacement.raw),
                                    cap,
                                },
                                fix: fixReplaceNode(aNode, () => {
                                    if (involvesCapturingGroup) {
                                        return null
                                    }

                                    const before = aNode.raw.slice(
                                        0,
                                        left.start - aNode.start,
                                    )
                                    const after = aNode.raw.slice(
                                        right.end - aNode.start,
                                    )

                                    return before + replacement.raw + after
                                }),
                            })
                        } else {
                            context.report({
                                node,
                                loc: getRegexpLocation(replacement.nested),
                                messageId: replacement.messageId,
                                data: {
                                    nested: mention(replacement.nested),
                                    dominate: mention(replacement.dominate),
                                    fix: mention(replacement.raw),
                                    cap,
                                },
                                fix: fixReplaceNode(replacement.nested, () => {
                                    if (involvesCapturingGroup) {
                                        return null
                                    }
                                    return replacement.raw
                                }),
                            })
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
