<template>
    <div class="app">
        <sns-bar />
        <div class="main-content">
            <rules-settings
                ref="settings"
                class="rules-settings"
                :rules.sync="rules"
            />
            <div class="editor-content">
                <pg-editor
                    v-model="code"
                    :rules="rules"
                    class="eslint-playground"
                    @change="onChange"
                />
                <div class="messages">
                    <ol>
                        <li
                            v-for="(msg, i) in messages"
                            :key="
                                msg.line +
                                ':' +
                                msg.column +
                                ':' +
                                msg.ruleId +
                                '@' +
                                i
                            "
                            class="message"
                        >
                            [{{ msg.line }}:{{ msg.column }}]:
                            {{ msg.message }} (<a
                                :href="getURL(msg.ruleId)"
                                target="_blank"
                            >
                                {{ msg.ruleId }} </a
                            >)
                        </li>
                    </ol>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import * as coreRules from "../../../node_modules/eslint4b/dist/core-rules"
import plugin from "../../.."
import PgEditor from "./components/PgEditor.vue"
import RulesSettings from "./components/RulesSettings.vue"
import SnsBar from "./components/SnsBar.vue"
import { deserializeState, serializeState } from "./state"
import { DEFAULT_RULES_CONFIG } from "./rules"

const DEFAULT_CODE = require("!!raw-loader!./demo/demo-code.js").default

const ruleURLs = {}
for (const k of Object.keys(plugin.rules)) {
    const rule = plugin.rules[k]
    ruleURLs[rule.meta.docs.ruleId] = rule.meta.docs.url
}
for (const k of Object.keys(coreRules)) {
    const rule = coreRules[k]
    ruleURLs[k] = rule.meta.docs.url
}

export default {
    name: "PlaygroundBlock",
    components: { PgEditor, RulesSettings, SnsBar },
    data() {
        const serializedString =
            (typeof window !== "undefined" && window.location.hash.slice(1)) ||
            ""
        const state = deserializeState(serializedString)
        return {
            code: state.code || DEFAULT_CODE,
            rules: state.rules || Object.assign({}, DEFAULT_RULES_CONFIG),
            messages: [],
        }
    },
    computed: {
        serializedString() {
            const defaultCode = DEFAULT_CODE
            const defaultRules = DEFAULT_RULES_CONFIG
            const code = defaultCode === this.code ? undefined : this.code
            const rules = equalsRules(defaultRules, this.rules)
                ? undefined
                : this.rules
            const serializedString = serializeState({
                code,
                rules,
            })
            return serializedString
        },
    },
    watch: {
        serializedString(serializedString) {
            if (typeof window !== "undefined") {
                window.location.replace(`#${serializedString}`)
            }
        },
    },
    mounted() {
        if (typeof window !== "undefined") {
            window.addEventListener("hashchange", this.onUrlHashChange)
        }
    },
    beforeDestroey() {
        if (typeof window !== "undefined") {
            window.removeEventListener("hashchange", this.onUrlHashChange)
        }
    },
    methods: {
        onChange({ messages }) {
            this.messages = messages
        },
        getURL(ruleId) {
            return ruleURLs[ruleId] || ""
        },
        onUrlHashChange() {
            const serializedString =
                (typeof window !== "undefined" &&
                    window.location.hash.slice(1)) ||
                ""
            if (serializedString !== this.serializedString) {
                const state = deserializeState(serializedString)
                this.code = state.code || DEFAULT_CODE
                this.rules =
                    state.rules || Object.assign({}, DEFAULT_RULES_CONFIG)
                this.script = state.script
            }
        },
    },
}

function equalsRules(a, b) {
    const akeys = Object.keys(a).filter((k) => a[k] !== "off")
    const bkeys = Object.keys(b).filter((k) => b[k] !== "off")
    if (akeys.length !== bkeys.length) {
        return false
    }

    for (const k of akeys) {
        if (a[k] !== b[k]) {
            return false
        }
    }
    return true
}
</script>
<style scoped>
.main-content {
    display: flex;
    flex-wrap: wrap;
    height: calc(100% - 100px);
    border: 1px solid #cfd4db;
    background-color: #282c34;
    color: #f8c555;
}

.main-content > .rules-settings {
    height: 100%;
    overflow: auto;
    width: 25%;
    box-sizing: border-box;
}

.main-content > .editor-content {
    height: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    border-left: 1px solid #cfd4db;
}

.main-content > .editor-content > .eslint-playground {
    height: 100%;
    width: 100%;
    box-sizing: border-box;
    padding: 3px;
}

.main-content > .editor-content > .messages {
    height: 30%;
    width: 100%;
    overflow: auto;
    box-sizing: border-box;
    border-top: 1px solid #cfd4db;
    padding: 8px;
    font-size: 12px;
}
</style>
