<template>
  <transition>
    <div v-if="true" :class="['lose', customClass]" :style="computedModalStyle">
      <h1 v-if="title">{{ title }}</h1>
      <h1 v-if="subtitle" class="small">{{ subtitle }}</h1>

      <!-- 用于显示额外内容的插槽 -->
      <slot name="content"></slot>

      <!-- 用于显示卡片的插槽 -->
      <slot name="cards"></slot>

      <div class="modal-buttons">
        <input
          v-for="(button, index) in buttons"
          :key="index"
          type="button"
          :value="button.text"
          @click="button.callback"
          :disabled="button.disabled"
          class="modal-button"
        />
      </div>
       
       <!-- 底部空白区域，高度等于footerHeight -->
       <!-- <div class="modal-footer-spacer" :style="spacerStyle"></div> -->
    </div>
  </transition>
</template>

<script>
export default {
  name: "GameResultModal",
  props: {
    title: {
      type: String,
      default: "",
    },
    subtitle: {
      type: String,
      default: "",
    },
    buttons: {
      type: Array,
      default: () => [],
    },
    modalStyle: {
      type: Object,
      default: () => ({}),
    },
    customClass: {
      type: String,
      default: "",
    },
    footerHeight: {
      type: Number,
      default: 50, // 默认50px，转换为rem是3.125rem
    },
  },
  computed: {
    computedModalStyle() {
      return {
        ...this.modalStyle,
        paddingBottom: `${this.footerHeight / 16}rem`
      };
    },
    spacerStyle() {
      return {
        height: `${this.footerHeight / 16}rem`
      };
    }
  }
};
</script>

<style scoped>
@import url("./sum.css");

.modal-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.modal-button {
  cursor: pointer;
}
</style>
