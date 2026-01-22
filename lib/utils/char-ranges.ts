import type { Rule } from "eslint"
import type { JSONSchema4 } from "json-schema"
import type { CharRange } from "refa"
import type { RegexpSettings } from "../types.ts"
import {
    CP_CAPITAL_A,
    CP_CAPITAL_Z,
    CP_DIGIT_NINE,
    CP_DIGIT_ZERO,
    CP_SMALL_A,
    CP_SMALL_Z,
} from "./unicode.ts"

const ALL_RANGES: readonly CharRange[] = [{ min: 0, max: 0x10ffff }]
const ALPHANUMERIC_RANGES: readonly CharRange[] = [
    // digits 0-9
    { min: CP_DIGIT_ZERO, max: CP_DIGIT_NINE },
    // Latin A-Z
    { min: CP_CAPITAL_A, max: CP_CAPITAL_Z },
    // Latin a-z
    { min: CP_SMALL_A, max: CP_SMALL_Z },
]

/**
 * Returns all character ranges allowed by the user.
 */
export function getAllowedCharRanges(
    allowedByRuleOption: string | readonly string[] | undefined,
    context: Rule.RuleContext,
): readonly CharRange[] {
    let target: string | readonly string[] | undefined =
        allowedByRuleOption ||
        (context.settings.regexp as RegexpSettings)?.allowedCharacterRanges

    if (!target) {
        // defaults to "alphanumeric"
        return ALPHANUMERIC_RANGES
    }

    if (typeof target === "string") {
        target = [target]
    }

    const allowed: CharRange[] = []

    for (const range of target) {
        if (range === "all") {
            return ALL_RANGES
        } else if (range === "alphanumeric") {
            if (target.length === 1) {
                return ALPHANUMERIC_RANGES
            }
            allowed.push(...ALPHANUMERIC_RANGES)
        } else {
            // parse
            const chars = [...range]
            if (chars.length !== 3 || chars[1] !== "-") {
                throw new Error(
                    `Invalid format: The range ${JSON.stringify(
                        range,
                    )} is not of the form \`<char>-<char>\`.`,
                )
            }
            const min = chars[0].codePointAt(0)!
            const max = chars[2].codePointAt(0)!
            allowed.push({ min, max })
        }
    }

    return allowed
}

/**
 * Returns the schema of a value accepted by {@link getAllowedCharRanges}.
 */
export function getAllowedCharValueSchema(): JSONSchema4 {
    return {
        anyOf: [
            { enum: ["all", "alphanumeric"] },
            {
                type: "array",
                items: [{ enum: ["all", "alphanumeric"] }],
                minItems: 1,
                additionalItems: false,
            },
            {
                type: "array",
                items: {
                    anyOf: [
                        { const: "alphanumeric" },
                        {
                            type: "string",
                            pattern:
                                // eslint-disable-next-line regexp/require-unicode-regexp -- The JSON Schema engine does not support the u flag.
                                /^(?:[\ud800-\udbff][\udc00-\udfff]|[^\ud800-\udfff])-(?:[\ud800-\udbff][\udc00-\udfff]|[^\ud800-\udfff])$/
                                    .source,
                        },
                    ],
                },
                uniqueItems: true,
                minItems: 1,
                additionalItems: false,
            },
        ],
    }
}

/**
 * Returns whether the given range is in the given list of ranges.
 */
export function inRange(
    ranges: Iterable<CharRange>,
    min: number,
    max: number = min,
): boolean {
    for (const range of ranges) {
        if (range.min <= min && max <= range.max) {
            return true
        }
    }
    return false
}
