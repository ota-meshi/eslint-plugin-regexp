import type { CharSet } from "refa"
import type { ToCharSetElement } from "regexp-ast-analysis"
import { toCharSet } from "regexp-ast-analysis"
import type { Element } from "regexpp/ast"
import type { RegExpContext } from "."

/**
 * A class that expresses a pattern that simply consumes characters, as a tree.
 *
 * e.g
 *
 * 'abc' ->
 * {
 *   charSet: a,
 *   next: [
 *     {
 *       charSet: b,
 *       next: [
 *         {
 *           charSet: c,
 *           next: []
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * 'ab(c|d)' ->
 * {
 *   charSet: a,
 *   next: [
 *     {
 *       charSet: b,
 *       next: [
 *         {
 *           charSet: c,
 *           next: []
 *         },
 *         {
 *           charSet: d,
 *           next: []
 *         }
 *       ]
 *     }
 *   ]
 * }
 *
 * 'a(b|c)d' ->
 * {
 *   charSet: a,
 *   next: [
 *     {
 *       charSet: b,
 *       next: [
 *         {
 *           charSet: d,
 *           next: []
 *         }
 *       ]
 *     },
 *     {
 *       charSet: c,
 *       next: [
 *         {
 *           charSet: d,
 *           next: []
 *         }
 *       ]
 *     },
 *   ]
 * }
 */
export class CharSetTree {
    private readonly element: ToCharSetElement

    public readonly charSet: CharSet

    private readonly baseNextList: CharSetTree[]

    private cacheNext: CharSetTree[] | null = null

    private range?: { min: number; max: number }

    private endOfPattern: boolean

    private readonly cacheIncludes = new Map<CharSetTree, boolean>()

    public constructor(data: {
        element: ToCharSetElement
        charSet: CharSet
        baseNextList?: CharSetTree[]
        range?: { min: number; max: number }
        endOfPattern?: boolean
    }) {
        this.element = data.element
        this.charSet = data.charSet
        this.baseNextList = data.baseNextList || []
        this.range = data.range
        this.endOfPattern = data.endOfPattern || false
    }

    public get next(): readonly CharSetTree[] {
        if (this.range) {
            if (this.cacheNext) {
                return this.cacheNext
            }
            if (this.range.min > 1 || this.range.max > 1) {
                const nextMin = Math.max(this.range.min - 1, 1)
                const tree = new CharSetTree({
                    element: this.element,
                    charSet: this.charSet,
                    baseNextList: this.baseNextList,
                    range: {
                        min: nextMin,
                        max: this.range.max - 1,
                    },
                    endOfPattern: this.endOfPattern,
                })
                const results: CharSetTree[] = [tree]
                if (nextMin === 1) {
                    results.push(...this.baseNextList)
                }
                return (this.cacheNext = results)
            }
        }
        return this.baseNextList
    }

    public get end(): boolean {
        if (this.range) {
            if (this.range.min > 1) {
                return false
            }
        }
        return this.endOfPattern
    }

    public get raw(): string {
        return this.element.raw
    }

    /**
     * Checks whether the given tree is included.
     */
    public includes(target: CharSetTree): boolean {
        const cache = this.cacheIncludes.get(target)
        if (cache != null) {
            return cache
        }
        const result = includesWithoutCache(this)
        this.cacheIncludes.set(target, result)
        return result

        /** Without cache */
        function includesWithoutCache(self: CharSetTree) {
            if (self.charSet.isDisjointWith(target.charSet)) {
                return self.next.some((n) => n.includes(target))
            }
            return self.startsWith(target)
        }
    }

    public startsWith(target: CharSetTree): boolean {
        if (this.charSet.isDisjointWith(target.charSet)) {
            return false
        }

        // match start
        if (target.end) {
            return true
        }
        for (const tree of this.next) {
            for (const t of target.next) {
                if (tree.startsWith(t)) {
                    return true
                }
            }
        }
        return false
    }

    public addNextInternal(next: CharSetTree): void {
        this.baseNextList.push(next)
    }

    public setRangeInternal(min: number, max: number): void {
        this.range = { min, max }
    }

    public markAsEndOfPatternInternal(): void {
        this.endOfPattern = true
    }
}

export class CharSetTreeRoot {
    public readonly elements: readonly CharSetTree[]

    private constructor(elements: CharSetTree[]) {
        this.elements = elements
    }

    /**
     * Get the CharSetTreeRoot from the given element. Returns null if it is not a simple pattern.
     */
    public static fromElement(
        element: Element,
        regexpContext: RegExpContext,
    ): CharSetTreeRoot | null {
        return CharSetTreeRoot.fromElements([element], regexpContext)
    }

    /**
     * Get the CharSetTreeRoot from the given elements. Returns null if it is not a simple pattern.
     */
    public static fromElements(
        baseElements: Element[],
        regexpContext: RegExpContext,
    ): CharSetTreeRoot | null {
        const result = elementsToList(baseElements)
        if (!result) {
            // has complex pattern
            return null
        }
        result.markAsEndOfPattern()
        return new CharSetTreeRoot(result.list)

        /** Elements to list */
        function elementsToList(
            elements: Element[],
        ): { list: CharSetTree[]; markAsEndOfPattern: () => void } | null {
            type State = {
                readonly addNext: (tree: CharSetTree) => void
                readonly markAsEndOfPattern: () => void
            }
            const list: CharSetTree[] = []
            let state: State = {
                addNext: (t) => list.push(t),
                markAsEndOfPattern: () => {
                    // noop
                },
            }
            for (const element of elements) {
                if (
                    element.type === "Character" ||
                    element.type === "CharacterClass" ||
                    element.type === "CharacterSet"
                ) {
                    const tree = toTree(element)
                    state.addNext(tree)
                    state = {
                        addNext: (t) => tree.addNextInternal(t),
                        markAsEndOfPattern: () =>
                            tree.markAsEndOfPatternInternal(),
                    }
                } else if (
                    element.type === "CapturingGroup" ||
                    element.type === "Group"
                ) {
                    const groupList: CharSetTree[] = []
                    for (const alt of element.alternatives) {
                        const altList = elementsToList(alt.elements)
                        if (!altList) {
                            // has complex pattern
                            return null
                        }
                        groupList.push(...altList.list)
                    }
                    groupList.forEach(state.addNext)
                    state = {
                        addNext: (t) =>
                            groupList.forEach((tree) =>
                                tree.addNextInternal(t),
                            ),
                        markAsEndOfPattern: () =>
                            groupList.forEach((tree) =>
                                tree.markAsEndOfPatternInternal(),
                            ),
                    }
                } else if (element.type === "Quantifier") {
                    if (element.max === 0) {
                        continue
                    }
                    if (element.max > 10) {
                        // consider has complex pattern
                        return null
                    }
                    const elementList = elementsToList([element.element])
                    if (!elementList) {
                        // has complex pattern
                        return null
                    }
                    for (const tree of elementList.list) {
                        state.addNext(tree)
                        tree.setRangeInternal(element.min, element.max)
                    }

                    const newState: State = {
                        addNext: (t) =>
                            elementList.list.forEach((tree) =>
                                tree.addNextInternal(t),
                            ),
                        markAsEndOfPattern: () =>
                            elementList.list.forEach((tree) =>
                                tree.markAsEndOfPatternInternal(),
                            ),
                    }

                    if (element.min === 0) {
                        const selfState = state
                        state = {
                            addNext(t) {
                                selfState.addNext(t)
                                newState.addNext(t)
                            },
                            markAsEndOfPattern() {
                                selfState.markAsEndOfPattern()
                                newState.markAsEndOfPattern()
                            },
                        }
                    } else {
                        state = newState
                    }
                } else {
                    // has complex pattern
                    return null
                }
            }

            return {
                list,
                markAsEndOfPattern: state.markAsEndOfPattern,
            }
        }

        /** Element to tree */
        function toTree(element: ToCharSetElement): CharSetTree {
            return new CharSetTree({
                element,
                charSet: toCharSet(element, regexpContext.flags),
            })
        }
    }

    /**
     * Checks whether the given tree is included.
     */
    public includes(target: CharSetTreeRoot): boolean {
        for (const tree of this.elements) {
            for (const t of target.elements) {
                if (tree.includes(t)) {
                    return true
                }
            }
        }
        return false
    }
}
