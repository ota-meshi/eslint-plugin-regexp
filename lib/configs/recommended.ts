import { recommendedConfig } from "../utils/rules"

export default {
    plugins: ["regexp"],
    rules: {
        "no-control-regex": "error",
        "no-invalid-regexp": "error",
        "no-misleading-character-class": "error",
        "no-regex-spaces": "error",
        "no-useless-backreference": "error",
        "prefer-regex-literals": "error",
        // "prefer-named-capture-group": "error", // modern
        // "require-unicode-regexp": "error", // modern
        ...recommendedConfig(),
    },
}
