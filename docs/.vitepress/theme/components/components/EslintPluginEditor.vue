<template>
    <eslint-editor
        ref="editor"
        :linter="linter"
        :config="config"
        :code="code"
        class="eslint-code-block"
        :language="language"
        :filename="fileName"
        :dark="dark"
        :format="format"
        :fix="fix"
        @update:code="$emit('update:code', $event)"
        @change="$emit('change', $event)"
    />
</template>

<script>
import EslintEditor from "@ota-meshi/site-kit-eslint-editor-vue"
import { Linter } from "eslint"
import { rules } from "../../../../../lib/all-rules"

export default {
    name: "EslintPluginEditor",
    components: { EslintEditor },
    props: {
        code: {
            type: String,
            default: "",
        },
        fix: {
            type: Boolean,
        },
        rules: {
            type: Object,
            default() {
                return {}
            },
        },
        dark: {
            type: Boolean,
        },
    },
    emits: ["update:code", "change"],

    data() {
        return {
            format: {
                insertSpaces: true,
                tabSize: 2,
            },
        }
    },

    computed: {
        config() {
            return [
                {
                    plugins: {
                        regexp: {
                            rules: Object.fromEntries(
                                rules.map((rule) => [
                                    rule.meta.docs.ruleName,
                                    rule,
                                ]),
                            ),
                        },
                    },
                    languageOptions: {
                        sourceType: "module",
                        ecmaVersion: "latest",
                        globals: {
                            // ES2015 globals
                            ArrayBuffer: false,
                            DataView: false,
                            Float32Array: false,
                            Float64Array: false,
                            Int16Array: false,
                            Int32Array: false,
                            Int8Array: false,
                            Map: false,
                            Promise: false,
                            Proxy: false,
                            Reflect: false,
                            Set: false,
                            Symbol: false,
                            Uint16Array: false,
                            Uint32Array: false,
                            Uint8Array: false,
                            Uint8ClampedArray: false,
                            WeakMap: false,
                            WeakSet: false,
                            // ES2017 globals
                            Atomics: false,
                            SharedArrayBuffer: false,
                        },
                    },
                    rules: this.rules,
                },
            ]
        },
        fileName() {
            return "a.js"
        },
        language() {
            return "javascript"
        },
        linter() {
            const linter = new Linter()
            return linter
        },
    },

    mounted() {
        const editor = this.$refs.editor

        editor.$watch("monaco", () => {
            const { monaco } = editor
            // monaco.languages.j()
            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(
                {
                    validate: false,
                },
            )
            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions(
                {
                    validate: false,
                },
            )
        })
        editor.$watch("codeEditor", () => {
            if (editor.codeEditor) {
                editor.codeEditor.onDidChangeModelDecorations(() =>
                    this.onDidChangeModelDecorations(editor.codeEditor),
                )
            }
        })
        editor.$watch("fixedCodeEditor", () => {
            if (editor.fixedCodeEditor) {
                editor.fixedCodeEditor.onDidChangeModelDecorations(() =>
                    this.onDidChangeModelDecorations(editor.fixedCodeEditor),
                )
            }
        })
    },

    methods: {
        onDidChangeModelDecorations(editor) {
            const { monaco } = this.$refs.editor
            const model = editor.getModel()
            monaco.editor.setModelMarkers(model, "javascript", [])
        },
    },
}
</script>

<style scoped>
.eslint-code-block {
    width: 100%;
    margin: 1em 0;
}
</style>
