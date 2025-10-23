import { createEnhancedGameComponent } from './gameComponentFactory.js';

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
              } else {
                this.gameManager.recordOperation();
              }
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
        if (this._timer) {
          clearInterval(this._timer);
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
          // this.gameManager.setAutoStepDelay(
          //   level === "easy" ? 1500 : level === "hard" ? 800 : 1200,
          // );
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
              this._gameTimer = null;
              this.startTimer = function () {
                this._gameTimer = setInterval(() => {
                  this.gameTime++;
                }, 1000);
              };
              this.stopTimer = function () {
                if (this._gameTimer) {
                  clearInterval(this._gameTimer);
                  this._gameTimer = null;
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
        if (this._gameTimer) {
          clearInterval(this._gameTimer);
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
    
    ${hasTopControls ? `
    <GameControls
      v-bind="gameControlsConfig"
      @undo="undo"
      @goon="goon"
      @step="stepFn"
      @auto="pass"
    />` : ""}
    
    ${hasGameInfo ? `
    <div class="row">
      <span v-if="time !== undefined">TIME: {{ time }}</span>
      <br v-if="time !== undefined && step !== undefined" />
      <span v-if="step !== undefined">STEP: {{ step }}</span>
    </div>` : ""}
    
    <div class="row">
      ${hasCustomContent ? "<!-- 游戏内容区域 -->" : ""}
    </div>
    
    ${hasBottomControls ? `
    <GameControls
      v-bind="gameControlsConfig"
      @undo="undo"
      @goon="goon"
      @step="stepFn"
      @auto="pass"
    />` : ""}
    
    <!-- 游戏结果模态框 -->
    <GameResultModal
      v-if="winflag"
      title="U WIN!"
      :buttons="[{ text: 'GO ON', action: 'goon', callback: goon, disabled: false }]"
    />
    
    <GameResultModal
      v-if="loseflag"
      title="U LOSE"
      :buttons="[{ text: 'GO ON', action: 'goon', callback: goon, disabled: false }]"
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
 * import { GameComponentPresets } from '../utils/gameComponentPresets.js';
 * import fish from './fish.js';
 *
 * export default GameComponentPresets.simpleGame(fish, 1000);
 *
 * // 3. 自定义配置
 * export default createEnhancedGameComponent(GridBattle, {
 *   autoStepDelay: 500,
 *   hasUndo: true,
 *   customInit() {
 *     // 自定义初始化逻辑
 *   }
 * });
 */