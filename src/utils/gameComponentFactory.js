import GameResultModal from "../components/GameResultModal.vue";
import GameControls from "../components/GameControls.vue";
import GameStateManager from "./gameStateManager.js";

/**
 * 游戏组件工厂函数
 * 为现有游戏组件添加统一的GameStateManager、GameControls和GameResultModal功能
 * 这是一个保守的重构方案，最大程度保持现有代码结构不变
 */

/**
 * 创建增强的游戏组件
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
    autoStepDelay = 500,
    hasUndo = true,
    hasRestart = true,
    customInit = null,
    customCleanup = null
  } = options;

  return {
    // 继承基础组件的所有属性
    ...baseComponent,
    
    // 添加必要的组件
    components: {
      ...baseComponent.components,
      GameResultModal,
      GameControls
    },
    
    // 扩展data函数
    data() {
      const baseData = baseComponent.data ? baseComponent.data.call(this) : {};
      return {
        ...baseData,
        gameManager: new GameStateManager({
          autoStepDelay
        })
      };
    },
    
    // 扩展created生命周期
    created() {
      // 初始化GameStateManager
      this.gameManager.init();
      
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
      ...baseComponent.computed,
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
          autoDisabled: this.autoDisabled
        };
      }
    },
    
    // 扩展methods
    methods: {
      ...baseComponent.methods,
      
      // 统一的撤销方法
      undo() {
        this.gameManager.undo();
      },
      
      // 统一的自动模式方法
      pass() {
        this.gameManager.startAuto(async () => {
          if (!this.winflag && !this.loseflag && !this.drawflag) {
            await this.stepFn();
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
      }
    }
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
      hasRestart: true
    }),
  
  // 简单游戏预设（不支持撤销）
  simpleGame: (baseComponent, autoStepDelay = 1000) => 
    createEnhancedGameComponent(baseComponent, {
      autoStepDelay,
      hasUndo: false,
      hasRestart: false
    }),
  
  // 配对游戏预设
  pairGame: (baseComponent, autoStepDelay = 500) => 
    createEnhancedGameComponent(baseComponent, {
      autoStepDelay,
      hasUndo: false,
      hasRestart: true,
      customCleanup() {
        // 清理定时器
        if (this.timer) {
          clearInterval(this.timer);
        }
      }
    })
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
    hasCustomContent = true
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
    />` : ''}
    
    ${hasGameInfo ? `
    <div class="row">
      <span v-if="time !== undefined">TIME: {{ time }}</span>
      <br v-if="time !== undefined && step !== undefined" />
      <span v-if="step !== undefined">STEP: {{ step }}</span>
    </div>` : ''}
    
    <div class="row">
      ${hasCustomContent ? '<!-- 游戏内容区域 -->' : ''}
    </div>
    
    ${hasBottomControls ? `
    <GameControls
      v-bind="gameControlsConfig"
      @undo="undo"
      @goon="goon"
      @step="stepFn"
      @auto="pass"
    />` : ''}
    
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
