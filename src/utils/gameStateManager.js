import { wait } from "./help.js";

/**
 * 游戏状态管理类
 * 统一管理游戏状态、历史记录、撤销重做等功能
 */
export default class GameStateManager {
  constructor(options = {}) {
    // 游戏状态标志
    this.hitflag = true; // 是否可以操作
    this.lockflag = true; // 是否锁定
    this.winflag = false; // 胜利标志
    this.loseflag = false; // 失败标志
    this.drawflag = false; // 平局标志

    // 历史记录
    this.history = [];

    // 自动模式相关
    this.isAutoRunning = false;
    this.autoInterval = null;
    this.autoStepDelay = options.autoStepDelay / 10 || 500; // 默认单步延迟500ms，测试时除以10以缩短测试时间

    // 事件监听器
    this.listeners = {};
  }

  /**
   * 初始化游戏状态
   */
  init() {
    this.hitflag = true;
    this.lockflag = true;
    this.winflag = false;
    this.loseflag = false;
    this.drawflag = false;
    this.history = [];
    this.stopAuto();
    this.emit("init");
  }

  /**
   * 记录游戏操作到历史记录
   * @param {Object} operation - 操作对象
   */
  recordOperation(operation, backword = false) {
    backword ? this.history.unshift(operation) : this.history.push(operation);
    this.emit("historyUpdate", this.history);
  }

  /**
   * 撤销上一步操作
   * @returns {Object|null} 撤销的操作对象，如果没有历史记录则返回null
   */
  undo() {
    if (this.history.length === 0) {
      return null;
    }

    const operation = this.history.pop();
    this.emit("undo", operation);
    this.emit("historyUpdate", this.history);

    // 撤销后重置游戏状态标志
    this.winflag = false;
    this.loseflag = false;
    this.drawflag = false;

    return operation;
  }

  /**
   * 获取历史记录长度
   * @returns {number} 历史记录长度
   */
  getStepCount() {
    return this.history.length;
  }

  /**
   * 判断是否可以撤销
   * @returns {boolean} 是否可以撤销
   */
  canUndo() {
    return this.history.length > 0 && this.hitflag && this.lockflag;
  }

  /**
   * 启动自动模式
   * @param {Function} stepCallback - 每一步的回调函数
   */
  async startAuto(stepCallback) {
    if (this.isAutoRunning || this.winflag || this.loseflag || this.drawflag) {
      console.log(`startAuto被跳过: isAutoRunning=${this.isAutoRunning}, win=${this.winflag}, lose=${this.loseflag}, draw=${this.drawflag}`);
      return;
    }

    console.log('开始自动模式...');
    this.isAutoRunning = true;
    this.lockflag = false;
    this.emit("autoStart");

    let stepCount = 0;
    const maxSteps = 1000; // 防止无限循环

    try {
      while (
        this.isAutoRunning &&
        !this.winflag &&
        !this.loseflag &&
        !this.drawflag &&
        stepCount < maxSteps
      ) {
        await stepCallback();
        stepCount++;
        
        await wait(this.autoStepDelay);
      }
      
      if (stepCount >= maxSteps) {
        console.log(`达到最大步数${maxSteps}`);
        this.stopAuto();
      }
    } catch (error) {
      console.error("Auto mode error:", error);
    } finally {
      console.log(`自动模式结束，总共执行了${stepCount}步`);
      this.stopAuto();
    }
  }

  /**
   * 停止自动模式
   */
  stopAuto() {
    if (!this.isAutoRunning) {
      return;
    }

    this.isAutoRunning = false;
    this.lockflag = true;
    if (this.autoInterval) {
      clearInterval(this.autoInterval);
      this.autoInterval = null;
    }

    this.emit("autoStop");
  }

  /**
   * 执行单步操作
   * @param {Function} stepCallback - 单步操作的回调函数
   */
  async step(stepCallback) {
    if (!this.hitflag || this.winflag || this.loseflag || this.drawflag) {
      return;
    }

    this.hitflag = false;
    try {
      await stepCallback();
    } catch (error) {
      console.error("Step error:", error);
    } finally {
      this.hitflag = true;
    }
  }

  /**
   * 设置游戏胜利
   */
  setWin() {
    this.winflag = true;
    this.stopAuto();
    this.emit("win");
  }

  /**
   * 设置游戏失败
   */
  setLose() {
    this.loseflag = true;
    this.stopAuto();
    this.emit("lose");
  }

  /**
   * 设置游戏平局
   */
  setDraw() {
    this.drawflag = true;
    this.stopAuto();
    this.emit("draw");
  }

  /**
   * 重置游戏
   * @param {Function} resetCallback - 重置游戏的回调函数
   */
  reset(resetCallback) {
    this.stopAuto();
    this.init();
    if (resetCallback) {
      resetCallback();
    }
    this.emit("reset");
  }

  /**
   * 添加事件监听器
   * @param {string} event - 事件名称
   * @param {Function} listener - 事件监听器
   */
  on(event, listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} listener - 要移除的事件监听器
   */
  off(event, listener) {
    if (!this.listeners[event]) {
      return;
    }
    const index = this.listeners[event].indexOf(listener);
    if (index > -1) {
      this.listeners[event].splice(index, 1);
    }
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  emit(event, data) {
    if (!this.listeners[event]) {
      return;
    }
    this.listeners[event].forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  /**
   * 获取当前游戏状态
   * @returns {Object} 游戏状态对象
   */
  getState() {
    return {
      hitflag: this.hitflag,
      lockflag: this.lockflag,
      winflag: this.winflag,
      loseflag: this.loseflag,
      drawflag: this.drawflag,
      step: this.getStepCount(),
      isAutoRunning: this.isAutoRunning,
    };
  }

  /**
   * 设置游戏状态
   * @param {Object} state - 要设置的游戏状态
   */
  setState(state) {
    Object.assign(this, state);
    this.emit("stateChange", this.getState());
  }

  /**
   * 获取默认计算属性对象
   * 供Vue组件使用扩展运算符导入
   * @returns {Object} 默认计算属性对象
   */
  static getDefaultComputedProperties() {
    return {
      // 基础状态标志
      hitflag() {
        const manager = this.gameManager;
        return manager ? manager.hitflag : true;
      },

      lockflag() {
        const manager = this.gameManager;
        return manager ? manager.lockflag : true;
      },

      winflag() {
        const manager = this.gameManager;
        return manager ? manager.winflag : false;
      },

      loseflag() {
        const manager = this.gameManager;
        return manager ? manager.loseflag : false;
      },

      drawflag() {
        const manager = this.gameManager;
        return manager ? manager.drawflag : false;
      },

      // 步数计算属性
      step() {
        const manager = this.gameManager;
        return manager ? manager.getStepCount() : 0;
      },

      // 按钮禁用状态计算属性
      undoDisabled() {
        const manager = this.gameManager;
        return !manager || !manager.canUndo();
      },

      restartDisabled() {
        const manager = this.gameManager;
        return !manager || !manager.hitflag || !manager.lockflag;
      },

      stepDisabled() {
        const manager = this.gameManager;
        return (
          !manager ||
          !manager.hitflag ||
          !manager.lockflag ||
          manager.winflag ||
          manager.loseflag ||
          manager.drawflag
        );
      },

      autoDisabled() {
        const manager = this.gameManager;
        return (
          !manager ||
          !manager.hitflag ||
          !manager.lockflag ||
          manager.winflag ||
          manager.loseflag ||
          manager.drawflag ||
          manager.isAutoRunning
        );
      },

      // 游戏状态
      gameState() {
        const manager = this.gameManager;
        return manager ? manager.getState() : {};
      },
    };
  }
}
