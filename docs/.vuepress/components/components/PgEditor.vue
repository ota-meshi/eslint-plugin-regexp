<template>
    <eslint-plugin-editor
        ref="editor"
        :code="value"
        :rules="rules"
        fix
        dark
        @input="$emit('input', $event)"
        @change="$emit('change', $event)"
    />
</template>

<script>
import EslintPluginEditor from "./EslintPluginEditor.vue"

export default {
    name: "PgEditor",
    components: { EslintPluginEditor },
    props: {
        value: {
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
}
</script>
