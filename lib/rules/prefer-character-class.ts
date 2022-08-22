import type { RegExpVisitor } from "regexpp/visitor"
import type {
    Alternative,
    CapturingGroup,
    Character,
    CharacterClass,
    CharacterClassElement,
    CharacterSet,
    Element,
    Group,
    LookaroundAssertion,
    Node,
    Pattern,
} from "regexpp/ast"
import type { RegExpContext } from "../utils"
import { createRule, defineRegexpVisitor } from "../utils"
import type { CharSet } from "refa"
import type { FirstConsumedChar, ReadonlyFlags } from "regexp-ast-analysis"
import {
    toCharSet,
    getFirstConsumedChar,
    getMatchingDirection,
} from "regexp-ast-analysis"
import type { Position, SourceLocation } from "estree"

/**
 * Find the first index of an element that satisfies the given condition.
 */
function findIndex<T>(
    arr: readonly T[],
    condFn: (item: T, index: number) => boolean,
): number {
    return arr.findIndex(condFn)
}

/**
 * Find the last index of an element that satisfies the given condition.
 */
function findLastIndex<T>(
    arr: readonly T[],
    condFn: (item: T, index: number) => boolean,
): number {
    for (let i = arr.length - 1; i >= 0; i--) {
        if (condFn(arr[i], i)) {
            return i
        }
    }
    return -1
}

type NodeWithAlternatives =
    | Group
    | CapturingGroup
    | Pattern
    | LookaroundAssertion

type RawAlternative = RawCharAlternative | RawNonCharAlternative
interface RawCharAlternative {
    readonly isCharacter: true
    readonly alternative: Alternative
    readonly element: Character | CharacterSet | CharacterClass
}
interface RawNonCharAlternative {
    readonly isCharacter: false
    readonly alternative: Alternative
}

type ParsedAlternative = ParsedCharAlternative | ParsedNonCharAlternative
type CharElementArray = Readonly<CharacterClassElement>[]
interface ParsedCharAlternative {
    readonly isCharacter: true
    readonly raw: string
    readonly char: CharSet
    readonly elements: CharElementArray
}
interface ParsedNonCharAlternative {
    readonly isCharacter: false
    readonly raw: string
    readonly firstChar: FirstConsumedChar
}

/**
 * Returns the string representation of the given character class elements in a character class.
 */
function elementsToCharacterClass(elements: CharElementArray): string {
    // This won't do any optimization.
    // Its ONLY job is to generate a valid character class from the given elements.
    // Optimizations can be done by another rule.

    let result = "["

    elements.forEach((e, i) => {
        switch (e.type) {
            case "Character":
                if (e.raw === "-") {
                    if (i === 0 || i === elements.length - 1) {
                        result += "-"
                    } else {
                        result += "\\-"
                    }
                } else if (e.raw === "^") {
                    if (i === 0) {
                        result += "\\^"
                    } else {
                        result += "^"
                    }
                } else if (e.raw === "]") {
                    result += "\\]"
                } else {
                    result += e.raw
                }
                break

            case "CharacterClassRange":
                if (e.min.raw === "^" && i === 0) {
                    result += `\\^-${e.max.raw}`
                } else {
                    result += `${e.min.raw}-${e.max.raw}`
                }
                break

            case "CharacterSet":
                result += e.raw
                break

            default:
                throw new Error(e)
        }
    })

    result += "]"

    return result
}

/**
 * Given alternatives, this will return an array in which each alternative is categorized by whether it contains only a
 * single character (that can be combined with other characters in a character class) or not.
 */
function categorizeRawAlts(
    alternatives: readonly Alternative[],
    flags: ReadonlyFlags,
): RawAlternative[] {
    return alternatives.map<RawAlternative>((alternative) => {
        if (alternative.elements.length === 1) {
            const element = alternative.elements[0]
            if (
                element.type === "Character" ||
                element.type === "CharacterClass" ||
                element.type === "CharacterSet"
            ) {
                return {
                    isCharacter: true,
                    alternative,
                    element,
                    char: toCharSet(element, flags),
                }
            }
        }
        return {
            isCharacter: false,
            alternative,
        }
    })
}

/**
 * Returns whether the given set contains a character class.
 */
function containsCharacterClass(alts: readonly RawAlternative[]): boolean {
    for (const alt of alts) {
        if (alt.isCharacter && alt.alternative.elements.length === 1) {
            const e = alt.alternative.elements[0]
            if (e.type === "CharacterClass" && !e.negate) {
                return true
            }
        }
    }
    return false
}

/**
 * Tries to convert the given element into character class elements.
 *
 * The returned array may be empty.
 */
function toCharacterClassElement(element: Element): CharElementArray | null {
    if (element.type === "CharacterSet") {
        // normal dot is not possible (it technically is but it's complicated)
        if (element.kind === "any") {
            return null
        }
        return [element]
    } else if (element.type === "CharacterClass") {
        if (element.negate) {
            // we can't (easily) combine negated character classes
            return null
        }
        return element.elements
    } else if (element.type === "Character") {
        return [element]
    }
    return null
}

/**
 * Parses the given raw alternatives.
 */
function parseRawAlts(
    alternatives: readonly RawAlternative[],
    flags: ReadonlyFlags,
): ParsedAlternative[] {
    return alternatives.map<ParsedAlternative>((a) => {
        if (a.isCharacter) {
            const elements = toCharacterClassElement(a.element)
            if (elements) {
                return {
                    isCharacter: true,
                    elements,
                    char: toCharSet(a.element, flags),
                    raw: a.alternative.raw,
                }
            }
        }
        return {
            isCharacter: false,
            firstChar: getFirstConsumedChar(
                a.alternative,
                getMatchingDirection(a.alternative),
                flags,
            ),
            raw: a.alternative.raw,
        }
    })
}

/**
 * Tries to merge as many character alternatives as possible.
 */
function optimizeCharacterAlts(alternatives: ParsedAlternative[]): void {
    /**
     * The actual merge implementation.
     */
    function merge(
        a: ParsedCharAlternative,
        b: ParsedCharAlternative,
    ): ParsedCharAlternative {
        const elements = [...a.elements, ...b.elements]
        return {
            isCharacter: true,
            char: a.char.union(b.char),
            elements,
            raw: elementsToCharacterClass(elements),
        }
    }

    // Here's how the merge algorithm works:
    //
    // We go through all alternatives from left to right. If we find a character alternative A, we will merge all
    // following character alternatives into it until
    // 1) we find a non-character alternative with a first character that can be the empty string,
    // 2) we find a non-character alternative B such that the union of first character in B is the "all" set, or
    // 3) we find a character alternative C such that C is not disjoint with the union of all the first characters
    //    of all non-character alternatives between A and C.
    //
    // This re-ordering approach has the following properties:
    // a) It keeps the order of non-character alternatives and the order of character alternatives intact.
    // b) It runs in O(n) with n being the number of alternatives.

    for (let i = 0; i < alternatives.length - 1; i++) {
        let curr = alternatives[i]
        if (!curr.isCharacter) {
            continue
        }

        /**
         * The union of all character sets a char alternative has to be disjoint with in order to be moved.
         */
        let nonCharTotal: CharSet | undefined = undefined
        for (let j = i + 1; j < alternatives.length; j++) {
            const far = alternatives[j]
            if (far.isCharacter) {
                // character alternative
                if (
                    nonCharTotal === undefined ||
                    far.char.isDisjointWith(nonCharTotal)
                ) {
                    curr = merge(curr, far)
                    alternatives.splice(j, 1)
                    j--
                } else {
                    break
                }
            } else {
                // non-character alternative
                if (!far.firstChar.empty) {
                    if (nonCharTotal === undefined) {
                        nonCharTotal = far.firstChar.char
                    } else {
                        nonCharTotal = nonCharTotal.union(far.firstChar.char)
                    }
                    if (nonCharTotal.isAll) {
                        // Since, it's impossible for any non-empty character set to be disjoint with the "all" set,
                        // we can stop right here.
                        break
                    }
                } else {
                    // this means that the `far` alternative accepts the empty word.
                    // Since we don't know what comes after the alternative, we have to assume that it may be any
                    // character, meaning that `nonCharTotal` will be set to the "all" character set.
                    break
                }
            }
        }

        alternatives[i] = curr
    }
}

/**
 * Return whether all character alternatives are disjoint with each other.
 */
function findNonDisjointAlt(
    alternatives: readonly ParsedAlternative[],
): ParsedCharAlternative | null {
    let total: CharSet | undefined = undefined
    for (const a of alternatives) {
        if (a.isCharacter) {
            if (total === undefined) {
                total = a.char
            } else {
                if (!total.isDisjointWith(a.char)) {
                    return a
                }
                total = total.union(a.char)
            }
        }
    }
    return null
}

/**
 * Returns where the given alternative can accept any character.
 */
function totalIsAll(
    alternatives: readonly RawAlternative[],
    { flags }: RegExpContext,
): boolean {
    let total: CharSet | undefined = undefined
    for (const a of alternatives) {
        if (a.isCharacter) {
            if (total === undefined) {
                total = toCharSet(a.element, flags)
            } else {
                total = total.union(toCharSet(a.element, flags))
            }
        }
    }
    return total !== undefined && total.isAll
}

/**
 * Returns the content prefix and suffix of the given parent node.
 */
function getParentPrefixAndSuffix(
    parent: NodeWithAlternatives,
): [string, string] {
    switch (parent.type) {
        case "Assertion":
            return [
                `(?${parent.kind === "lookahead" ? "" : "<"}${
                    parent.negate ? "!" : "="
                }`,
                ")",
            ]

        case "CapturingGroup":
            if (parent.name !== null) {
                return [`(?<${parent.name}>`, ")"]
            }
            return ["(", ")"]

        case "Group":
            return ["(?:", ")"]

        case "Pattern":
            return ["", ""]

        default:
            throw new Error(parent)
    }
}

/**
 * Returns the minimum position.
 */
function minPos(a: Position, b: Position): Position {
    if (a.column < b.column) {
        return a
    } else if (b.column < a.column) {
        return b
    }
    return a.line < b.line ? a : b
}

/**
 * Returns the maximum position.
 */
function maxPos(a: Position, b: Position): Position {
    if (a.column > b.column) {
        return a
    } else if (b.column > a.column) {
        return b
    }
    return a.line > b.line ? a : b
}

export default createRule("prefer-character-class", {
    meta: {
        docs: {
            description: "enforce using character class",
            category: "Stylistic Issues",
            recommended: true,
        },
        fixable: "code",
        schema: [
            {
                type: "object",
                properties: {
                    minAlternatives: {
                        type: "integer",
                        minimum: 2,
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            unexpected:
                "Unexpected the disjunction of single element alternatives. Use character class '[...]' instead.",
        },
        type: "suggestion", // "problem",
    },
    create(context) {
        const minCharacterAlternatives: number =
            context.options[0]?.minAlternatives ?? 3

        /**
         * Create visitor
         */
        function createVisitor(
            regexpContext: RegExpContext,
        ): RegExpVisitor.Handlers {
            const { node, flags, getRegexpLocation, fixReplaceNode } =
                regexpContext

            /**
             * Replaces the alternatives of the given node with the given
             * new alternatives.
             */
            function fixReplaceAlternatives(
                n: NodeWithAlternatives,
                newAlternatives: string,
            ) {
                const [prefix, suffix] = getParentPrefixAndSuffix(n)
                return fixReplaceNode(n, prefix + newAlternatives + suffix)
            }

            /**
             * Returns the combined location of the locations of the given
             * elements.
             */
            function unionRegexpLocations(elements: Node[]): SourceLocation {
                let { start, end } = getRegexpLocation(elements[0])

                for (let i = 1; i < elements.length; i++) {
                    const other = getRegexpLocation(elements[1])
                    start = minPos(start, other.start)
                    end = maxPos(end, other.end)
                }

                return { start, end }
            }

            // eslint-disable-next-line require-jsdoc -- X
            function process(n: NodeWithAlternatives): void {
                if (n.alternatives.length < 2) {
                    // we need at least 2 alternatives with characters to make this work
                    return
                }

                const alts = categorizeRawAlts(n.alternatives, flags)
                const characterAltsCount = alts.filter(
                    (a) => a.isCharacter,
                ).length

                if (characterAltsCount < 2) {
                    // we need at least 2 character alternatives
                    return
                }

                if (
                    alts.every((a) => a.isCharacter) &&
                    totalIsAll(alts, regexpContext)
                ) {
                    // This is the special case where:
                    // 1) all alternatives are characters,
                    // 2) there are at least 2 alternatives, and
                    // 3) the union of all alternatives accepts all characters.

                    context.report({
                        node,
                        loc: getRegexpLocation(n),
                        messageId: "unexpected",
                        fix: fixReplaceAlternatives(n, "[^]"),
                    })
                    return
                }

                // This is the general case:
                // We have both character and non-character alternatives. The following will try to merge character
                // alternatives and might even re-order alternatives to do so.
                //
                // We will only try to optimize alternatives if
                // 1) there are >= 3 character alternatives, or
                // 2) the characters of the character alternatives are not disjoint, or
                // 3) the union of all character alternatives is the "all" set.

                const parsedAlts = parseRawAlts(alts, flags)

                if (
                    characterAltsCount >= minCharacterAlternatives ||
                    containsCharacterClass(alts) ||
                    totalIsAll(alts, regexpContext) ||
                    findNonDisjointAlt(parsedAlts)
                ) {
                    optimizeCharacterAlts(parsedAlts)

                    if (parsedAlts.length !== alts.length) {
                        // Something (don't know what exactly) was changed

                        // Try to narrow down the range of which alternatives changed as much as possible.
                        // This won't change that we replace the whole element but it will give a lot more precise error
                        // messages for elements with many alternatives.
                        const firstChanged = findIndex(
                            parsedAlts,
                            (a, i) => a.raw !== n.alternatives[i].raw,
                        )
                        const lastChanged = findLastIndex(
                            parsedAlts,
                            (a, i) => {
                                const index =
                                    n.alternatives.length +
                                    i -
                                    parsedAlts.length
                                return a.raw !== n.alternatives[index].raw
                            },
                        )
                        const changedNodes = [
                            n.alternatives[firstChanged],
                            n.alternatives[
                                n.alternatives.length +
                                    lastChanged -
                                    parsedAlts.length
                            ],
                        ]

                        context.report({
                            node,
                            loc: unionRegexpLocations(changedNodes),
                            messageId: "unexpected",
                            fix: fixReplaceAlternatives(
                                n,
                                parsedAlts.map((a) => a.raw).join("|"),
                            ),
                        })
                    }
                }
            }

            return {
                onPatternEnter: process,
                onGroupEnter: process,
                onCapturingGroupEnter: process,
                onAssertionEnter(aNode) {
                    if (
                        aNode.kind === "lookahead" ||
                        aNode.kind === "lookbehind"
                    ) {
                        process(aNode)
                    }
                },
            }
        }

        return defineRegexpVisitor(context, {
            createVisitor,
        })
    },
})
