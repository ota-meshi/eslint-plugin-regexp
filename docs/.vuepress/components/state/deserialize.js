// eslint-disable-next-line eslint-comments/disable-enable-pair -- demo
/* eslint-disable node/no-unsupported-features/es-syntax -- demo */
import pako from "../../../../node_modules/pako"

/**
 * Deserialize a given serialized string then update this object.
 * @param {string} serializedString A serialized string.
 * @returns {object} The deserialized state.
 */
export function deserializeState(serializedString) {
    const state = {
        code: undefined,
        rules: undefined,
    }

    if (serializedString === "") {
        return state
    }

    try {
        // For backward compatibility, it can address non-compressed data.
        const compressed = !serializedString.startsWith("eyJj")
        const decodedText = window.atob(serializedString)
        const jsonText = compressed
            ? pako.inflate(decodedText, { to: "string" })
            : decodedText
        const json = JSON.parse(jsonText)

        if (typeof json === "object" && json != null) {
            if (typeof json.code === "string") {
                state.code = json.code
            }
            if (typeof json.rules === "object" && json.rules != null) {
                state.rules = {}
                for (const id of Object.keys(json.rules)) {
                    state.rules[id] = json.rules[id] === 2 ? "error" : "off"
                }
            }
        }
    } catch (error) {
        //eslint-disable-next-line no-console -- demo
        console.error(error)
    }

    return state
}
