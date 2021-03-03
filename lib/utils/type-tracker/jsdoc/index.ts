import type { Rule, SourceCode, AST } from "eslint"
import type * as ES from "estree"
import { isCommentToken } from "eslint-utils"
import * as commentParser from "comment-parser"
import type { Spec } from "comment-parser/lib/primitives"
// @ts-expect-error -- no type
import * as jsdocTypeParser from "jsdoctypeparser"
import type { JSDocTypeNode } from "./jsdoctypeparser-ast"

type ParsedComment = ReturnType<typeof commentParser.parse>[number]

export class JSDocParams {
    private readonly params: JSDocParam[] = []

    public isEmpty(): boolean {
        return this.params.length === 0
    }

    public add(paths: string[], param: Spec): void {
        const name = paths.shift()
        if (paths.length > 0) {
            for (const rootParam of this.params) {
                if (rootParam.name === name) {
                    rootParam.add(paths, param)
                    return
                }
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-use-before-define -- ignore
        this.params.push(new JSDocParam(name || null, param))
    }

    public get(
        paths: { name: string | null; index: number | null }[],
    ): Spec | null {
        const { name, index } = paths.shift()!
        if (name) {
            for (const param of this.params) {
                if (param.name === name) {
                    return paths.length ? param.get(paths) : param.param
                }
            }
        }
        if (index != null) {
            const param = this.params[index]
            if (param) {
                return paths.length ? param.get(paths) : param.param
            }
        }
        return null
    }
}
export class JSDocParam extends JSDocParams {
    public readonly name: string | null

    public readonly param: Spec

    public constructor(name: string | null, param: Spec) {
        super()
        this.name = name
        this.param = param
    }
}

export class JSDoc {
    private readonly parsed: ParsedComment

    private params: JSDocParams | null = null

    public constructor(parsed: ParsedComment) {
        this.parsed = parsed
    }

    public getTag(name: string): Spec | null {
        for (const tag of this.genTags(name)) {
            return tag
        }
        return null
    }

    public parseParams(): JSDocParams {
        if (this.params) {
            return this.params
        }
        const params = (this.params = new JSDocParams())
        for (const param of this.genTags("param")) {
            const paths: string[] = (param.name || "").split(/\./gu) // todo check for brackets.
            params.add(paths, param)
        }
        return params
    }

    private *genTags(name: string): IterableIterator<Spec> {
        for (const tag of this.parsed.tags) {
            if (tag.tag === name) {
                yield tag
            }
        }
    }
}

/**
 * Get the JSDoc comment for a given expression node.
 */
export function getJSDoc(
    node: ES.Expression | ES.VariableDeclarator | ES.FunctionDeclaration,
    context: Rule.RuleContext,
): JSDoc | null {
    const sourceCode = context.getSourceCode()
    const jsdoc = findJSDocComment(node, sourceCode)
    if (jsdoc) {
        try {
            const parsed = commentParser.parse(`/*${jsdoc.value}*/`)[0]
            return new JSDoc(parsed)
        } catch {
            // ignore
        }
    }
    return null
}

/**
 * Finds a JSDoc comment for the given node.
 */
function findJSDocComment(node: ES.Node, sourceCode: SourceCode) {
    let target: ES.Node | AST.Token | ES.Comment = node
    let tokenBefore: AST.Token | ES.Comment | null = null

    while (target) {
        tokenBefore = sourceCode.getTokenBefore(target, {
            includeComments: true,
        }) as AST.Token | ES.Comment
        if (!tokenBefore) {
            return null
        }
        if (tokenBefore.type === "Keyword") {
            if (
                tokenBefore.value === "const" ||
                tokenBefore.value === "let" ||
                tokenBefore.value === "var"
            ) {
                target = tokenBefore
                continue
            }
        }
        if (isCommentToken(tokenBefore)) {
            if (tokenBefore.type === "Line") {
                target = tokenBefore
                continue
            }
        }
        break
    }

    if (
        tokenBefore &&
        tokenBefore.type === "Block" &&
        tokenBefore.value.startsWith("*")
    ) {
        return tokenBefore
    }

    return null
}

/**
 * Parse JSDoc type text
 */
export function parseTypeText(text: string): JSDocTypeNode | null {
    try {
        const ast: JSDocTypeNode = jsdocTypeParser.parse(text)
        return ast
    } catch {
        return null
    }
}
