<template>
  <transition>
    <div v-if="true" :class="['lose', customClass]" :style="computedModalStyle">
      <h1 v-if="title">{{ title }}</h1>
      <h1 v-if="subtitle" class="small">{{ subtitle }}</h1>

      <!-- 用于显示额外内容的插槽 -->
      <slot name="content"></slot>

      <!-- 用于显示卡片的插槽 -->
      <slot name="cards"></slot>

      <!-- 使用 GameControls 组件替代手动按钮渲染 -->
      <GameControls
        :buttons="gameControlsButtons"
        @undo="handleAction('undo')"
        @goon="handleAction('goon')"
        @auto="handleAction('auto')"
      />
       
       <!-- 底部空白区域，高度等于footerHeight -->
       <!-- <div class="modal-footer-spacer" :style="spacerStyle"></div> -->
    </div>
  </transition>
</template>

<script>
import GameControls from "./GameControls.vue";

export default {
  name: "GameResultModal",
  components: {
    GameControls
  },
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
    },
    gameControlsButtons() {
      // 将原有的按钮配置转换为 GameControls 所需的格式
      return this.buttons.map(button => {
        return {
          label: button.text,
          action: button.action,
          disabled: button.disabled
        };
      });
    }
  },
  methods: {
    handleAction(action) {
      // 根据动作类型找到对应的按钮并执行其回调
      const button = this.buttons.find(btn => btn.action === action);
      
      if (button && button.callback) {
        button.callback();
      } else {
        console.warn(`GameResultModal: No button found with action "${action}" or button lacks callback`);
      }
    }
  }
};
</script>

<style scoped>
@import url("./sum.css");

/* GameControls 组件会自动处理按钮样式，这里不需要额外的样式 */
</style>
