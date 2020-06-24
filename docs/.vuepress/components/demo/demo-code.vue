<template>
    <div class="vue-input" :class="classes">
        <div class="vue-input__input-wrapper">
            <label> {{ label }} </label>
            <input class="vue-input__input" value="value" @input="$emit('input', $event.target.value)">
        </div>
        <div>
            <slot name="trailing"></slot>
        </div>
    </div>
</template>
<style scoped>
/* ✗ BAD */
.vue-imput, /* It's typo? */
.vue-input__label, /* You may have forgotten to assign a class name. */
.vue-input__input-wrapper > vue-input__input, /* Missing dot. */

/* ✓ GOOD */
.vue-input,
.vue-input__input,
.vue-input > .vue-input__input-wrapper > .vue-input__input,
.vue-input >>> .child-classes,
.vue-input--disabled { }
</style>

<script>
export default {
    computed: {
        classes() {
            return {
                "vue-input--disabled": this.disabled,
            }
        },
    },
}
</script>
