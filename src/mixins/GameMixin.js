import GameStateManager from "../utils/gameStateManager.js";

/**
 * 游戏组件混入
 * 提供统一的游戏状态管理功能
 */
export const GameMixin = {
  data() {
    return {
      gameManager: null
    };
  },
  
  created() {
    // 初始化GameStateManager
    const autoStepDelay = this.$options.gameConfig?.autoStepDelay || 500;
    this.gameManager = new GameStateManager({
      autoStepDelay
    });
    this.gameManager.init();
  },
  
  beforeUnmount() {
    // 停止自动模式
    if (this.gameManager) {
      this.gameManager.stopAuto();
    }
  },
  
  computed: {
    // 使用GameStateManager的默认计算属性
    ...GameStateManager.getDefaultComputedProperties()
  },
  
  methods: {
    // 统一的撤销方法
    undo() {
      if (this.gameManager) {
        this.gameManager.undo();
      }
    },
    
    // 统一的自动模式方法
    pass() {
      if (this.gameManager) {
        this.gameManager.startAuto(async () => {
          if (!this.winflag && !this.loseflag && !this.drawflag) {
            await this.stepFn();
          }
        });
      }
    },
    
    // 统一的重新开始方法
    goon() {
      if (this.gameManager) {
        this.gameManager.reset(() => {
          if (this.init) {
            this.init();
          }
        });
      }
    },
    
    // 记录操作
    recordOperation(operation) {
      if (this.gameManager) {
        this.gameManager.recordOperation(operation);
      }
    },
    
    // 设置胜利
    setWin() {
      if (this.gameManager) {
        this.gameManager.setWin();
      }
    },
    
    // 设置失败
    setLose() {
      if (this.gameManager) {
        this.gameManager.setLose();
      }
    },
    
    // 设置平局
    setDraw() {
      if (this.gameManager) {
        this.gameManager.setDraw();
      }
    }
  }
};

/**
 * 创建游戏组件的工厂函数
 * @param {Object} baseComponent - 基础组件
 * @param {Object} gameConfig - 游戏配置
 * @returns {Object} 增强后的组件
 */
export function createGameComponent(baseComponent, gameConfig = {}) {
  return {
    ...baseComponent,
    mixins: [
      ...(baseComponent.mixins || []),
      GameMixin
    ],
    gameConfig,
    data() {
      const baseData = baseComponent.data ? baseComponent.data.call(this) : {};
      const mixinData = GameMixin.data.call(this);
      return {
        ...baseData,
        ...mixinData
      };
    },
    computed: {
      ...baseComponent.computed,
      ...GameMixin.computed
    },
    methods: {
      ...baseComponent.methods,
      ...GameMixin.methods
    }
  };
}
