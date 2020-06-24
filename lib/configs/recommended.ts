import { recommendedConfig } from "../utils/rules"

export = {
    plugins: ["regexp"],
    rules: {
        "no-control-regex": "error",
        "no-invalid-regexp": "error",
        "no-regex-spaces": "error",
        "no-misleading-character-class": "error",
        "prefer-regex-literals": "error",
        "no-useless-backreference": "error",
        // "prefer-named-capture-group": "error", // modern
        // "require-unicode-regexp": "error", // modern
        ...recommendedConfig(),
    },
}
