import GameStateManager from "./gameStateManager.js";
import { defineAsyncComponent } from "vue";

/**
 * 组件定义 - 根据环境选择 Mock 或真实组件
 */
let GameResultModal, GameControls, GameLayout;

if (typeof window === "undefined") {
  // Node.js 环境：直接使用 Mock 组件
  GameResultModal = {
    name: "GameResultModal",
    template: "<div>Mock GameResultModal</div>",
    props: ["title", "subtitle", "buttons", "show"],
  };
  GameControls = {
    name: "GameControls",
    template: "<div>Mock GameControls</div>",
    props: ["canUndo", "canGoon", "canRestart", "canAuto", "canStep"],
  };
  GameLayout = {
    name: "GameLayout",
    template: "<div><slot name='game-content'></slot></div>",
    props: ["title", "winflag", "loseflag", "drawflag"],
  };
} else {
  // 浏览器环境：使用 Vue 3 异步组件
  GameResultModal = defineAsyncComponent(
    () => import("../components/GameResultModal.vue"),
  );
  GameControls = defineAsyncComponent(
    () => import("../components/GameControls.vue"),
  );
  GameLayout = defineAsyncComponent(
    () => import("../components/GameLayout.vue"),
  );
}

/**
 * 游戏组件工厂函数
 * 为现有游戏组件添加统一的GameStateManager、GameControls和GameResultModal功能
 * 这是一个保守的重构方案，最大程度保持现有代码结构不变
 */

/**
 * 创建增强的游戏组件（同步版本）
 * @param {Object} baseComponent - 基础游戏组件 (.js文件导出的组件)
 * @param {Object} options - 配置选项
 * @param {number} options.autoStepDelay - 自动模式延迟时间
 * @param {boolean} options.hasUndo - 是否支持撤销
 * @param {boolean} options.hasRestart - 是否支持重新开始
 * @param {Function} options.customInit - 自定义初始化函数
 * @param {Function} options.customCleanup - 自定义清理函数
 * @returns {Object} 增强后的Vue组件配置
 */
export function createEnhancedGameComponent(baseComponent, options = {}) {
  const {
    computed = {},
    methods = {},
    autoStepDelay = 500,
    hasUndo = true,
    hasRestart = true,
    customInit = null,
    customCleanup = null,
  } = options;

  return {
    // 继承基础组件的所有属性
    ...baseComponent,

    // 添加必要的组件
    components: {
      ...baseComponent.components,
      GameResultModal,
      GameControls,
      GameLayout,
    },

    // 扩展data函数
    data() {
      const baseData = baseComponent.data ? baseComponent.data.call(this) : {};
      return {
        ...baseData,
        gameManager: new GameStateManager({
          autoStepDelay,
        }),
      };
    },

    // 扩展created生命周期
    created() {
      // 初始化GameStateManager
      this.gameManager.init();

      // 设置事件监听
      this.handleUndo && this.gameManager.on("undo", this.handleUndo);

      // 设置historyUpdate事件监听
      this.gameManager.on("historyUpdate", () => {
        // 先执行各页面自定义的handleHistoryUpdate方法
        if (
          this.handleHistoryUpdate &&
          typeof this.handleHistoryUpdate === "function"
        ) {
          this.handleHistoryUpdate();
        }

        // 然后执行autoCalc方法（如果存在）
        if (this.autoCalc && typeof this.autoCalc === "function") {
          this.autoCalc();
        }
      });

      // 调用自定义初始化函数
      if (customInit) {
        customInit.call(this);
      }

      // 调用原组件的created方法
      if (baseComponent.created) {
        baseComponent.created.call(this);
      }

      // 调用init方法（如果存在）
      if (this.init) {
        this.init();
      }
    },

    // 扩展beforeUnmount生命周期
    beforeUnmount() {
      // 停止自动模式
      this.gameManager.stopAuto();

      // 清理事件监听
      this.gameManager.off("undo");
      this.gameManager.off("historyUpdate");

      // 调用自定义清理函数
      if (customCleanup) {
        customCleanup.call(this);
      }

      // 调用原组件的beforeUnmount方法
      if (baseComponent.beforeUnmount) {
        baseComponent.beforeUnmount.call(this);
      }
    },

    // 扩展computed属性
    computed: {
      // 使用GameStateManager的默认计算属性
      ...GameStateManager.getDefaultComputedProperties(),

      // 游戏控制配置
      gameControlsConfig() {
        return {
          showUndo: hasUndo,
          showRestart: hasRestart,
          undoDisabled: this.undoDisabled,
          restartDisabled: this.restartDisabled,
          stepDisabled: this.stepDisabled,
          autoDisabled: this.autoDisabled,
          isAutoRunning: this.gameManager?.isAutoRunning || false,
        };
      },

      // GameLayout通用属性配置
      gameLayoutProps() {
        return {
          title: this.title,
          gameControlsConfig: this.gameControlsConfig,
          winflag: this.winflag,
          loseflag: this.loseflag,
          drawflag: this.drawflag,
          step: this.step,
        };
      },

      ...baseComponent.computed,
      ...computed,
    },

    // 扩展methods
    methods: {
      // 统一的撤销方法
      undo() {
        this.gameManager.undo();
      },

      // 统一的自动模式方法
      async pass() {
        this.gameManager.isAutoRunning ? this.gameManager.stopAuto() : await this.gameManager.startAuto(async () => {
          const beforeState = JSON.stringify(this.$data);
          await this.stepFn();
          const afterState = JSON.stringify(this.$data);
          
          // 如果状态没变，说明移动无效
          if (beforeState === afterState) {
            console.warn('移动无效，游戏可能陷入死锁');
            this.gameManager.stopAuto();
          }
        });
      },

      // 统一的重新开始方法
      goon() {
        this.gameManager.reset(() => {
          if (this.init) {
            this.init();
          }
        });
      },

      ...baseComponent.methods,
      ...methods,
    },
  };
}

/**
 * 快速创建游戏组件的便捷函数
 * 针对不同类型的游戏提供预设配置
 */
export const GameComponentPresets = {
  // 纸牌游戏预设（支持撤销）
  cardGame: (baseComponent, autoStepDelay = 500) =>
    createEnhancedGameComponent(baseComponent, {
      autoStepDelay,
      hasUndo: true,
      hasRestart: true,
    }),

  // 简单游戏预设（不支持撤销）
  simpleGame: (baseComponent, autoStepDelay = 1000) =>
    createEnhancedGameComponent(baseComponent, {
      autoStepDelay,
      hasUndo: false,
      hasRestart: true,
      customInit() {
        // 为fish游戏添加特殊的stepFn和goon方法
        if (this.title && this.title.includes("FISHING")) {
          this.stepFn = async () => {
            await this.gameManager.step(async () => {
              let cards = this["cards" + ((this.step % 4) + 1)];
              while (cards.length <= 0) {
                this.gameManager.recordOperation();
                cards = this["cards" + ((this.step % 4) + 1)];
              }
              await this.hit(cards, this.arr);
              // 检查胜利条件
              let i;
              for (i = 1; i <= 4; i++) {
                if ((this.step % 4) + 1 != i && this["cards" + i].length > 0) {
                  break;
                }
              }
              if (i > 4) {
                this.gameManager.setWin();
              }
              this.gameManager.recordOperation();
            });
          };
        }

        // 为month游戏添加特殊的stepFn和goon方法
        if (this.title && this.title === "Month") {
          this.stepFn = async () => {
            // 检查失败条件
            if (this.cards2[12] >= 4) {
              this.gameManager.setLose();
            }
            await this.gameManager.step(async () => {
              await this.hit();
            });
          };
        }
      },
    }),

  // 配对游戏预设
  pairGame: (baseComponent, autoStepDelay = 500, methods = {}) =>
    createEnhancedGameComponent(baseComponent, {
      autoStepDelay,
      hasUndo: false,
      hasRestart: true,
      methods,
      customCleanup() {
        // 清理定时器
        if (this.timer) {
          clearInterval(this.timer);
        }
      },
    }),

  // 益智游戏预设
  puzzleGame: (baseComponent, autoStepDelay = 800, methods = {}) =>
    createEnhancedGameComponent(baseComponent, {
      autoStepDelay,
      hasUndo: true,
      hasRestart: true,
      methods,
      customInit() {
        // 为益智游戏添加特殊功能
        if (
          this.title &&
          (this.title.includes("24") || this.title.includes("PUZZLE"))
        ) {
          // 添加提示功能
          this.showHint = function () {
            // 实现提示逻辑
            console.log("显示提示");
          };
        }
      },
    }),

  // 策略游戏预设
  strategyGame: (baseComponent, autoStepDelay = 1200) =>
    createEnhancedGameComponent(baseComponent, {
      autoStepDelay,
      hasUndo: true,
      hasRestart: true,
      customInit() {
        // 为策略游戏添加特殊功能
        this.difficulty = "normal";
        this.setDifficulty = function (level) {
          this.difficulty = level;
          this.gameManager.setAutoStepDelay(
            level === "easy" ? 1500 : level === "hard" ? 800 : 1200,
          );
        };
      },
    }),

  // 动作游戏预设
  actionGame: (baseComponent, autoStepDelay = 300) =>
    createEnhancedGameComponent(baseComponent, {
      autoStepDelay,
      hasUndo: false,
      hasRestart: true,
      customInit() {
        // 为动作游戏添加特殊功能
        this.score = 0;
        this.combo = 0;
        this.addScore = function (points) {
          this.score += points * (this.combo + 1);
          this.combo++;
        };
        this.resetCombo = function () {
          this.combo = 0;
        };
      },
    }),

  // 自定义游戏预设
  customGame: (baseComponent, config = {}) => {
    const {
      autoStepDelay = 500,
      hasUndo = true,
      hasRestart = true,
      features = [],
      customLogic = null,
    } = config;

    return createEnhancedGameComponent(baseComponent, {
      autoStepDelay,
      hasUndo,
      hasRestart,
      customInit() {
        // 应用自定义功能
        features.forEach((feature) => {
          switch (feature) {
            case "timer":
              this.gameTime = 0;
              this.gameTimer = null;
              this.startTimer = function () {
                this.gameTimer = setInterval(() => {
                  this.gameTime++;
                }, 1000);
              };
              this.stopTimer = function () {
                if (this.gameTimer) {
                  clearInterval(this.gameTimer);
                  this.gameTimer = null;
                }
              };
              break;

            case "score":
              this.score = 0;
              this.highScore = parseInt(
                localStorage.getItem(`${this.title}_highScore`) || "0",
              );
              this.updateScore = function (points) {
                this.score += points;
                if (this.score > this.highScore) {
                  this.highScore = this.score;
                  localStorage.setItem(
                    `${this.title}_highScore`,
                    this.highScore.toString(),
                  );
                }
              };
              break;

            case "difficulty":
              this.difficulty = "normal";
              this.setDifficulty = function (level) {
                this.difficulty = level;
                // 根据难度调整游戏参数
                const delays = { easy: 800, normal: 500, hard: 300 };
                this.gameManager.setAutoStepDelay(delays[level] || 500);
              };
              break;
          }
        });

        // 应用自定义逻辑
        if (customLogic && typeof customLogic === "function") {
          customLogic.call(this);
        }
      },
      customCleanup() {
        // 清理定时器
        if (this.gameTimer) {
          clearInterval(this.gameTimer);
        }
      },
    });
  },
};

/**
 * 模板字符串生成器
 * 生成标准的游戏组件模板
 */
export function generateGameTemplate(options = {}) {
  const {
    hasTopControls = true,
    hasBottomControls = false,
    hasGameInfo = false,
    hasCustomContent = true,
  } = options;

  return `<template>
  <div class="Sum">
    <h1>{{ title }}</h1>
    
    ${
      hasTopControls
        ? `
    <GameControls
      v-bind="gameControlsConfig"
      @undo="undo"
      @goon="goon"
      @step="stepFn"
      @auto="pass"
    />`
        : ""
    }
    
    ${
      hasGameInfo
        ? `
    <div class="row">
      <span v-if="time !== undefined">TIME: {{ time }}</span>
      <br v-if="time !== undefined && step !== undefined" />
      <span v-if="step !== undefined">STEP: {{ step }}</span>
    </div>`
        : ""
    }
    
    <div class="row">
      ${hasCustomContent ? "<!-- 游戏内容区域 -->" : ""}
    </div>
    
    ${
      hasBottomControls
        ? `
    <GameControls
      v-bind="gameControlsConfig"
      @undo="undo"
      @goon="goon"
      @step="stepFn"
      @auto="pass"
    />`
        : ""
    }
    
    <!-- 游戏结果模态框 -->
    <GameResultModal
      v-if="winflag"
      title="U WIN!"
      :buttons="[{ text: 'GO ON', callback: goon, disabled: false }]"
    />
    
    <GameResultModal
      v-if="loseflag"
      title="U LOSE"
      :buttons="[{ text: 'GO ON', callback: goon, disabled: false }]"
    />
  </div>
</template>`;
}

/**
 * 使用示例：
 *
 * // 1. 简单使用
 * import { createEnhancedGameComponent } from '../utils/gameComponentFactory.js';
 * import Pairs from './Pairs.js';
 *
 * export default createEnhancedGameComponent(Pairs, {
 *   autoStepDelay: 500,
 *   hasUndo: false
 * });
 *
 * // 2. 使用预设
 * import { GameComponentPresets } from '../utils/gameComponentFactory.js';
 * import fish from './fish.js';
 *
 * export default GameComponentPresets.simpleGame(fish, 1000);
 *
 * // 3. 自定义配置
 * export default createEnhancedGameComponent(Chess, {
 *   autoStepDelay: 500,
 *   hasUndo: true,
 *   customInit() {
 *     // 自定义初始化逻辑
 *   }
 * });
 */
