<template>
  <transition>
    <div v-if="true" :class="['lose', customClass]" :style="modalStyle">
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
  },
};
</script>

<style scoped>
@import url("./sum.css");

.modal-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.modal-button {
  cursor: pointer;
}
</style>
