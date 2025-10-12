# 游戏状态管理工具

这个目录包含游戏状态管理相关的工具类，用于统一管理游戏状态、历史记录、撤销重做等功能。

## 游戏状态管理类 (GameStateManager)

`gameStateManager.js` 提供了一个统一的游戏状态管理类，可以用于各种游戏组件中，简化游戏状态管理逻辑。

### 主要功能

- 统一管理游戏状态标志（如：hitflag, winflag, isAutoRunning等）
- 管理游戏历史记录，支持撤销操作
- 提供自动模式，支持自动执行游戏步骤
- 事件系统，支持状态变化监听
- 统一的游戏控制方法（撤销、重置、单步、自动等）

### 如何使用

1. 导入游戏状态管理类

```javascript
import GameStateManager from './gameStateManager.js';
```

2. 创建游戏状态管理器实例

```javascript
// 在Vue组件的data中初始化
this.gameManager = new GameStateManager({
  autoStepDelay: 1000 // 设置自动模式每步的延迟时间（毫秒）
});
```

3. 注册事件监听器

```javascript
created() {
  // 注册事件监听器
  this.gameManager.on('win', this.handleWin);
  this.gameManager.on('lose', this.handleLose);
  this.gameManager.on('draw', this.handleDraw);
  this.gameManager.on('undo', this.handleUndo);
  this.gameManager.on('stateChange', this.handleStateChange);
},

beforeUnmount() {
  // 移除事件监听器，防止内存泄漏
  this.gameManager.off('win', this.handleWin);
  this.gameManager.off('lose', this.handleLose);
  this.gameManager.off('draw', this.handleDraw);
  this.gameManager.off('undo', this.handleUndo);
  this.gameManager.off('stateChange', this.handleStateChange);
  
  // 停止自动模式
  this.gameManager.stopAuto();
}
```

4. 使用游戏状态管理器的方法

```javascript
// 记录操作
this.gameManager.recordOperation({
  type: 'move',
  from: from,
  to: to,
  card: card
});

// 撤销操作
this.gameManager.undo();

// 重置游戏
this.gameManager.reset(() => {
  this.initGame();
});

// 单步操作
await this.gameManager.step(() => {
  return this.executeAIStep();
});

// 自动模式
this.gameManager.startAuto(() => {
  return this.executeAIStep();
});

// 设置游戏结果
this.gameManager.setWin();  // 胜利
this.gameManager.setLose(); // 失败
this.gameManager.setDraw(); // 平局
```

5. 使用计算属性获取游戏状态

```javascript
computed: {
  gameState() {
    return this.gameManager.getState();
  },
  
  undoDisabled() {
    return !this.gameManager.canUndo();
  },
  
  restartDisabled() {
    return !this.gameManager.hitflag || this.gameManager.isAutoRunning;
  },
  
  // 用于模板的便捷计算属性
  canOperate() {
    return this.gameManager.hitflag && !this.gameManager.isAutoRunning;
  }
}
```

### API 文档

#### 构造函数

```javascript
new GameStateManager(options)
```

- `options` (可选): 配置选项
  - `autoStepDelay`: 自动模式下每步的延迟时间（毫秒），默认为500毫秒

#### 游戏状态管理方法

- `init()`: 初始化游戏状态
- `getState()`: 获取当前游戏状态
- `setState(state)`: 设置游戏状态
- `recordOperation(operation)`: 记录游戏操作到历史记录
- `undo()`: 撤销上一步操作
- `getStepCount()`: 获取历史记录长度
- `canUndo()`: 判断是否可以撤销

#### 游戏控制方法

- `reset(resetCallback)`: 重置游戏
- `step(stepCallback)`: 执行单步操作
- `startAuto(stepCallback)`: 启动自动模式
- `stopAuto()`: 停止自动模式
- `setWin()`: 设置游戏胜利
- `setLose()`: 设置游戏失败
- `setDraw()`: 设置游戏平局

#### 事件系统方法

- `on(event, listener)`: 添加事件监听器
- `off(event, listener)`: 移除事件监听器
- `emit(event, data)`: 触发事件

#### 事件列表

- `init`: 游戏初始化时触发
- `win`: 游戏胜利时触发
- `lose`: 游戏失败时触发
- `draw`: 游戏平局时触发
- `undo`: 撤销操作时触发
- `autoStart`: 自动模式开始时触发
- `autoStop`: 自动模式停止时触发
- `historyUpdate`: 历史记录更新时触发
- `stateChange`: 游戏状态变化时触发
- `reset`: 游戏重置时触发

## 示例文件

`gameStateExample.js` 提供了一个完整的示例，展示了如何在Vue组件中集成和使用GameStateManager类来管理游戏状态。

## 如何在现有游戏组件中集成

1. 在游戏组件中导入GameStateManager
2. 创建gameManager实例并初始化
3. 将原来的游戏状态标志（hitflag, lockflag等）替换为gameManager中的相应属性
4. 将原来的撤销、重置等逻辑替换为gameManager的相应方法
5. 注册事件监听器来处理游戏状态变化
6. 更新GameControls组件的props，使用gameManager的状态来控制按钮的可用状态

通过这种方式，可以统一管理游戏状态，简化代码结构，提高代码的可维护性。