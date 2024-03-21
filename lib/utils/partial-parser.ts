import type { AST } from "@eslint-community/regexpp"
import type {
    Concatenation,
    Element,
    Expression,
    NoParent,
    CharRange,
} from "refa"
import { JS } from "refa"
import { assertNever } from "./util"

export type NestedAlternative =
    | AST.Alternative
    | AST.CharacterClassElement
    | AST.StringAlternative

class Context {
    /**
     * The ancestor nodes of the alternative + the alternative itself.
     */
    public readonly ancestors: ReadonlySet<AST.Node>

    public readonly alternative: NestedAlternative

    public constructor(alternative: NestedAlternative) {
        this.alternative = alternative

        const ancestors = new Set<AST.Node>()
        for (let n: AST.Node | null = alternative; n; n = n.parent) {
            ancestors.add(n)
        }
        this.ancestors = ancestors
    }
}

type Parsable = JS.ParsableElement | AST.CharacterClassElement

export class PartialParser {
    private readonly parser: JS.Parser

    private readonly options: JS.ParseOptions

    private readonly nativeCache = new WeakMap<Parsable, NoParent<Element>>()

    public constructor(parser: JS.Parser, options: JS.ParseOptions = {}) {
        this.parser = parser
        this.options = options
    }

    /**
     * Parses the given element while guaranteeing that all paths of the returned
     * expression go through the given alternative.
     */
    public parse(
        node: JS.ParsableElement,
        alternative: NestedAlternative,
    ): NoParent<Expression> {
        switch (node.type) {
            case "Pattern":
                return {
                    type: "Expression",
                    alternatives: this.parseAlternatives(
                        node.alternatives,
                        new Context(alternative),
                    ),
                }

            case "Alternative":
                return {
                    type: "Expression",
                    alternatives: [
                        this.parseAlternative(node, new Context(alternative)),
                    ],
                }

            default:
                return {
                    type: "Expression",
                    alternatives: [
                        {
                            type: "Concatenation",
                            elements: [
                                this.parseElement(
                                    node,
                                    new Context(alternative),
                                ),
                            ],
                        },
                    ],
                }
        }
    }

    private parseAlternatives(
        alternatives: readonly AST.Alternative[],
        context: Context,
    ): NoParent<Concatenation>[] {
        const ancestor = alternatives.find((a) => context.ancestors.has(a))
        if (ancestor) {
            return [this.parseAlternative(ancestor, context)]
        }

        const result: NoParent<Concatenation>[] = []
        for (const a of alternatives) {
            result.push(
                ...this.parser.parseElement(a, this.options).expression
                    .alternatives,
            )
        }
        return result
    }

    private parseAlternative(
        alternative: AST.Alternative,
        context: Context,
    ): NoParent<Concatenation> {
        return {
            type: "Concatenation",
            elements: alternative.elements.map((e) =>
                this.parseElement(e, context),
            ),
        }
    }

    private parseStringAlternatives(
        alternatives: readonly AST.StringAlternative[],
        context: Context,
    ): NoParent<Concatenation>[] {
        const ancestor = alternatives.find((a) => context.ancestors.has(a))
        if (ancestor) {
            return [this.parseStringAlternative(ancestor)]
        }

        return alternatives.map((a) => this.parseStringAlternative(a))
    }

    private parseStringAlternative(
        alternative: AST.StringAlternative,
    ): NoParent<Concatenation> {
        return {
            type: "Concatenation",
            elements: alternative.elements.map((e) =>
                this.nativeParseElement(e),
            ),
        }
    }

    private parseElement(
        element:
            | AST.Element
            | AST.CharacterClassRange
            | AST.ClassStringDisjunction,
        context: Context,
    ): NoParent<Element> {
        if (!context.ancestors.has(element)) {
            return this.nativeParseElement(element)
        }

        switch (element.type) {
            case "Assertion":
            case "Backreference":
            case "Character":
            case "CharacterSet":
            case "ExpressionCharacterClass":
                return this.nativeParseElement(element)

            case "CharacterClassRange":
                if (context.alternative === element.min) {
                    return this.nativeParseElement(context.alternative)
                } else if (context.alternative === element.max) {
                    return this.nativeParseElement(context.alternative)
                }
                return this.nativeParseElement(element)

            case "CharacterClass":
                return this.parseCharacterClass(element, context)

            case "ClassStringDisjunction":
                return {
                    type: "Alternation",
                    alternatives: this.parseStringAlternatives(
                        element.alternatives,
                        context,
                    ),
                }

            case "Group":
            case "CapturingGroup":
                return {
                    type: "Alternation",
                    alternatives: this.parseAlternatives(
                        element.alternatives,
                        context,
                    ),
                }

            case "Quantifier": {
                const alternatives: NoParent<Concatenation>[] =
                    element.element.type === "Group" ||
                    element.element.type === "CapturingGroup"
                        ? this.parseAlternatives(
                              element.element.alternatives,
                              context,
                          )
                        : [
                              {
                                  type: "Concatenation",
                                  elements: [
                                      this.parseElement(
                                          element.element,
                                          context,
                                      ),
                                  ],
                              },
                          ]

                return {
                    type: "Quantifier",
                    min: element.min,
                    max: element.max,
                    lazy: !element.greedy,
                    alternatives,
                }
            }

            default:
                throw assertNever(element)
        }
    }

    private parseCharacterClass(
        cc: AST.CharacterClass,
        context: Context,
    ): NoParent<Element> {
        if (
            cc.negate ||
            !context.ancestors.has(cc) ||
            context.alternative.type === "Alternative"
        ) {
            return this.nativeParseElement(cc)
        }

        for (const e of cc.elements) {
            if (context.ancestors.has(e)) {
                return this.parseElement(e, context)
            }
        }

        // this means that cc === context.alternative
        return this.nativeParseElement(cc)
    }

    private nativeParseElement(element: Parsable): NoParent<Element> {
        let cached = this.nativeCache.get(element)
        if (!cached) {
            cached = this.nativeParseElementUncached(element)
            this.nativeCache.set(element, cached)
        }
        return cached
    }

    private nativeParseElementUncached(element: Parsable): NoParent<Element> {
        if (element.type === "CharacterClassRange") {
            const range: CharRange = {
                min: element.min.value,
                max: element.max.value,
            }
            return {
                type: "CharacterClass",
                characters: JS.createCharSet([range], this.parser.flags),
            }
        } else if (element.type === "ClassStringDisjunction") {
            return {
                type: "Alternation",
                alternatives: element.alternatives.map((a) =>
                    this.parseStringAlternative(a),
                ),
            }
        }

        const { expression } = this.parser.parseElement(element, this.options)

        if (expression.alternatives.length === 1) {
            const elements = expression.alternatives[0].elements
            if (elements.length === 1) {
                return elements[0]
            }
        }

        return {
            type: "Alternation",
            alternatives: expression.alternatives,
        }
    }
}
