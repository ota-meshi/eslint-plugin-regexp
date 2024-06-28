<template>
    <div class="app">
        <sns-bar />
        <div class="main-content">
            <rules-settings
                ref="settings"
                v-model:rules="rules"
                class="rules-settings"
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
                            :class="getRule(msg.ruleId)?.classes"
                        >
                            [{{ msg.line }}:{{ msg.column }}]:
                            {{ msg.message }} (<a
                                :href="getRule(msg.ruleId)?.url"
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
import PgEditor from "./components/PgEditor.vue"
import RulesSettings from "./components/RulesSettings.vue"
import SnsBar from "./components/SnsBar.vue"
import { DEFAULT_RULES_CONFIG, getRule } from "./rules/index.js"
import { deserializeState, serializeState } from "./state/index.js"

const DEFAULT_CODE = String.raw`
/eslint-plugin[-regexp]/u

// Optimize and Simplify

var re = /[0-9][^\s]/iu;
var re = /[\w\p{ASCII}]/u;
var re = /^\w[_A-Z\d]*\e{1,}/i;

var re = /(?:\w|\d){1,}/;
var re = /(?<!\w)a+(?=$)/mi;
var re = /[\s\S]#[\0-\uFFFF]/yi;
var re = /\d*\w(?:[a-z_]|\d+)*/im;

// Detect problems

var re = /\1(a)/;
var re = RegExp('[a-z]+' + '|Foo', 'i');
`.trim()

export default {
    name: "PlaygroundBlock",
    components: { PgEditor, RulesSettings, SnsBar },
    data() {
        return {
            code: DEFAULT_CODE,
            rules: Object.assign({}, DEFAULT_RULES_CONFIG),
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
            if (
                typeof window !== "undefined" &&
                serializedString !== window.location.hash.slice(1) &&
                !this._initializing
            ) {
                history.replaceState(null, "", `#${serializedString}`)
            }
        },
    },
    mounted() {
        if (typeof window !== "undefined") {
            window.addEventListener("hashchange", this.processUrlHashChange)
        }
        const serializedString =
            (typeof window !== "undefined" && window.location.hash.slice(1)) ||
            ""
        if (serializedString) {
            this._initializing = true
            this.rules = {}
            this.$nextTick().then(() => {
                this._initializing = false
                this.processUrlHashChange()
            })
        }
    },
    beforeUnmount() {
        if (typeof window !== "undefined") {
            window.removeEventListener("hashchange", this.processUrlHashChange)
        }
    },
    methods: {
        onChange({ messages }) {
            this.messages = messages
        },
        getRule(ruleId) {
            return getRule(ruleId)
        },
        processUrlHashChange() {
            const serializedString =
                (typeof window !== "undefined" &&
                    window.location.hash.slice(1)) ||
                ""
            if (!serializedString && this.serializedString) {
                history.replaceState(null, "", `#${this.serializedString}`)
            } else if (serializedString !== this.serializedString) {
                const state = deserializeState(serializedString)
                this.code = state.code || DEFAULT_CODE
                this.rules =
                    state.rules || Object.assign({}, DEFAULT_RULES_CONFIG)
                return true
            }
            return false
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
.app {
    height: calc(100vh - 70px);
}

.main-content {
    display: flex;
    flex-wrap: wrap;
    height: calc(100% - 100px);
    border: 1px solid #cfd4db;
    background-color: #282c34;
    color: #fff;
}

.main-content > .rules-settings {
    height: 100%;
    overflow: auto;
    width: 30%;
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

.eslint-core-rule a {
    color: #8080f2;
}

.eslint-plugin-regexp-rule a {
    color: #f8c555;
}
</style>
