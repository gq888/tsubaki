import GameStateManager from "./gameStateManager.js";
import gameSettingsManager from "./gameSettingsManager.js";
import { defineAsyncComponent } from "vue";
import { setSeed } from "./help.js";
import { CARD_TYPES, CARD_POINTS, getCardPlaceholderText } from "./cardUtils.js";
import eventBus from "./eventBus.js";

/**
 * 游戏规则说明映射
 * 为每个游戏提供简要的规则说明
 */
const gameRules = {
  // 月份游戏
  month: "The game has 13 positions (12 months + 1 deck). Each turn, take the top card from the current position and move it to the position corresponding to its value. If the deck reaches 4 cards, the game ends.",
  
  // 钓鱼游戏
  fish: "A 4-player game where each player starts with cards. On your turn, draw the top card from your deck. If it matches a card in the center, collect those cards. Special cards let you take cards from other players. The player who collects all cards wins.",
  
  // 24点游戏
  point24: "Use 4 given numbers and apply +, -, ×, ÷ operations to make the result equal to 24. Each number can be used exactly once. You can combine numbers by selecting an operator and clicking cards to perform calculations.",
  
  // 龟兔赛跑（卡片配对游戏）
  Tortoise: "A card matching game with hierarchical dependencies. Cards have z-index priorities and connection requirements. Match cards of the same value pair (cards with same base number). Cards can only be matched when all their prerequisite cards are already matched. Complete all pairs to win.",
  
  // 排序游戏
  Sort: "A card sorting puzzle with 3 difficulty modes: simple (by number), medium (by color), and hard (by suit). Move cards to empty slots following specific rules. Cards can only be placed in valid positions. The goal is to arrange all cards in the correct order.",
  
  // 配对游戏
  Pairs: "A memory matching game with 48 cards. Flip cards to find pairs. Cards are paired based on their base value (4 cards share the same base value). Find all matching pairs as quickly as possible to win.",
  
  // 蜘蛛纸牌
  Spider: "A classic Spider Solitaire game with 52 standard playing cards. Arrange cards in descending order by number. Cards can be moved in sequences to build foundations. The goal is to sort all cards by suit and rank to win.",
  
  // 国际象棋（策略游戏）
  GridBattle: "A strategy game on a 6x6 grid with two types of pieces: high (1) and low (0) grade. Pieces move according to specific rules defined by their positions. Win by eliminating all opponent's pieces of the opposite grade, or reach a draw when only one of each remains.",
  
  // 21点（BlackJack）
  blackjack: "A card game using a 54-card deck. The goal is to get as close to 21 as possible without exceeding it. Cards 2-10 are worth their face value, J/Q/K are worth 10, and Aces can be worth 1 or 11. If your score exceeds 21, you bust. Both player and dealer start with 2 cards."
};

/**
 * 组件定义 - 根据环境选择 Mock 或真实组件
 */
let GameResultModal, GameControls, GameLayout, CardImage;

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
  CardImage = {
    name: "CardImage",
    template: "<div>Mock CardImage</div>",
    props: ["src", "alt"],
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
  CardImage = defineAsyncComponent(
    () => import("../components/CardImage.vue"),
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

  // 按钮描述映射
  const buttonDescriptions = {
    undo: '撤销上一步操作',
    goon: '重新开始游戏',
    step: '单步执行',
    auto: '自动运行/停止自动运行',
    submit: '提交答案',
    hint: '显示提示',
    reset: '重置当前操作',
    confirm: '确认操作',
    cancel: '取消操作',
    pause: '暂停游戏',
    resume: '继续游戏',
  };

  return {
    // 继承基础组件的所有属性
    ...baseComponent,

    // 添加必要的组件
    components: {
      ...baseComponent.components,
      GameResultModal,
      GameControls,
      GameLayout,
      CardImage,
    },

    // 扩展data函数
    data() {
      const baseData = baseComponent.data ? baseComponent.data.call(this) : {};
      
      return {
        types: CARD_TYPES,
        point: CARD_POINTS,
        ...baseData,
        gameManager: new GameStateManager({
          autoStepDelay,
        }),
        gameControlsButtons: {}, // 存储从eventBus获取的按钮配置
      };
    },

    // 扩展created生命周期
    created() {
      this.setSeed(this.seed ? this.seed : Date.now());
      
      // 初始化GameStateManager
      this.gameManager.init();

      // 从 localStorage 加载延迟设置
      this.loadDelaySettings();

      // 监听设置变化
      this._settingsChangeHandler = this.handleSettingsChanged.bind(this);
      gameSettingsManager.addListener(this._settingsChangeHandler);

      // 设置事件监听
      this.handleUndo && this.gameManager.on("undo", this.handleUndo);

      // 注册beforeWait事件监听 - 在wait前调用renderTextView
      this.gameManager.on("beforeWait", () => {
        if (this.renderTextView && typeof this.renderTextView === 'function') {
          this.renderTextView();
        }
      });

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

      // 监听事件总线中的GameControls相关事件
      this._controlsCreatedHandler = this.handleControlsCreated.bind(this);
      this._controlsButtonsUpdatedHandler = this.handleControlsButtonsUpdated.bind(this);
      this._controlsUnmountedHandler = this.handleControlsUnmounted.bind(this);
      
      eventBus.on('game-controls:created', this._controlsCreatedHandler);
      eventBus.on('game-controls:buttons-updated', this._controlsButtonsUpdatedHandler);
      eventBus.on('game-controls:unmounted', this._controlsUnmountedHandler);

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
      this.gameManager.off("beforeWait");
      this.gameManager.off("historyUpdate");

      // 移除设置变化监听器
      if (this._settingsChangeHandler) {
        gameSettingsManager.removeListener(this._settingsChangeHandler);
      }

      // 清理事件总线监听器
      if (this._controlsCreatedHandler) {
        eventBus.off('game-controls:created', this._controlsCreatedHandler);
      }
      if (this._controlsButtonsUpdatedHandler) {
        eventBus.off('game-controls:buttons-updated', this._controlsButtonsUpdatedHandler);
      }
      if (this._controlsUnmountedHandler) {
        eventBus.off('game-controls:unmounted', this._controlsUnmountedHandler);
      }

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
        // 获取当前游戏名称
        const currentGame = this.$route?.path?.substring(1) || '';
        
        return {
          title: this.title,
          gameControlsConfig: this.gameControlsConfig,
          winflag: this.winflag,
          loseflag: this.loseflag,
          drawflag: this.drawflag,
          step: this.step,
          gameRule: gameRules[currentGame],
          gameControlsButtons: this.gameControlsButtons,
        };
      },
      
      // 从事件总线收集的按钮配置，用于getAvailableActions
      collectedGameButtons() {
        const uniqueButtons = new Map();
        
        // 从事件总线收集的按钮配置
        Object.values(this.gameControlsButtons).forEach(buttons => {
          if (buttons && Array.isArray(buttons)) {
            buttons.forEach(button => {
              if (button.action) {
                uniqueButtons.set(button.action, button);
              }
            });
          }
        });
        
        return Array.from(uniqueButtons.values());
      },

      ...baseComponent.computed,
      ...computed,
    },

    // 扩展methods
    methods: {
      getCardPlaceholderText,
      // 设置随机数种子
      setSeed(seed) {
        this.seed = seed;
        setSeed(seed);
      },
      
      // 统一的等待方法 - 委托给gameManager处理
      async wait(delay = null) {
        return this.gameManager.wait(delay);
      },
      
      // 统一的撤销方法
      undo() {
        this.gameManager.undo();
      },

      // 统一的自动模式方法
      async pass() {
        this.gameManager.isAutoRunning ? this.gameManager.stopAuto() : await this.gameManager.startAuto(async () => {
          // 使用replacer处理循环引用和特殊对象
          let seen = new WeakMap(); // 使用WeakMap记录路径
          let pathStack = []; // 记录当前路径
          
          const replacer = function(key, value) {
            // 跳过以_开头的属性
            if (typeof key === 'string' && key.startsWith('_')) {
              return undefined;
            }
            
            // 处理对象循环引用
            if (typeof value === 'object' && value !== null) {
              if (seen.has(value)) {
                return undefined; // 跳过循环引用
              }
              
              const currentPath = pathStack.join('.') + (key ? '.' + key : '');
              seen.set(value, currentPath);
              pathStack.push(key);
            }
            
            return value;
          };
          const beforeState = JSON.stringify(this.$data, replacer);
          await this.stepFn();
          seen = new WeakMap(); // 使用WeakMap记录路径
          pathStack = []; // 记录当前路径
          const afterState = JSON.stringify(this.$data, replacer);
          
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

      /**
       * 从 localStorage 加载延迟设置
       */
      loadDelaySettings() {
        const currentGame = this.$route?.path?.substring(1) || '';
        const delay = gameSettingsManager.getDelay(currentGame);
        this.gameManager.setAutoStepDelay(delay);
      },

      /**
       * 处理设置变化事件
       */
      handleSettingsChanged(settings) {
        const currentGame = this.$route?.path?.substring(1) || '';
        
        // 如果是应用到所有游戏，或者是针对当前游戏的设置，则更新
        if (settings.applyToAll || settings.gameName === currentGame) {
          this.gameManager.setAutoStepDelay(settings.delay);
        }
      },
      
      /**
       * 处理GameControls组件挂载事件
       */
      handleControlsCreated(data) {
        this.gameControlsButtons[data.instanceId] = data.buttons;
      },
      
      /**
       * 处理GameControls组件按钮更新事件
       */
      handleControlsButtonsUpdated(data) {
        this.gameControlsButtons[data.instanceId] = data.buttons;
      },
      
      /**
       * 处理GameControls组件卸载事件
       */
      handleControlsUnmounted(data) {
        delete this.gameControlsButtons[data.instanceId];
      },
      
      /**
       * 统一的获取可用操作方法
       * 用于终端交互式游戏
       */
      getAvailableActions() {
        const actions = [];
        const actionToMethodMap = {
          'undo': 'undo',
          'goon': 'goon',
          'step': 'stepFn',
          'auto': 'pass'
        };
        
        // 首先尝试从事件总线获取按钮配置
        if (this.collectedGameButtons.length > 0) {
          this.collectedGameButtons.forEach((button, index) => {
            const methodName = actionToMethodMap[button.action] || button.action;
            if (this[methodName] && typeof this[methodName] === 'function') {
              actions.push({
                id: index + 1, // 使用从1开始的序号
                label: button.label || `${button.action.toUpperCase()}`,
                method: methodName,
                args: [], // 默认空数组
                disabled: button.disabled || false,
                description: button.description || buttonDescriptions[button.action] || '未知功能'
              });
            } else {
              console.log(`未找到方法 ${methodName} 对应的操作按钮 ${button.action}`);
            }
          });
        }
        
        // 如果从事件总线没有获取到足够的按钮配置，使用默认配置
        if (actions.length === 0) {
          // 默认按钮配置
          const defaultButtons = [
            { action: 'undo', label: '撤销 (◀︎)', disabled: this.undoDisabled, description: buttonDescriptions.undo },
            { action: 'goon', label: '重新开始 (RESTART)', disabled: this.restartDisabled || false, description: buttonDescriptions.goon },
            { action: 'step', label: '单步执行 (►)', disabled: this.stepDisabled || false, description: buttonDescriptions.step },
            { action: 'auto', label: (this.gameManager?.isAutoRunning || false) ? '停止自动 (STOP)' : '自动运行 (AUTO)', disabled: this.autoDisabled || false, description: buttonDescriptions.auto }
          ];
          
          defaultButtons.forEach((button, index) => {
            // 只添加游戏支持的按钮
            if ((hasUndo || button.action !== 'undo') && (hasRestart || button.action !== 'goon')) {
              const methodName = actionToMethodMap[button.action] || button.action;
              actions.push({
                id: index + 1,
                label: button.label,
                method: methodName,
                args: [],
                disabled: button.disabled,
                description: button.description
              });
            }
          });
        }
        
        // 过滤掉禁用的按钮
        return actions.filter(a => !a.disabled);
      },
      
      /**
       * 向事件总线发送自定义按钮配置
       * 用于添加游戏特定的按钮配置
       */
      sendCustomButtonsToEventBus(buttons) {
        if (!Array.isArray(buttons)) return;
        
        // 生成唯一的instanceId
        const instanceId = `custom_buttons_${this.title}_${Date.now()}`;
        
        // 向事件总线发送按钮配置
        eventBus.emit('game-controls:buttons-updated', {
          instanceId,
          buttons: buttons.map(button => ({
            ...button,
            id: undefined, // 确保移除id，使用序号
            args: button.args || [] // 确保有默认空数组
          }))
        });
        
        // 在组件卸载时清理
        const cleanupHandler = () => {
          eventBus.emit('game-controls:unmounted', { instanceId });
        };
        
        // 确保在组件卸载时清理
        const originalBeforeUnmount = this.beforeUnmount;
        this.beforeUnmount = function() {
          cleanupHandler();
          if (originalBeforeUnmount && typeof originalBeforeUnmount === 'function') {
            originalBeforeUnmount.call(this);
          }
        };
        
        return instanceId;
      },

      ...baseComponent.methods,
      ...methods,
    },
  };
}

// 从单独的模块导入预设和模板生成器，保持向后兼容性
export * from './gameComponentPresets.js';
