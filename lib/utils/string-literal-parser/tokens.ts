export interface BaseToken {
    type: string
    value: string
    range: [number, number]
}
export type Token = CharacterToken | EscapeToken
export interface CharacterToken extends BaseToken {
    type: "CharacterToken"
}
export interface EscapeToken extends BaseToken {
    type: "EscapeToken"
    kind: "special" | "eol" | "unicode" | "hex" | "octal" | "char"
}
