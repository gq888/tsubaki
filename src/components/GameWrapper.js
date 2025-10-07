import GameResultModal from "./GameResultModal.vue";
import GameControls from "./GameControls.vue";
import GameStateManager from "../utils/gameStateManager.js";

/**
 * 游戏组件包装器工厂函数
 * 为游戏组件添加统一的GameStateManager、GameControls和GameResultModal功能
 * 
 * @param {Object} baseComponent - 基础游戏组件
 * @param {Object} options - 配置选项
 * @param {number} options.autoStepDelay - 自动模式步骤延迟时间（毫秒）
 * @param {boolean} options.hasUndo - 是否支持撤销功能
 * @param {boolean} options.hasRestart - 是否支持重新开始功能
 * @param {Function} options.customStepFn - 自定义步骤函数
 * @param {Function} options.customPassFn - 自定义自动模式函数
 * @param {Function} options.customGoonFn - 自定义重新开始函数
 * @param {Function} options.customUndoFn - 自定义撤销函数
 * @param {Object} options.gameResultModals - 游戏结果模态框配置
 * @returns {Object} 包装后的Vue组件配置
 */
export function createGameWrapper(baseComponent, options = {}) {
  const {
    autoStepDelay = 500,
    hasUndo = true,
    hasRestart = true,
    customStepFn = null,
    customPassFn = null,
    customGoonFn = null,
    customUndoFn = null,
    gameResultModals = null
  } = options;

  return {
    ...baseComponent,
    components: {
      ...baseComponent.components,
      GameResultModal,
      GameControls
    },
    data() {
      return {
        ...baseComponent.data.call(this),
        gameManager: new GameStateManager({
          autoStepDelay
        })
      };
    },
    created() {
      // 初始化GameStateManager
      this.gameManager.init();
      
      // 调用原组件的初始化方法
      if (this.init) {
        this.init();
      }
    },
    beforeUnmount() {
      // 停止自动模式
      this.gameManager.stopAuto();
      
      // 调用原组件的清理方法
      if (baseComponent.beforeUnmount) {
        baseComponent.beforeUnmount.call(this);
      }
    },
    computed: {
      ...baseComponent.computed,
      // 使用GameStateManager的默认计算属性
      ...GameStateManager.getDefaultComputedProperties(),
      
      // 游戏控制按钮配置
      gameControlsConfig() {
        return {
          showUndo: hasUndo,
          showRestart: hasRestart,
          undoDisabled: this.undoDisabled,
          restartDisabled: this.restartDisabled,
          stepDisabled: this.stepDisabled,
          autoDisabled: this.autoDisabled
        };
      },
      
      // 默认游戏结果模态框配置
      defaultGameResultModals() {
        if (gameResultModals) {
          return gameResultModals;
        }
        
        return {
          win: {
            condition: () => this.winflag,
            title: "U WIN!",
            buttons: [
              {
                text: 'GO ON',
                callback: this.goon,
                disabled: false
              }
            ]
          },
          lose: {
            condition: () => this.loseflag,
            title: "U LOSE",
            buttons: [
              {
                text: 'GO ON',
                callback: this.goon,
                disabled: false
              }
            ]
          },
          draw: {
            condition: () => this.drawflag,
            title: "DRAW GAME",
            buttons: [
              {
                text: 'GO ON',
                callback: this.goon,
                disabled: false
              }
            ]
          }
        };
      }
    },
    methods: {
      ...baseComponent.methods,
      
      // 统一的撤销方法
      undo() {
        if (customUndoFn) {
          customUndoFn.call(this);
        } else {
          this.gameManager.undo();
        }
      },
      
      // 统一的步骤方法
      async stepFn() {
        if (customStepFn) {
          await customStepFn.call(this);
        } else if (baseComponent.methods && baseComponent.methods.stepFn) {
          await baseComponent.methods.stepFn.call(this);
        }
      },
      
      // 统一的自动模式方法
      pass() {
        if (customPassFn) {
          customPassFn.call(this);
        } else {
          this.gameManager.startAuto(async () => {
            if (!this.winflag && !this.loseflag && !this.drawflag) {
              await this.stepFn();
            }
          });
        }
      },
      
      // 统一的重新开始方法
      goon() {
        if (customGoonFn) {
          customGoonFn.call(this);
        } else {
          this.gameManager.reset(() => {
            if (this.init) {
              this.init();
            }
          });
        }
      },
      
      // 双倍步骤方法（用于Chess游戏）
      stepTwiceFn() {
        return this.stepFn();
      }
    }
  };
}

/**
 * 创建游戏控制按钮的渲染函数
 * @param {Object} config - 按钮配置
 * @returns {VNode} Vue渲染节点
 */
export function renderGameControls(h, config, events) {
  const props = {
    showUndo: config.showUndo,
    showRestart: config.showRestart,
    undoDisabled: config.undoDisabled,
    restartDisabled: config.restartDisabled,
    stepDisabled: config.stepDisabled,
    autoDisabled: config.autoDisabled
  };
  
  return h('GameControls', {
    props,
    on: events
  });
}

/**
 * 创建游戏结果模态框的渲染函数
 * @param {Object} modals - 模态框配置
 * @returns {Array} Vue渲染节点数组
 */
export function renderGameResultModals(h, modals) {
  return Object.entries(modals).map(([key, modal]) => {
    if (modal.condition && modal.condition()) {
      return h('GameResultModal', {
        props: {
          title: modal.title,
          subtitle: modal.subtitle,
          buttons: modal.buttons,
          modalStyle: modal.modalStyle,
          customClass: modal.customClass
        },
        scopedSlots: modal.content ? {
          content: () => modal.content()
        } : undefined
      });
    }
    return null;
  }).filter(Boolean);
}
