import pako from "pako"

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
        // For backward compatibility
        const newCompressed = serializedString.startsWith("eJ")
        const json = (
            newCompressed
                ? () => {
                      const compressedString = window.atob(serializedString)
                      const uint8Arr = pako.inflate(
                          Uint8Array.from(compressedString, (c) =>
                              c.charCodeAt(0),
                          ),
                      )
                      const jsonText = new TextDecoder().decode(uint8Arr)
                      return JSON.parse(jsonText)
                  }
                : () => {
                      const decodedText = window.atob(serializedString)
                      try {
                          const jsonText = pako.inflate(decodedText, {
                              to: "string",
                          })
                          return JSON.parse(jsonText)
                      } catch {
                          return JSON.parse(decodedText)
                      }
                  }
        )()

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
