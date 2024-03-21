import type { Word, JS } from "refa"

function findMin<T>(
    array: readonly T[],
    compare: (a: T, b: T) => number,
): T | undefined {
    if (array.length === 0) {
        return undefined
    }

    let min = array[0]
    for (let i = 1; i < array.length; i++) {
        const item = array[i]
        if (compare(item, min) < 0) {
            min = item
        }
    }
    return min
}

function compareWords(a: Word, b: Word): number {
    const l = Math.min(a.length, b.length)
    for (let i = 0; i < l; i++) {
        const diff = a[i] - b[i]
        if (diff !== 0) {
            return diff
        }
    }
    return a.length - b.length
}

/**
 * Returns the lexicographically smallest word in the given set or `undefined` if the set is empty.
 */
export function getLexicographicallySmallest(
    set: JS.UnicodeSet,
): Word | undefined {
    if (set.accept.isEmpty) {
        return set.chars.isEmpty ? undefined : [set.chars.ranges[0].min]
    }

    const words = set.accept.wordSets.map(
        (w): Word => w.map((c) => c.ranges[0].min),
    )
    return findMin(words, compareWords)
}

/**
 * Returns the lexicographically smallest word in the given set or `undefined` if the set is empty.
 */
export function getLexicographicallySmallestInConcatenation(
    elements: readonly JS.UnicodeSet[],
): Word | undefined {
    if (elements.length === 1) {
        return getLexicographicallySmallest(elements[0])
    }

    let smallest: Word = []
    for (let i = elements.length - 1; i >= 0; i--) {
        const set = elements[i]
        if (set.isEmpty) {
            return undefined
        } else if (set.accept.isEmpty) {
            smallest.unshift(set.chars.ranges[0].min)
        } else {
            let words = [
                ...(set.chars.isEmpty ? [] : [[set.chars]]),
                ...set.accept.wordSets,
            ].map((w): Word => w.map((c) => c.ranges[0].min))
            // we only have to consider the lexicographically smallest words with unique length
            const seenLengths = new Set<number>()
            words = words.sort(compareWords).filter((w) => {
                if (seenLengths.has(w.length)) {
                    return false
                }
                seenLengths.add(w.length)
                return true
            })

            smallest = findMin(
                // eslint-disable-next-line no-loop-func -- x
                words.map((w): Word => [...w, ...smallest]),
                compareWords,
            )!
        }
    }
    return smallest
}
