<template>
    <eslint-plugin-editor
        ref="editor"
        v-model="code"
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
    data() {
        return {
            code: "",
            height: "",
        }
    },
    mounted() {
        this.code = `${computeCodeFromSlot(this.$slots.default).trim()}\n`
        const lines = this.code.split("\n").length
        this.height = `${Math.max(120, 20 * (1 + lines))}px`
    },
}

/**
 * @param {VNode[]} nodes
 * @returns {string}
 */
function computeCodeFromSlot(nodes) {
    if (!Array.isArray(nodes)) {
        return ""
    }
    return nodes
        .map((node) => node.text || computeCodeFromSlot(node.children))
        .join("")
}
</script>
