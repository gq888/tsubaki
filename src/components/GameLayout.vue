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
    <div v-if="showHelp" class="help-modal" @click="closeHelp">
      <div class="help-content" @click.stop>
        <h3>GUIDE</h3>
        <div class="button-help-list">
          <div v-for="(btn, index) in helpContent" :key="index" class="button-help-item">
            <span class="button-label">{{ btn.label }}</span>
            <span class="button-description">{{ btn.description }}</span>
          </div>
        </div>
        <button class="close-btn" @click="closeHelp">CLOSE</button>
      </div>
    </div>

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
import eventBus from "../utils/eventBus.js";

export default {
  name: "GameLayout",
  components: {
    GameControls,
    GameResultModal,
    GameSettings,
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
      helpContent: [], // 帮助内容
      gameControlsButtons: {}, // 存储所有GameControls组件的按钮配置
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
    
    // 监听事件总线中的GameControls相关事件
    eventBus.on('game-controls:mounted', this.handleControlsMounted);
    eventBus.on('game-controls:buttons-updated', this.handleControlsButtonsUpdated);
    eventBus.on('game-controls:unmounted', this.handleControlsUnmounted);
    
    // 触发一次请求，让已存在的GameControls组件更新配置
    setTimeout(() => {
      eventBus.emit('game-layout:request-update');
      
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
    }, 100);
  },
  beforeUnmount() {
    // 清理事件监听
    eventBus.off('game-controls:mounted', this.handleControlsMounted);
    eventBus.off('game-controls:buttons-updated', this.handleControlsButtonsUpdated);
    eventBus.off('game-controls:unmounted', this.handleControlsUnmounted);
    
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
    
    // 处理GameControls组件挂载事件
    handleControlsMounted(data) {
      this.gameControlsButtons[data.instanceId] = data.buttons;
    },
    
    // 处理GameControls组件按钮更新事件
    handleControlsButtonsUpdated(data) {
      this.gameControlsButtons[data.instanceId] = data.buttons;
    },
    
    // 处理GameControls组件卸载事件
    handleControlsUnmounted(data) {
      delete this.gameControlsButtons[data.instanceId];
    },
    
    // 打开帮助弹窗
    openHelp() {
      // 按钮说明映射
      const buttonDescriptions = {
        undo: "CANCEL THE LAST MOVE",
        goon: "RESTART THE GAME",
        restart: "RESTART THE GAME",
        hint: "GET A HINT",
        step: "EXECUTE THE NEXT MOVE",
        auto: "AUTO EXECUTE/STOP AUTO EXECUTE",
        hitBtn: "DRAW A NEW CARD",
        passBtn: "STOP DRAWING CARDS"
      };
      
      // 收集所有GameControls实例的按钮配置
      const uniqueButtons = new Map();
      
      // 从事件总线收集的按钮配置（优先使用）
      Object.values(this.gameControlsButtons).forEach(buttons => {
        if (buttons && Array.isArray(buttons)) {
          buttons.forEach(button => {
            if (button.action) {
              uniqueButtons.set(button.action, button);
            }
          });
        }
      });
      
      // 同时也检查命名的refs作为备用
      if (this.$refs.gameControls && this.$refs.gameControls.displayButtons) {
        this.$refs.gameControls.displayButtons.forEach(button => {
          if (button.action && !uniqueButtons.has(button.action)) {
            uniqueButtons.set(button.action, button);
          }
        });
      }
      
      if (this.$refs.bottomGameControls && this.$refs.bottomGameControls.displayButtons) {
        this.$refs.bottomGameControls.displayButtons.forEach(button => {
          if (button.action && !uniqueButtons.has(button.action)) {
            uniqueButtons.set(button.action, button);
          }
        });
      }
      
      // 初始化帮助内容
      this.helpContent = [];
      
      // 添加游戏规则说明（作为一个特殊的帮助项）
      if (this.gameRule) {
        this.helpContent.push({
          label: "📋",
          description: `RULE: ${this.gameRule}`
        });
      }
      
      // 添加按钮操作说明
      if (uniqueButtons.size > 0) {
        console.log("通过事件总线获取到的按钮配置:", Array.from(uniqueButtons.values()));
        // 从Map转换为数组并添加到帮助内容中
        const buttonItems = Array.from(uniqueButtons.values()).map(button => ({
          label: button.label || button.action.toUpperCase(),
          description: buttonDescriptions[button.action] || '未知功能'
        }));
        this.helpContent.push(...buttonItems);
      } else {
        console.log("未获取到游戏按钮配置，使用默认按钮说明");
        // 如果无法直接获取，使用默认的按钮说明
        const defaultButtonItems = [
          { label: "◀︎", description: buttonDescriptions.undo },
          { label: "RESTART", description: buttonDescriptions.restart },
          { label: "AUTO/STOP", description: buttonDescriptions.auto },
          { label: "►", description: buttonDescriptions.step }
        ];
        this.helpContent.push(...defaultButtonItems);
      }
      
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

/* 帮助弹窗样式 */
.help-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
}

.help-content {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.2);
}

.help-content span {
  font-size: medium;
}

.help-content h3 {
  margin-top: 0;
  color: #2c3e50;
  text-align: center;
}

.button-help-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1rem 0;
}

.button-help-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 0.375rem;
  border: 0.0625rem solid #e9ecef;
}

.button-label {
  padding: 0.25rem 0.5rem;
  background: #dfcdc3;
  border-radius: 0.25rem;
  min-width: 3rem;
  text-align: center;
  color: #2c3e50;
}

.button-description {
  flex: 1;
  color: #495057;
}

.close-btn {
  display: block;
  margin: 1rem auto 0;
  padding: 0.5rem 1rem;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.close-btn:hover {
  background: #35a372;
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
