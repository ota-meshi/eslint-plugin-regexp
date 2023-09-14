import type {
    Concatenation,
    Element,
    Expression,
    NoParent,
    CharRange,
} from "refa"
import { JS } from "refa"
import type { AST } from "@eslint-community/regexpp"

export type NestedAlternative = AST.Alternative | AST.CharacterClassElement

function assertNever(value: never): never {
    throw new Error(`Invalid value: ${value}`)
}

class Context {
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

export class PartialParser {
    private readonly parser: JS.Parser

    private readonly options: JS.ParseOptions

    private readonly nativeCache = new WeakMap<
        JS.ParsableElement,
        NoParent<Element>
    >()

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

    private parseElement(
        element: AST.Element,
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
                return this.nativeParseElement(element)

            case "CharacterClass":
                return this.parseCharacterClass(element, context)

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
                // FIXME: TS Error
                // @ts-expect-error -- FIXME
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

        if (context.alternative.type === "CharacterClassRange") {
            const range: CharRange = {
                min: context.alternative.min.value,
                max: context.alternative.max.value,
            }
            return {
                type: "CharacterClass",
                characters: JS.createCharSet([range], this.parser.flags),
            }
        }
        // FIXME: TS Error
        // @ts-expect-error -- FIXME
        return this.nativeParseElement(context.alternative)
    }

    private nativeParseElement(element: JS.ParsableElement): NoParent<Element> {
        let cached = this.nativeCache.get(element)
        if (!cached) {
            cached = this.nativeParseElementUncached(element)
            this.nativeCache.set(element, cached)
        }
        return cached
    }

    private nativeParseElementUncached(
        element: JS.ParsableElement,
    ): NoParent<Element> {
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
