<template>
    <eslint-plugin-editor
        ref="editor"
        :code="code"
        :style="{ height }"
        :rules="rules"
        dark
        :fix="fix"
    />
</template>

<script>
import EslintPluginEditor from "./components/EslintPluginEditor.vue"

export default {
    name: "ESLintCodeBlock",
    components: { EslintPluginEditor },
    props: {
        fix: {
            type: Boolean,
        },
        rules: {
            type: Object,
            default() {
                return {}
            },
        },
    },

    computed: {
        code() {
            return `${this.computeCodeFromSlot(this.$slots.default).trim()}\n`
        },

        height() {
            const lines = this.code.split("\n").length
            return `${Math.max(120, 20 * (1 + lines))}px`
        },
    },

    methods: {
        /**
         * @param {VNode[]} nodes
         * @returns {string}
         */
        computeCodeFromSlot(nodes) {
            if (!Array.isArray(nodes)) {
                return ""
            }
            return nodes
                .map(
                    (node) =>
                        node.text || this.computeCodeFromSlot(node.children)
                )
                .join("")
        },
    },
}
</script>
