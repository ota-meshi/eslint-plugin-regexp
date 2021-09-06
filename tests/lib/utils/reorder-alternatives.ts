// eslint-disable-next-line eslint-comments/disable-enable-pair -- x
/* eslint-disable func-style, no-restricted-imports -- x */
import chai from "chai"
import { RegExpParser, visitRegExpAST } from "regexpp"
import type { Alternative, Node } from "regexpp/ast"
import type { OptionalMatchingDirection } from "../../../lib/utils/reorder-alternatives"
import {
    canReorder,
    getDeterminismEqClasses,
} from "../../../lib/utils/reorder-alternatives"
import type { RegExpContext, ToCharSet } from "../../../lib/utils"
import * as RAA from "regexp-ast-analysis"
import { jestSnapshotPlugin } from "mocha-chai-jest-snapshot"

chai.use(jestSnapshotPlugin())

describe(canReorder.name, function () {
    describe("reorder all", function () {
        const valid: RegExp[] = [
            /0|1|2|3/,
            /0|0|1|1|2|3|44/,
            /\b(a|b|aa|\w|\d)\b/,
            /foo|bar/,
            /(int|integer)\b/,
        ]
        const invalid: RegExp[] = [/int|integer/]

        function canReorderAll(regex: RegExp): boolean {
            const context = getFakeRegExpContext(regex)

            let all = true

            visitParents(context.patternAst, (parent) => {
                if (!canReorder(parent.alternatives, context)) {
                    all = false
                }
            })

            return all
        }

        for (const regex of valid) {
            it(regex.toString(), function () {
                chai.assert.equal(canReorderAll(regex), true)
            })
        }

        for (const regex of invalid) {
            it(regex.toString(), function () {
                chai.assert.equal(canReorderAll(regex), false)
            })
        }
    })
})

describe(getDeterminismEqClasses.name, function () {
    const directionIndependentRegexes: RegExp[] = [
        /abc/,
        /a|b|c|d/,
        /a|aa|aaa|b|bb|bbb/,
        /a|b|c|d|[a-c]/,
        /ab|bc|ca/,
        /\bcircle|ellipse|closest|farthest|contain|cover\b/,
        /\p{L}|[a-z]|\d+/u,
        /(int|integer)\b/,
        /device_ios_(?:ipad|ipad_retina|iphone|iphone5|iphone6|iphone6plus|iphone_retina|unknown)\b/,

        // this is an interesting example because a naive algorithm might
        // take 2^20 steps
        /aaaaaaaaaaaaaaaaaaaa|bbbbbbbbbbbbbbbbbbbb|[^][^][^][^][^][^][^][^][^][^][^][^][^][^][^][^][^][^][^][^]/,
        /a{20}|b{20}|[^]{20}/,
        /a{20}c|b{20}a|[^]{20}b/,
        /(?:script|source)_foo|sample/,
    ]
    const directionalRegexes: RegExp[] = [
        /abc|a/,
        /aa\d+|ba\d+/,
        /a.*b|b.*b|c.*a/,
        /a.*b|b.*b|b.*a/,
        /int|integer/,
        /a{20}c|b{20}a|[^]{19}b/,

        /anchor_1_x|anchor_1_y|anchor_2_x|anchor_2_y|reaction_force_x|reaction_force_y|reaction_torque|motor_speed|angle|motor_torque|max_motor_torque|translation|speed|motor_force|max_motor_force|length_1|length_2|damping_ratio|frequency|lower_angle_limit|upper_angle_limit|angle_limits|max_length|max_torque|max_force/,
        />>=?|<<=?|->|--|\+\+|&&|\|\||[?:~]|<=>|[-+*/%&|^!=<>]=?|\b(?:and|and_eq|bitand|bitor|not|not_eq|or|or_eq|xor|xor_eq)\b/,
    ]

    type AllEqClasses = Record<
        OptionalMatchingDirection,
        Record<string, string[]>
    >

    function getAllEqClasses(regex: RegExp): AllEqClasses {
        const directions: OptionalMatchingDirection[] = [
            "ltr",
            "rtl",
            "unknown",
        ]
        const result: AllEqClasses = { ltr: {}, rtl: {}, unknown: {} }

        const context = getFakeRegExpContext(regex)

        visitParents(context.patternAst, (parent) => {
            for (const dir of directions) {
                const classes = getDeterminismEqClasses(
                    parent.alternatives,
                    dir,
                    context,
                )

                chai.assert.equal(
                    classes.reduce((p, c) => p + c.length, 0),
                    parent.alternatives.length,
                    "expected the number of returned alternatives to be the same as the number of input alternatives.",
                )

                // eslint-disable-next-line @typescript-eslint/require-array-sort-compare -- x
                result[dir][parent.raw] = classes
                    .map((eq) =>
                        [...eq]
                            .sort((a, b) => a.start - b.start)
                            .map((a) => a.raw)
                            .join("|"),
                    )
                    .sort()
            }
        })

        return result
    }

    for (const regex of directionIndependentRegexes) {
        it(regex.toString(), function () {
            const actual = getAllEqClasses(regex)
            chai.assert.deepEqual(
                actual.ltr,
                actual.unknown,
                "expected ltr to be equal to unknown direction",
            )
            chai.assert.deepEqual(
                actual.rtl,
                actual.unknown,
                "expected rtl to be equal to unknown direction",
            )
            chai.expect(actual.ltr).toMatchSnapshot()
        })
    }

    for (const regex of directionalRegexes) {
        it(regex.toString(), function () {
            const actual = getAllEqClasses(regex)
            chai.expect(actual).toMatchSnapshot()
        })
    }
})

function visitParents(
    root: Node,
    onParent: (parent: Alternative["parent"]) => void,
): void {
    visitRegExpAST(root, {
        onAssertionEnter(node) {
            if (node.kind === "lookahead" || node.kind === "lookbehind") {
                onParent(node)
            }
        },
        onCapturingGroupEnter: onParent,
        onGroupEnter: onParent,
        onPatternEnter: onParent,
    })
}

function getFakeRegExpContext(regex: RegExp): RegExpContext {
    const literal = new RegExpParser().parseLiteral(regex.toString())

    const toCharSet: ToCharSet = (node, flags) => {
        return RAA.toCharSet(node, flags ?? literal.flags)
    }

    const partialContext: Partial<RegExpContext> = {
        pattern: regex.source,
        patternAst: literal.pattern,
        flags: literal.flags,
        flagsString: regex.flags,

        toCharSet,
    }

    return partialContext as RegExpContext
}
