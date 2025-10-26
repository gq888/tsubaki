<template>
  <div class="game-layout-container">
    <!-- 切换按钮 -->
    <button
      class="toggle-header-btn"
      @click="toggleHeader"
      @mouseleave="handleMouseLeave"
      @touchstart="startLongPress"
      @touchend="stopLongPress"
      @touchcancel="stopLongPress"
      @mouseenter="handleMouseEnter"
      :title="isHeaderExpanded ? '收起导航和标题' : '展开导航和标题'"
    >
      {{ isHeaderExpanded ? "▲" : "▼" }}
    </button>

    <!-- 设置按钮 -->
    <button
      class="settings-btn"
      @click="openSettings"
      title="游戏设置"
    >
      ⚙️
    </button>

    <!-- 帮助按钮 -->
    <button
      class="help-btn"
      @click="openHelp"
      title="游戏帮助"
    >
      ❓
    </button>

    <!-- 设置弹窗 -->
    <GameSettings
      :visible="showSettings"
      :currentGame="currentGameName"
      @close="closeSettings"
      @settings-saved="handleSettingsSaved"
      ref="gameSettings"
    />

    <!-- 帮助弹窗 -->
    <GameHelp 
      :visible="showHelp" 
      :gameRule="gameRule"
      :customButtons="customButtons"
      @close="closeHelp"
    />

    <!-- Fixed 导航栏 -->
    <transition name="slide-down">
      <div v-show="isHeaderExpanded" ref="gameNav" class="game-nav">
        <template v-for="nav in navItems" :key="nav.path">
          <router-link :to="nav.path">{{ nav.icon + ($route.path === nav.path ? title : "") }}</router-link>
          <!-- <span v-if="$route.path === nav.path" class="nav-title">{{ title }}</span> -->
        </template>
      </div>
    </transition>

    <!-- Fixed 标题和顶部控制区 -->
    <transition name="slide-down">
      <div
        v-show="isHeaderExpanded"
        ref="gameHeader"
        class="game-header"
        :style="{ top: navHeight / 16 + 'rem' }"
      >
        <!-- 顶部控制按钮插槽 -->
        <slot name="top-controls">
          <GameControls
            v-if="showTopControls"
            v-bind="gameControlsConfig"
            @undo="$emit('undo')"
            @goon="$emit('goon')"
            @step="$emit('step')"
            @auto="$emit('auto')"
            ref="gameControls"
          />
        </slot>
      </div>
    </transition>

    <!-- 可滚动的游戏内容区域 -->
    <div class="game-content-wrapper" :style="contentWrapperStyle">
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
            ref="bottomGameControls"
          />
      </slot>
    </div>

    <!-- 游戏结果模态框插槽 -->
    <slot name="result-modals">
      <!-- Win Modal -->
      <GameResultModal
        v-if="winflag"
        :title="winTitle !== undefined ? winTitle : 'U WIN!'"
        :subtitle="winSubtitle"
        :buttons="winButtons || defaultWinButtons"
        :modalStyle="winModalStyle"
        :customClass="winCustomClass"
        :footerHeight="footerHeight"
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
        :title="loseTitle !== undefined ? loseTitle : 'U LOSE'"
        :subtitle="loseSubtitle"
        :buttons="loseButtons || defaultLoseButtons"
        :modalStyle="loseModalStyle || { backgroundColor: 'rgba(0,0,0,0.5)' }"
        :customClass="loseCustomClass"
        :footerHeight="footerHeight"
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
        :title="drawTitle !== undefined ? drawTitle : 'DRAW GAME'"
        :subtitle="drawSubtitle"
        :buttons="drawButtons || defaultDrawButtons"
        :modalStyle="drawModalStyle || { backgroundColor: 'rgba(0,0,0,0.5)' }"
        :customClass="drawCustomClass"
        :footerHeight="footerHeight"
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
import GameSettings from "./GameSettings.vue";
import GameHelp from "./GameHelp.vue";

export default {
  name: "GameLayout",
  components: {
    GameControls,
    GameResultModal,
    GameSettings,
    GameHelp,
  },
  data() {
    return {
      isHeaderExpanded: true,
      navHeight: 0,
      headerHeight: 0,
      footerHeight: 0,
      resizeObserver: null,
      lastScrollTop: 0,
      lastToggleTime: 0, // 上次切换的时间戳
      toggleCooldown: 500, // 切换冷却时间（毫秒）
      autoHideTimer: null, // 自动隐藏定时器
      showSettings: false, // 是否显示设置弹窗
      showHelp: false, // 是否显示帮助弹窗
      longPressTimer: null, // 长按定时器
      isLongPress: false, // 是否正在长按
      isHovered: false, // 是否正在悬停
      longPressDuration: 500, // 长按判定时间（毫秒）
      navItems: [
        { path: '/month', icon: '🌛' },
        { path: '/fish', icon: '🐟' },
        { path: '/blackjack', icon: '♠️' },
        { path: '/point24', icon: '24' },
        { path: '/Tortoise', icon: '🐢' },
        { path: '/Sort', icon: '🐗' },
        { path: '/Pairs', icon: '🐰' },
        { path: '/Spider', icon: '🕷️' },
        { path: '/TowerHanoi', icon: '🗼' },
        { path: '/GridBattle', icon: '⚔️' },
      ],
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
    // 游戏规则说明
    gameRule: {
      type: String,
      default: "",
    },

    // 控制按钮相关
    showTopControls: {
      type: Boolean,
      default: false,
    },
    showBottomControls: {
      type: Boolean,
      default: true,
    },
    gameControlsConfig: {
      type: Object,
      default: () => ({}),
    },
    customButtons: {
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
    
    // 智能滚动配置
    enableSmartScroll: {
      type: Boolean,
      default: true,
    },
    smartScrollThreshold: {
      type: Number,
      default: 50,
    },
    autoHideDelay: {
      type: Number,
      default: 2000, // 默认4秒后自动隐藏
    },
  },
  computed: {
    contentWrapperStyle() {
      const topPadding = this.navHeight + this.headerHeight;
      const bottomPadding = this.footerHeight;

      return {
        ...this.containerStyle,
        paddingTop: `${topPadding / 16}rem`,
        paddingBottom: `${bottomPadding / 16}rem`,
      };
    },
    defaultWinButtons() {
      return [
        {
          text: "GO ON",
          action: "goon",
          callback: () => this.$emit("goon"),
          disabled: false,
        },
      ];
    },
    defaultLoseButtons() {
      return [
        {
          text: "RESTART",
          action: "goon",
          callback: () => this.$emit("goon"),
          disabled: false,
        },
        {
          text: "UNDO",
          action: "undo",
          callback: () => this.$emit("undo"),
          disabled: this.step <= 0,
        },
      ];
    },
    defaultDrawButtons() {
      return [
        {
          text: "RESTART",
          action: "goon",
          callback: () => this.$emit("goon"),
          disabled: false,
        },
        {
          text: "UNDO",
          action: "undo",
          callback: () => this.$emit("undo"),
          disabled: this.step <= 0,
        },
      ];
    },
    currentGameName() {
      // 从路由中获取当前游戏名称
      return this.$route?.path?.substring(1) || '';
    },
  },
  mounted() {
    this.updateHeights();
    this.setupResizeObserver();
    this.setupScrollListener();
    this.startAutoHideTimer();
    
    // 检查是否首次访问该游戏，如果是则打开帮助弹窗
    const currentGame = this.currentGameName;
    if (currentGame) {
      const visitedKey = `game-visited-${currentGame}`;
      if (!localStorage.getItem(visitedKey)) {
        console.log('首次访问游戏，显示帮助弹窗');
        setTimeout(() => {
          this.openHelp();
          this.$refs.gameSettings.recordGameVisit();
        }, 500); // 延迟打开，确保组件完全初始化
      }
    }
  },
  beforeUnmount() {
    // 清理其他资源
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    this.removeScrollListener();
    this.clearAutoHideTimer();
    this.clearLongPressTimer();
  },
  methods: {
    toggleHeader() {
      if (this.isHeaderExpanded) {
        this.collapseHeader();
      } else {
        this.expandHeader();
      }
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
      if (typeof ResizeObserver === "undefined") return;

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
    /**
     * 设置滚动监听器
     * 实现智能头部显示/隐藏：
     * - 在顶部继续向上滚动 → 隐藏头部（释放空间）
     * - 在底部继续向下滚动 → 展开头部（显示控制）
     */
    setupScrollListener() {
      this.$nextTick(() => {
        const wrapper = this.$el?.querySelector('.game-content-wrapper');
        if (wrapper) {
          this._scrollHandler = this.handleScroll.bind(this);
          wrapper.addEventListener('scroll', this._scrollHandler, { passive: true });
        }
      });
    },
    removeScrollListener() {
      const wrapper = this.$el?.querySelector('.game-content-wrapper');
      if (wrapper && this._scrollHandler) {
        wrapper.removeEventListener('scroll', this._scrollHandler);
      }
    },
    handleScroll(event) {
      // 如果禁用了智能滚动，直接返回
      if (!this.enableSmartScroll) {
        return;
      }
      
      const wrapper = event.target;
      const scrollTop = wrapper.scrollTop;
      const scrollHeight = wrapper.scrollHeight;
      const clientHeight = wrapper.clientHeight;
      
      // 计算滚动方向（需要有明显的滚动距离才算）
      const scrollDelta = scrollTop - this.lastScrollTop;
      const scrollingDown = scrollDelta > 0;
      const scrollingUp = scrollDelta < 0;
      
      // 检查是否在顶部（带阈值）
      const isAtTop = scrollTop <= this.smartScrollThreshold;
      
      // 检查是否在底部（带阈值）
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - this.smartScrollThreshold;
      
      // 检查冷却时间
      const now = Date.now();
      const canToggle = now - this.lastToggleTime >= this.toggleCooldown;
      
      // 智能切换逻辑（带冷却时间）
      if (canToggle) {
        if ((isAtTop && scrollingUp || isAtBottom && scrollingDown) && !this.isHeaderExpanded) {
          this.lastToggleTime = now;
          this.expandHeader();
        }
      }
      
      this.lastScrollTop = scrollTop;
    },
    
    expandHeader() {
      this.isHeaderExpanded = true;
      this.$nextTick(() => {
        this.updateHeights();
      });
      // 只有在没有长按或悬停时才启动自动隐藏定时器
      if (!this.isLongPress && !this.isHovered) {
        this.startAutoHideTimer();
      }
    },
    
    collapseHeader() {
      // 只有在没有长按或悬停时才允许收起
      if (!this.isLongPress && !this.isHovered) {
        this.isHeaderExpanded = false;
        this.$nextTick(() => {
          this.updateHeights();
        });
        // 隐藏头部时清除定时器
        this.clearAutoHideTimer();
      }
    },
    
    startAutoHideTimer() {
      this.clearAutoHideTimer();
      // 只有在没有长按或悬停时才设置自动隐藏
      if (!this.isLongPress && !this.isHovered) {
        this.autoHideTimer = setTimeout(() => {
          this.collapseHeader();
        }, this.autoHideDelay);
      }
    },
    
    clearAutoHideTimer() {
      if (this.autoHideTimer) {
        clearTimeout(this.autoHideTimer);
        this.autoHideTimer = null;
      }
    },
    
    // 开始长按检测
    startLongPress() {
      this.isLongPress = false;
      this.clearLongPressTimer();
      this.longPressTimer = setTimeout(() => {
        this.isLongPress = true;
        // 长按期间展开导航并防止自动收起
        this.expandHeader();
        this.clearAutoHideTimer();
      }, this.longPressDuration);
    },
    
    // 停止长按检测
    stopLongPress() {
      this.clearLongPressTimer();
      this.isLongPress = false;
      // 如果导航是展开的，重新设置自动隐藏（如果没有悬停）
      if (this.isHeaderExpanded && !this.isHovered) {
        this.startAutoHideTimer();
      }
    },
    
    // 清除长按定时器
    clearLongPressTimer() {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    },
    
    // 处理鼠标悬停
    handleMouseEnter() {
      this.isHovered = true;
      // 悬停时展开导航并防止自动收起
      this.expandHeader();
      this.clearAutoHideTimer();
    },
    
    // 处理鼠标离开
    handleMouseLeave() {
      this.isHovered = false;
      this.stopLongPress(); // 确保长按状态也被正确清除
      // 鼠标离开后，重新设置自动隐藏
      if (this.isHeaderExpanded) {
        this.startAutoHideTimer();
      }
    },
    
    openSettings() {
      this.showSettings = true;
    },
    
    closeSettings() {
      this.showSettings = false;
    },
    

    
    // 打开帮助弹窗
    openHelp() {
      this.showHelp = true;
    },
    
    // 关闭帮助弹窗
    closeHelp() {
      this.showHelp = false;
    },
    
    handleSettingsSaved(settings) {
      // 发送设置保存事件给父组件
      this.$emit('settings-changed', settings);
    },
  },
  emits: ["undo", "goon", "step", "auto", "settings-changed"],
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
  padding: 0.5rem 1rem;
  background: #fff;
  border-bottom: 0.0625rem solid #e0e0e0;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.game-nav a {
  font-weight: bold;
  color: #2c3e50;
  text-decoration: none;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  font-size: 1.125rem;
}

.game-nav a:hover {
  background: #f5f5f5;
  transform: scale(1.1);
}

.game-nav a.router-link-exact-active {
  color: #42b983;
  background: #e8f5f0;
}

/* Fixed 标题和顶部控制区 */
.game-header {
  position: fixed;
  left: 0;
  right: 0;
  background: #fff;
  z-index: 999;
  text-align: center;
  border-bottom: 0.0625rem solid #f0f0f0;
  transition: top 0.3s ease;
}

/* 切换按钮 */
.toggle-header-btn {
  position: fixed;
  top: 0.5rem;
  left: 0.5rem;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: #42b983;
  color: white;
  border: none;
  cursor: pointer;
  z-index: 1001;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.toggle-header-btn:hover {
  background: #35a372;
  transform: scale(1.1);
}

/* 长按或触摸时的样式增强 */
.toggle-header-btn:active {
  background: #2a8a61;
  transform: scale(0.95);
}

/* 设置按钮 */
.settings-btn {
  position: fixed;
  top: 0.5rem;
  right: 0.5rem;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: #42b983;
  color: white;
  border: none;
  cursor: pointer;
  z-index: 1001;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.settings-btn:hover {
  background: #35a372;
  transform: scale(1.1) rotate(90deg);
}

.settings-btn:active {
  transform: scale(0.95);
}

/* 帮助按钮 */
.help-btn {
  position: fixed;
  top: 3rem;
  right: 0.5rem;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: #42b983;
  color: white;
  border: none;
  cursor: pointer;
  z-index: 1001;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0.125rem 0.5rem rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.help-btn:hover {
  background: #35a372;
  transform: scale(1.1);
}

.help-btn:active {
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
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch; /* 移动端流畅滚动 */
  background-color: #3c4245;
}

/* Fixed 底部控制区 */
.game-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 0.5rem;
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
  transform: translateY(-1.25rem);
}

.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-1.25rem);
}
</style>
