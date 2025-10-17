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
    // 使用数组定义按钮配置，优先级高于单独的show属性
    buttons: {
      type: Array,
      default: () => [],
    },

    // 以下属性保持向后兼容性
    showUndo: {
      type: Boolean,
      default: true,
    },
    showRestart: {
      type: Boolean,
      default: true,
    },
    showStep: {
      type: Boolean,
      default: true,
    },
    showAuto: {
      type: Boolean,
      default: true,
    },

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
    // 根据buttons数组或单独的show属性生成要显示的按钮列表
    displayButtons() {
      // 如果提供了buttons数组，则使用它
      if (this.buttons && this.buttons.length > 0) {
        return this.buttons;
      }

      // 否则使用单独的show属性生成默认按钮列表（保持向后兼容）
      const defaultButtons = [];

      if (this.showUndo) {
        defaultButtons.push({
          label: "◀︎",
          action: "undo",
          disabled: this.undoDisabled,
        });
      }

      if (this.showRestart) {
        defaultButtons.push({
          label: "RESTART",
          action: "goon",
          disabled: this.restartDisabled,
        });
      }

      if (this.showAuto) {
        defaultButtons.push({
          label: this.isAutoRunning ? "STOP" : "AUTO",
          action: "auto",
          disabled: this.autoDisabled,
        });
      }

      if (this.showStep) {
        defaultButtons.push({
          label: "►",
          action: "step",
          disabled: this.stepDisabled,
        });
      }

      return defaultButtons;
    },
  },
  methods: {
    // 统一的按钮点击事件处理
    handleButtonClick(action) {
      this.$emit(action);
    },

    // 保留原有方法以保持兼容性
    undo() {
      this.$emit("undo");
    },
    goon() {
      this.$emit("goon");
    },
    stepFn() {
      this.$emit("step");
    },
    pass() {
      this.$emit("auto");
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
