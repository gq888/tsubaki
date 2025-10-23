<template>
  <div class="btns">
    <input
      v-for="(button, index) in displayButtons"
      :key="button.id || index"
      type="button"
      :value="button.label"
      :disabled="button.disabled"
      @click="handleButtonClick(button.action)"
    />
  </div>
</template>

<script>


export default {
  name: "GameControls",
  props: {
    // 使用数组定义按钮配置，现在是主要的按钮配置方式
    buttons: {
      type: Array,
      default: () => [],
    },

    // 仅保留必要的状态属性
    undoDisabled: {
      type: Boolean,
      default: false,
    },
    restartDisabled: {
      type: Boolean,
      default: false,
    },
    stepDisabled: {
      type: Boolean,
      default: false,
    },
    autoDisabled: {
      type: Boolean,
      default: false,
    },
    isAutoRunning: {
      type: Boolean,
      default: false,
    },
  },
  

  
  computed: {
    // 直接使用buttons属性，不再需要复杂的计算逻辑
    displayButtons() {
      return this.buttons;
    },
  },
  methods: {
    // 统一的按钮点击事件处理
    handleButtonClick(action) {
      this.$emit(action);
    },
  },
  

};
</script>

<style scoped>
@import url("./sum.css");

/* 保持与原样式一致的按钮容器样式 */
.btns {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  flex-wrap: wrap;
}

/* 覆盖原有input样式以确保按钮一致性 */
.btns input {
  margin: 0.5rem 0;
  color: #3c4245;
  padding: 0.25rem 0.625rem;
  border: 0.0625rem solid #dfcdc3;
  background-color: #dfcdc3;
  cursor: pointer;
  font-size: 0.875rem;
}

.btns input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
