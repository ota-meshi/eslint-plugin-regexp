import { Tokenizer } from "./tokenizer.ts"
import type { Token } from "./tokens.ts"

export type StringLiteral = {
    tokens: Token[]
    value: string
    range: [number, number]
}
export type EcmaVersion =
    | 3
    | 5
    | 6
    | 2015
    | 7
    | 2016
    | 8
    | 2017
    | 9
    | 2018
    | 10
    | 2019
    | 11
    | 2020
    | 12
    | 2021

export function parseStringLiteral(
    source: string,
    option?: {
        start?: number
        end?: number
        ecmaVersion?: EcmaVersion
    },
): StringLiteral {
    const startIndex = option?.start ?? 0
    const cp = source.codePointAt(startIndex)
    const ecmaVersion = option?.ecmaVersion ?? Infinity
    const tokenizer = new Tokenizer(source, {
        start: startIndex + 1,
        end: option?.end,
        ecmaVersion:
            ecmaVersion >= 6 && ecmaVersion < 2015
                ? ecmaVersion + 2009
                : ecmaVersion,
    })
    const tokens = [...tokenizer.parseTokens(cp)]
    return {
        tokens,
        get value() {
            return tokens.map((t) => t.value).join("")
        },
        range: [startIndex, tokenizer.pos],
    }
}

export function* parseStringTokens(
    source: string,
    option?: {
        start?: number
        end?: number
        ecmaVersion?: EcmaVersion
    },
): Generator<Token> {
    const startIndex = option?.start ?? 0
    const ecmaVersion = option?.ecmaVersion ?? Infinity
    const tokenizer = new Tokenizer(source, {
        start: startIndex,
        end: option?.end,
        ecmaVersion:
            ecmaVersion >= 6 && ecmaVersion < 2015
                ? ecmaVersion + 2009
                : ecmaVersion,
    })
    yield* tokenizer.parseTokens()
}
