type BaseReplacementElement<T> =
    | BaseCharacterElement<T>
    | BaseDollarElement<T>
    | BaseReferenceElement<T>

type BaseCharacterElement<T> = {
    type: "CharacterElement"
    value: string
} & T
type BaseDollarElement<T> = {
    type: "DollarElement"
    kind: "$" | "&" | "`" | "'"
} & T
type BaseReferenceElement<T> = {
    type: "ReferenceElement"
    ref: number | string
    refText: string
} & T

export function parseReplacementsForString(
    text: string,
): BaseReplacementElement<object>[] {
    return baseParseReplacements<object, { value: string }>(
        [...text].map((s) => ({ value: s })),
        () => ({}),
    )
}

export function baseParseReplacements<T, E extends { value: string }>(
    chars: E[],
    getData: (start: E, end: E) => T,
): BaseReplacementElement<T>[] {
    const elements: BaseReplacementElement<T>[] = []
    let token
    let index = 0
    while ((token = chars[index++])) {
        if (token.value === "$") {
            const next = chars[index++]
            if (next) {
                if (
                    next.value === "$" ||
                    next.value === "&" ||
                    next.value === "`" ||
                    next.value === "'"
                ) {
                    elements.push({
                        type: "DollarElement",
                        kind: next.value,
                        ...getData(token, next),
                    })
                    continue
                }
                if (parseNumberRef(token, next)) {
                    continue
                }
                if (parseNamedRef(token, next)) {
                    continue
                }
                index--
            }
        }
        elements.push({
            type: "CharacterElement",
            value: token.value,
            ...getData(token, token),
        })
    }

    return elements

    function parseNumberRef(dollarToken: E, startToken: E): boolean {
        if (!/^\d$/u.test(startToken.value)) {
            return false
        }
        if (startToken.value === "0") {
            // Check 01 - 09. Ignore 10 - 99 as they may be used in 1 - 9 and cannot be checked.
            const next = chars[index++]
            if (next) {
                if (/^[1-9]$/u.test(next.value)) {
                    const ref = Number(next.value)
                    elements.push({
                        type: "ReferenceElement",
                        ref,
                        refText: startToken.value + next.value,
                        ...getData(dollarToken, next),
                    })
                    return true
                }
                index--
            }
            return false
        }
        const ref = Number(startToken.value)
        elements.push({
            type: "ReferenceElement",
            ref,
            refText: startToken.value,
            ...getData(dollarToken, startToken),
        })
        return true
    }

    function parseNamedRef(dollarToken: E, startToken: E): boolean {
        if (startToken.value !== "<") {
            return false
        }

        const startIndex = index
        let t
        while ((t = chars[index++])) {
            if (t.value === ">") {
                const refChars = chars.slice(startIndex, index - 1)
                const ref = refChars.map((c) => c.value).join("")
                elements.push({
                    type: "ReferenceElement",
                    ref,
                    refText: ref,
                    ...getData(dollarToken, t),
                })
                return true
            }
        }
        index = startIndex
        return false
    }
}
