<script setup>
import { useData } from "vitepress"
import DefaultTheme from "vitepress/theme"
import { computed } from "vue"
const BaseLayout = DefaultTheme.Layout
const { frontmatter } = useData()
const pageClass = computed(() => {
    return frontmatter.value.pageClass || ""
})
</script>

<template>
    <div :class="pageClass">
        <BaseLayout />
    </div>
</template>

<style scoped>
:deep(.package-status img) {
    display: inline;
}

/* Rule Page */
.rule-details :deep(.main h1 + blockquote ::first-letter) {
    text-transform: uppercase;
}

/* Playground */
.playground :deep(.VPDoc.has-aside .content-container),
.playground :deep(.VPDoc:not(.has-sidebar) .content),
.playground :deep(.VPDoc:not(.has-sidebar) .container) {
    max-width: none;
}

.playground :deep(.aside) {
    display: none;
}
</style>
