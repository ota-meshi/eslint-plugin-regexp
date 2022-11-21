<template>
    <eslint-plugin-editor
        ref="editor"
        :code="modelValue"
        :rules="rules"
        fix
        dark
        @update:code="$emit('update:modelValue', $event)"
        @change="$emit('change', $event)"
    />
</template>

<script>
import EslintPluginEditor from "./EslintPluginEditor.vue"

export default {
    name: "PgEditor",
    components: { EslintPluginEditor },
    props: {
        modelValue: {
            type: String,
            default: "",
        },
        rules: {
            type: Object,
            default: () => ({}),
        },
        messages: {
            type: Array,
            default: () => [],
        },
    },
    emits: ["change", "update:modelValue"],
}
</script>
