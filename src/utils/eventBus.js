// 简单的事件总线实现
class EventBus {
  constructor() {
    this.events = {};
  }

  // 订阅事件
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  // 取消订阅
  off(event, callback) {
    if (!this.events[event]) return;
    
    if (callback) {
      // 移除特定回调
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    } else {
      // 移除所有回调
      delete this.events[event];
    }
  }

  // 发布事件
  emit(event, ...args) {
    if (!this.events[event]) return;
    
    this.events[event].forEach(callback => {
      callback(...args);
    });
  }
}

// 导出单例实例
export default new EventBus();