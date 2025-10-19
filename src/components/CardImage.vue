<template>
  <div 
    v-bind="$attrs" 
    ref="rootElement"
    :data-card-id="cardId"
    :card-id="cardId"
  >
    <div v-if="!hide && !imageLoaded" class="card-placeholder">
      {{ cardPlaceholderText }}
    </div>
    <img 
      v-if="!hide" 
      :src="imageSrc" 
      :data-card-id="cardId" 
      :style="{ display: imageLoaded ? 'block' : 'none' }"
      @load="imageLoaded = true"
    />
    <slot v-else></slot>
  </div>
</template>

<script>
import { CARD_TYPES, CARD_POINTS, getCardPlaceholderText, getCardImageSrc } from '../utils/cardUtils.js';

export default {
  name: "CardImage",
  // 启用inheritAttrs，这样属性会直接传递到DOM元素上
  inheritAttrs: true,
  data() {
    return {
      types: CARD_TYPES,
      point: CARD_POINTS,
      imageLoaded: false,
    }
  },
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
      return getCardImageSrc(this.cardId);
    },
    cardPlaceholderText() {
      return getCardPlaceholderText(this.cardId);
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
.card-placeholder {
  background-color: #dfcdc3;
  color: #719192;
}
</style>
