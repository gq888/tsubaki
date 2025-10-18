<template>
  <img :src="imageSrc" v-bind="$attrs" />
</template>

<script>
export default {
  name: "CardImage",
  inheritAttrs: false,
  props: {
    cardId: {
      type: [Number, String],
      required: true,
    },
  },
  computed: {
    imageSrc() {
      return `./static/${this.cardId}.webp`;
    },
  },
};
</script>

<style scoped>
@import url("./sum.css");
</style>
