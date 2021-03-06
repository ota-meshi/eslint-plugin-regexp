// eslint-disable-next-line eslint-comments/disable-enable-pair -- ignore
/* eslint-disable @typescript-eslint/naming-convention -- ignore */
// https://github.com/jsdoctypeparser/jsdoctypeparser#ast-specifications
// https://jsdoctypeparser.github.io/

export type JSDocTypeNode =
    | NAME
    | MEMBER
    | INNER_MEMBER
    | INSTANCE_MEMBER
    | UNION
    | INTERSECTION
    | RECORD
    | GENERIC
    | FUNCTION
    | OPTIONAL
    | NULLABLE
    | NOT_NULLABLE
    | VARIADIC
    | MODULE
    | FILE_PATH
    | EXTERNAL
    | STRING_VALUE
    | NUMBER_VALUE
    | ANY
    | UNKNOWN
    | PARENTHESIS

// e.g. @type {name}
type NAME = {
    type: "NAME"
    name: string
}
// e.g. @type {owner.name}
type MEMBER = {
    type: "MEMBER"
    name: string
    quoteStyle: "none"
    owner: JSDocTypeNode
    hasEventPrefix: boolean
}
// e.g. @type {owner~name}
type INNER_MEMBER = {
    type: "INNER_MEMBER"
    name: string
    quoteStyle: "none"
    owner: JSDocTypeNode
    hasEventPrefix: boolean
}
// e.g. @type {owner#name}
type INSTANCE_MEMBER = {
    type: "INSTANCE_MEMBER"
    name: string
    quoteStyle: "none"
    owner: JSDocTypeNode
    hasEventPrefix: boolean
}
type UNION = {
    type: "UNION"
    left: JSDocTypeNode
    right: JSDocTypeNode
}
type INTERSECTION = {
    type: "INTERSECTION"
    left: JSDocTypeNode
    right: JSDocTypeNode
}
type RECORD = {
    type: "RECORD"
    entries: RECORD_ENTRY[]
}
type RECORD_ENTRY = {
    type: "RECORD_ENTRY"
    key: string
    value: JSDocTypeNode | null
}
type GENERIC = {
    type: "GENERIC"
    subject: JSDocTypeNode
    objects: JSDocTypeNode[]
    meta: {
        syntax: "ANGLE_BRACKET" | "ANGLE_BRACKET_WITH_DOT" | "SQUARE_BRACKET"
    }
}
type FUNCTION = {
    type: "FUNCTION"
    params: JSDocTypeNode[]
    returns: JSDocTypeNode | null
    new: JSDocTypeNode | null
    this: JSDocTypeNode | null
}
type OPTIONAL = {
    type: "OPTIONAL"
    value: JSDocTypeNode
    meta: {
        syntax: "SUFFIX_EQUALS_SIGN"
    }
}
type NULLABLE = {
    type: "NULLABLE"
    value: JSDocTypeNode
    meta: {
        syntax: "PREFIX_QUESTION_MARK" | "SUFFIX_QUESTION_MARK"
    }
}
type NOT_NULLABLE = {
    type: "NOT_NULLABLE"
    value: JSDocTypeNode
    meta: {
        syntax: "PREFIX_BANG" | "SUFFIX_BANG"
    }
}
type VARIADIC = {
    type: "VARIADIC"
    value: JSDocTypeNode | null
    meta: {
        syntax: "PREFIX_DOTS" | "SUFFIX_DOTS" | "ONLY_DOTS"
    }
}
type MODULE = {
    type: "MODULE"
    value: JSDocTypeNode
}
type FILE_PATH = {
    type: "FILE_PATH"
    path: string
}
type EXTERNAL = {
    type: "EXTERNAL"
    value: JSDocTypeNode
}
type STRING_VALUE = {
    type: "STRING_VALUE"
    quoteStyle: "double"
    string: string
}
type NUMBER_VALUE = {
    type: "NUMBER_VALUE"
    number: string
}
type ANY = {
    type: "ANY"
}
type UNKNOWN = {
    type: "UNKNOWN"
}
type PARENTHESIS = {
    type: "PARENTHESIS"
    value: JSDocTypeNode
}
