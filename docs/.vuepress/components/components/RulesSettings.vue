<template>
    <div class="rules-settings">
        <ul class="categories">
            <li
                v-for="category in categories"
                :key="category.title"
                class="category"
                :class="category.classes"
            >
                <div class="category-title-wrapper">
                    <label class="category-title">
                        <input
                            :checked="
                                category.rules.every((rule) =>
                                    isErrorState(rule.ruleId)
                                )
                            "
                            type="checkbox"
                            :indeterminate.prop="
                                !category.rules.every((rule) =>
                                    isErrorState(rule.ruleId)
                                ) &&
                                !category.rules.every(
                                    (rule) => !isErrorState(rule.ruleId)
                                )
                            "
                            @input="onAllClick(category, $event)"
                        />
                        {{ category.title }}
                    </label>
                </div>

                <ul class="rules">
                    <li
                        v-for="rule in category.rules"
                        :key="rule.ruleId"
                        class="rule"
                        :class="rule.classes"
                    >
                        <label>
                            <input
                                :checked="isErrorState(rule.ruleId)"
                                type="checkbox"
                                @input="onClick(rule.ruleId, $event)"
                            />
                            {{ rule.ruleId }}
                        </label>
                        <a :href="rule.url" target="_blank"
                            ><svg
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                                x="0px"
                                y="0px"
                                viewBox="0 0 100 100"
                                width="15"
                                height="15"
                                class="icon outbound"
                            >
                                <path
                                    fill="currentColor"
                                    d="M18.8,85.1h56l0,0c2.2,0,4-1.8,4-4v-32h-8v28h-48v-48h28v-8h-32l0,0c-2.2,0-4,1.8-4,4v56C14.8,83.3,16.6,85.1,18.8,85.1z"
                                />
                                <polygon
                                    fill="currentColor"
                                    points="45.7,48.7 51.3,54.3 77.2,28.5 77.2,37.2 85.2,37.2 85.2,14.9 62.8,14.9 62.8,22.9 71.5,22.9"
                                /></svg
                        ></a>
                    </li>
                </ul>
            </li>
        </ul>
    </div>
</template>

<script>
import { categories } from "../rules"

export default {
    name: "RulesSettings",
    props: {
        rules: {
            type: Object,
            required: true,
        },
    },
    data() {
        return {
            categories,
        }
    },
    watch: {},
    methods: {
        onAllClick(category, e) {
            const rules = Object.assign({}, this.rules)
            for (const rule of category.rules) {
                if (e.target.checked) {
                    rules[rule.ruleId] = "error"
                } else {
                    delete rules[rule.ruleId]
                }
            }
            this.$emit("update:rules", rules)
        },
        onClick(ruleId, e) {
            const rules = Object.assign({}, this.rules)
            if (e.target.checked) {
                rules[ruleId] = "error"
            } else {
                delete rules[ruleId]
            }
            this.$emit("update:rules", rules)
        },
        isErrorState(ruleId) {
            return this.rules[ruleId] === "error" || this.rules[ruleId] === 2
        },
    },
}
</script>

<style scoped>
.categories {
    font-size: 14px;
}

.category-title {
    font-size: 14px;
    font-weight: bold;
}

.rules {
    padding-left: 0;
}

.rule {
    font-size: 12px;
    line-height: 24px;
    vertical-align: top;
    list-style-type: none;
    display: flex;
}

.rule a {
    margin-left: auto;
}

a {
    text-decoration: none;
}

.category {
    color: #fff;
}

.eslint-plugin-regexp__category {
    color: #f8c555;
}
</style>
