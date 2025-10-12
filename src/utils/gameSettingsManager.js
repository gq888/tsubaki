/**
 * 游戏设置管理器
 * 统一管理游戏延迟设置的存储和读取
 */

class GameSettingsManager {
  constructor() {
    this.listeners = [];
  }

  /**
   * 获取指定游戏的延迟设置
   * @param {string} gameName - 游戏名称
   * @returns {number} 延迟时间（毫秒）
   */
  getDelay(gameName) {
    // 优先查找游戏特定设置
    const gameDelay = localStorage.getItem(`game-delay-${gameName}`);
    if (gameDelay) {
      return parseInt(gameDelay);
    }

    // 其次查找全局设置
    const globalDelay = localStorage.getItem('game-global-delay');
    if (globalDelay) {
      return parseInt(globalDelay);
    }

    // 返回默认值
    return 500;
  }

  /**
   * 保存延迟设置
   * @param {string} gameName - 游戏名称（如果为空则为全局设置）
   * @param {number} delay - 延迟时间（毫秒）
   * @param {boolean} applyToAll - 是否应用到所有游戏
   */
  saveDelay(gameName, delay, applyToAll = false) {
    if (applyToAll) {
      // 应用到全部游戏
      localStorage.setItem('game-global-delay', delay.toString());
      // 清除所有游戏特定的设置
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('game-delay-') && key !== 'game-global-delay') {
          localStorage.removeItem(key);
        }
      });
    } else {
      // 仅应用到当前游戏
      if (gameName) {
        localStorage.setItem(`game-delay-${gameName}`, delay.toString());
      }
    }

    // 通知所有监听器
    this.notifyListeners(delay, applyToAll, gameName);
  }

  reset() {
    localStorage.clear();
  }

  /**
   * 添加设置变化监听器
   * @param {Function} callback - 回调函数
   */
  addListener(callback) {
    this.listeners.push(callback);
  }

  /**
   * 移除设置变化监听器
   * @param {Function} callback - 回调函数
   */
  removeListener(callback) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * 通知所有监听器
   * @param {number} delay - 延迟时间
   * @param {boolean} applyToAll - 是否应用到所有游戏
   * @param {string} gameName - 游戏名称
   */
  notifyListeners(delay, applyToAll, gameName) {
    this.listeners.forEach(callback => {
      try {
        callback({ delay, applyToAll, gameName });
      } catch (error) {
        console.error('Error in settings listener:', error);
      }
    });
  }
}

// 导出单例
export default new GameSettingsManager();
