<template>
  <div class="game-layout-container">
    <!-- 切换按钮 -->
    <button 
      class="toggle-header-btn" 
      @click="toggleHeader"
      :title="isHeaderExpanded ? '收起导航和标题' : '展开导航和标题'"
    >
      {{ isHeaderExpanded ? '▲' : '▼' }}
    </button>

    <!-- Fixed 导航栏 -->
    <transition name="slide-down">
      <div 
        v-show="isHeaderExpanded" 
        ref="gameNav" 
        class="game-nav"
      >
        GAMES: &nbsp;
        <router-link to="/month">🌛</router-link>
        &nbsp; / &nbsp;
        <router-link to="/fish">🐟</router-link>
        &nbsp; / &nbsp;
        <router-link to="/blackjack">♠️</router-link>
        &nbsp; / &nbsp;
        <router-link to="/point24">24</router-link>
        &nbsp; / &nbsp;
        <router-link to="/Tortoise">🐢</router-link>
        &nbsp; / &nbsp;
        <router-link to="/Sort">🐗</router-link>
        &nbsp; / &nbsp;
        <router-link to="/Pairs">🐰</router-link>
        &nbsp; / &nbsp;
        <router-link to="/Spider">🕷️</router-link>
        &nbsp; / &nbsp;
        <router-link to="/Chess">♟️</router-link>
      </div>
    </transition>

    <!-- Fixed 标题和顶部控制区 -->
    <transition name="slide-down">
      <div 
        v-show="isHeaderExpanded" 
        ref="gameHeader" 
        class="game-header"
        :style="{ top: navHeight + 'px' }"
      >
        <h1>{{ title }}</h1>
        
        <!-- 顶部控制按钮插槽 -->
        <slot name="top-controls">
          <GameControls
            v-if="showTopControls"
            v-bind="gameControlsConfig"
            @undo="$emit('undo')"
            @goon="$emit('goon')"
            @step="$emit('step')"
            @auto="$emit('auto')"
          />
        </slot>
      </div>
    </transition>

    <!-- 可滚动的游戏内容区域 -->
    <div 
      class="game-content-wrapper" 
      :style="contentWrapperStyle"
    >
      <slot name="game-content"></slot>
    </div>

    <!-- Fixed 底部控制按钮 -->
    <div 
      ref="gameFooter"
      class="game-footer" 
      v-if="showBottomControls || $slots['bottom-controls']"
    >
      <slot name="bottom-controls">
        <GameControls
          v-if="showBottomControls"
          v-bind="gameControlsConfig"
          @undo="$emit('undo')"
          @goon="$emit('goon')"
          @step="$emit('step')"
          @auto="$emit('auto')"
        />
      </slot>
    </div>

    <!-- 游戏结果模态框插槽 -->
    <slot name="result-modals">
      <!-- Win Modal -->
      <GameResultModal
        v-if="winflag"
        :title="winTitle || 'U WIN!'"
        :subtitle="winSubtitle"
        :buttons="winButtons || defaultWinButtons"
        :modalStyle="winModalStyle"
        :customClass="winCustomClass"
      >
        <template v-if="$slots['win-content']" v-slot:content>
          <slot name="win-content"></slot>
        </template>
        <template v-if="$slots['win-cards']" v-slot:cards>
          <slot name="win-cards"></slot>
        </template>
      </GameResultModal>

      <!-- Lose Modal -->
      <GameResultModal
        v-if="loseflag"
        :title="loseTitle || 'U LOSE'"
        :subtitle="loseSubtitle"
        :buttons="loseButtons || defaultLoseButtons"
        :modalStyle="loseModalStyle || { backgroundColor: 'rgba(0,0,0,0.5)' }"
        :customClass="loseCustomClass"
      >
        <template v-if="$slots['lose-content']" v-slot:content>
          <slot name="lose-content"></slot>
        </template>
        <template v-if="$slots['lose-cards']" v-slot:cards>
          <slot name="lose-cards"></slot>
        </template>
      </GameResultModal>

      <!-- Draw Modal -->
      <GameResultModal
        v-if="drawflag"
        :title="drawTitle || 'DRAW GAME'"
        :subtitle="drawSubtitle"
        :buttons="drawButtons || defaultDrawButtons"
        :modalStyle="drawModalStyle || { backgroundColor: 'rgba(0,0,0,0.5)' }"
        :customClass="drawCustomClass"
      >
        <template v-if="$slots['draw-content']" v-slot:content>
          <slot name="draw-content"></slot>
        </template>
        <template v-if="$slots['draw-cards']" v-slot:cards>
          <slot name="draw-cards"></slot>
        </template>
      </GameResultModal>
    </slot>
  </div>
</template>

<script>
import GameControls from "./GameControls.vue";
import GameResultModal from "./GameResultModal.vue";

export default {
  name: "GameLayout",
  components: {
    GameControls,
    GameResultModal,
  },
  data() {
    return {
      isHeaderExpanded: true,
      navHeight: 0,
      headerHeight: 0,
      footerHeight: 0,
      resizeObserver: null,
    };
  },
  props: {
    // 基础属性
    title: {
      type: String,
      default: "",
    },
    containerStyle: {
      type: Object,
      default: () => ({ width: "100%" }),
    },

    // 控制按钮相关
    showTopControls: {
      type: Boolean,
      default: false,
    },
    showBottomControls: {
      type: Boolean,
      default: false,
    },
    gameControlsConfig: {
      type: Object,
      default: () => ({}),
    },

    // 游戏状态标志
    winflag: {
      type: Boolean,
      default: false,
    },
    loseflag: {
      type: Boolean,
      default: false,
    },
    drawflag: {
      type: Boolean,
      default: false,
    },

    // Win Modal 配置
    winTitle: String,
    winSubtitle: String,
    winButtons: Array,
    winModalStyle: Object,
    winCustomClass: String,

    // Lose Modal 配置
    loseTitle: String,
    loseSubtitle: String,
    loseButtons: Array,
    loseModalStyle: Object,
    loseCustomClass: String,

    // Draw Modal 配置
    drawTitle: String,
    drawSubtitle: String,
    drawButtons: Array,
    drawModalStyle: Object,
    drawCustomClass: String,

    // 其他游戏相关属性
    step: {
      type: Number,
      default: 0,
    },
  },
  computed: {
    contentWrapperStyle() {
      const topPadding = this.isHeaderExpanded 
        ? this.navHeight + this.headerHeight + 20 
        : 0;
      const bottomPadding = this.footerHeight + 20;
      
      return {
        ...this.containerStyle,
        paddingTop: `${topPadding}px`,
        paddingBottom: `${bottomPadding}px`,
      };
    },
    defaultWinButtons() {
      return [
        {
          text: "GO ON",
          callback: () => this.$emit("goon"),
          disabled: false,
        },
      ];
    },
    defaultLoseButtons() {
      return [
        {
          text: "RESTART",
          callback: () => this.$emit("goon"),
          disabled: false,
        },
        {
          text: "UNDO",
          callback: () => this.$emit("undo"),
          disabled: this.step <= 0,
        },
      ];
    },
    defaultDrawButtons() {
      return [
        {
          text: "RESTART",
          callback: () => this.$emit("goon"),
          disabled: false,
        },
        {
          text: "UNDO",
          callback: () => this.$emit("undo"),
          disabled: this.step <= 0,
        },
      ];
    },
  },
  mounted() {
    this.updateHeights();
    this.setupResizeObserver();
  },
  beforeUnmount() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  },
  methods: {
    toggleHeader() {
      this.isHeaderExpanded = !this.isHeaderExpanded;
      this.$nextTick(() => {
        this.updateHeights();
      });
    },
    updateHeights() {
      this.$nextTick(() => {
        if (this.$refs.gameNav) {
          this.navHeight = this.$refs.gameNav.offsetHeight;
        }
        if (this.$refs.gameHeader) {
          this.headerHeight = this.$refs.gameHeader.offsetHeight;
        }
        if (this.$refs.gameFooter) {
          this.footerHeight = this.$refs.gameFooter.offsetHeight;
        }
      });
    },
    setupResizeObserver() {
      if (typeof ResizeObserver === 'undefined') return;
      
      this.resizeObserver = new ResizeObserver(() => {
        this.updateHeights();
      });
      
      this.$nextTick(() => {
        if (this.$refs.gameNav) {
          this.resizeObserver.observe(this.$refs.gameNav);
        }
        if (this.$refs.gameHeader) {
          this.resizeObserver.observe(this.$refs.gameHeader);
        }
        if (this.$refs.gameFooter) {
          this.resizeObserver.observe(this.$refs.gameFooter);
        }
      });
    },
  },
  emits: ["undo", "goon", "step", "auto"],
};
</script>

<style scoped>
@import url("./sum.css");

/* 布局容器 */
.game-layout-container {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}

/* Fixed 导航栏 */
.game-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 15px 30px;
  background: #fff;
  border-bottom: 1px solid #e0e0e0;
  z-index: 1000;
  text-align: center;
}

.game-nav a {
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
}

.game-nav a.router-link-exact-active {
  color: #42b983;
}

/* Fixed 标题和顶部控制区 */
.game-header {
  position: fixed;
  left: 0;
  right: 0;
  padding: 20px;
  background: #fff;
  z-index: 999;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
  transition: top 0.3s ease;
}

.game-header h1 {
  margin: 0 0 10px 0;
}

/* 切换按钮 */
.toggle-header-btn {
  position: fixed;
  top: 10px;
  left: 10px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #42b983;
  color: white;
  border: none;
  cursor: pointer;
  z-index: 1001;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.toggle-header-btn:hover {
  background: #35a372;
  transform: scale(1.1);
}

.toggle-header-btn:active {
  transform: scale(0.95);
}

/* 可滚动的游戏内容区域 */
.game-content-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow-y: auto;
  overflow-x: hidden;
  transition: padding 0.3s ease;
}

/* Fixed 底部控制区 */
.game-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 15px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  z-index: 999;
  text-align: center;
}

/* 动画效果 */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
