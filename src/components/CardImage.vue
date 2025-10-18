<template>
  <div 
    v-bind="$attrs" 
    ref="rootElement"
    :data-card-id="cardId"
    :card-id="cardId"
  >
    <img v-if="!hide" :src="imageSrc" :data-card-id="cardId" />
    <slot v-else></slot>
  </div>
</template>

<script>
export default {
  name: "CardImage",
  // 启用inheritAttrs，这样属性会直接传递到DOM元素上
  inheritAttrs: true,
  props: {
    cardId: {
      type: [Number, String],
      required: false,
      default: "bg",
    },
    hide: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    imageSrc() {
      return `./static/${this.cardId}.webp`;
    },
  },
  mounted() {
    // 将根元素暴露给指令使用
    if (this.$refs.rootElement) {
      this.$el._cardImageRoot = this.$refs.rootElement;
      // 确保DOM元素上有card-id属性
      this.$el.setAttribute('card-id', this.cardId);
      this.$el.dataset.cardId = this.cardId;
    }
  },
};
</script>

<style scoped>
@import url("./sum.css");
</style>
