// eslint-disable-next-line eslint-comments/disable-enable-pair -- demo
/* eslint-disable node/no-unsupported-features/es-syntax -- demo */
import pako from "../../../../node_modules/pako"

/**
 * Get only enabled rules to make the serialized data smaller.
 * @param {object} allRules The rule settings.
 * @returns {object} The rule settings for the enabled rules.
 */
function getEnabledRules(allRules) {
    return Object.keys(allRules).reduce((map, id) => {
        if (allRules[id] === "error") {
            map[id] = 2
        }
        return map
    }, {})
}

/**
 * Serialize a given state as a base64 string.
 * @param {State} state The state to serialize.
 * @returns {string} The serialized string.
 */
export function serializeState(state) {
    const saveData = {
        code: state.code,
        rules: state.rules ? getEnabledRules(state.rules) : undefined,
    }
    const jsonString = JSON.stringify(saveData)
    const compressedString = pako.deflate(jsonString, { to: "string" })
    const base64 =
        (typeof window !== "undefined" && window.btoa(compressedString)) ||
        compressedString

    //eslint-disable-next-line no-console -- demo
    console.log(
        `The compress rate of serialized string: ${(
            (100 * base64.length) /
            jsonString.length
        ).toFixed(1)}% (${jsonString.length}B → ${base64.length}B)`,
    )

    return base64
}
