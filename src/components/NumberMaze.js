import { shuffleCards } from "../utils/help.js";
import { GameComponentPresets } from "../utils/gameComponentFactory.js";

/**
 * NumberMaze对象定义了数字迷宫游戏的基础组件，将传递给GameComponentPresets.puzzleGame工厂函数
 * 工厂函数会为该组件添加游戏管理、按钮控制、自动操作等功能
 * 
 * 游戏规则：
 * 1. 6x6网格包含起点(0)、终点(35)和数字方块
 * 2. 数字方块可以向相邻空位移动
 * 3. 需要创建从起点到终点的路径，路径数字必须满足递增关系
 * 4. 当存在有效路径时游戏胜利
 * 5. 提供自动移动功能，智能寻找解决方案
 */

const NumberMaze = {
  name: "NumberMaze",
  data() {
    return {
      title: "Number Maze",
      grid: [], // 6x6网格，-1表示空位
      gridSize: 6,
      numbers: [], // 数字方块数组
      emptyPos: -1, // 空位位置
      targetPath: [], // 目标路径
      pathFound: false, // 是否找到有效路径
      number: 20, // 使用20个数字方块
      
      // 以下属性由工厂函数GameComponentPresets.puzzleGame添加：
      // gameManager: 游戏状态管理器实例，提供游戏状态控制和自动操作功能
      // customButtons: 自定义按钮数组，用于存储游戏控制按钮配置
      // step: 当前游戏步骤计数
      // history: 操作历史记录数组，支持撤销重做功能
    };
  },
  
  // 初始化
  methods: {
    init() {
      this.grid = Array(this.gridSize * this.gridSize).fill(-1);
      this.numbers = [];
      this.emptyPos = -1;
      this.pathFound = false;
      this.targetPath = [];
      
      // 生成数字方块（1-20）
      for (let i = 0; i < this.number; i++) {
        this.numbers.push(i + 1);
      }
      shuffleCards(this.numbers, this.number);
      
      // 随机放置数字方块到网格中（除了起点和终点）
      const availablePositions = [];
      for (let i = 0; i < this.gridSize * this.gridSize; i++) {
        if (i !== 0 && i !== this.gridSize * this.gridSize - 1) { // 0是起点，35是终点
          availablePositions.push(i);
        }
      }
      shuffleCards(availablePositions, availablePositions.length);
      
      // 放置数字方块
      for (let i = 0; i < Math.min(this.number, availablePositions.length); i++) {
        this.grid[availablePositions[i]] = this.numbers[i];
      }
      
      // 设置一个空位（用于移动）
      if (availablePositions.length > this.number) {
        this.emptyPos = availablePositions[this.number];
        this.grid[this.emptyPos] = -1;
      }
      
      // 设置起点和终点标记
      this.grid[0] = 0; // 起点
      this.grid[this.gridSize * this.gridSize - 1] = 99; // 终点
      
      this.autoCalc();
    },
    
    // 获取指定位置的相邻位置
    getNeighbors(pos) {
      const neighbors = [];
      const row = Math.floor(pos / this.gridSize);
      const col = pos % this.gridSize;
      
      // 上
      if (row > 0) neighbors.push(pos - this.gridSize);
      // 下
      if (row < this.gridSize - 1) neighbors.push(pos + this.gridSize);
      // 左
      if (col > 0) neighbors.push(pos - 1);
      // 右
      if (col < this.gridSize - 1) neighbors.push(pos + 1);
      
      return neighbors;
    },
    
    // 移动数字方块
    async moveNumber(fromPos, toPos) {
      console.log('moveNumber called with fromPos:', fromPos, 'toPos:', toPos);
      
      if (this.grid[toPos] !== -1) {
        console.log('moveNumber returning false - target not empty');
        return false; // 目标位置不是空位
      }
      
      // 检查是否相邻
      const neighbors = this.getNeighbors(fromPos);
      console.log('neighbors:', neighbors);
      console.log('toPos in neighbors:', neighbors.includes(toPos));
      
      if (!neighbors.includes(toPos)) {
        console.log('moveNumber returning false - not adjacent');
        return false; // 不相邻
      }
      
      // 获取要移动的数字值
      const numberValue = this.grid[fromPos];
      console.log('numberValue:', numberValue);
      
      // 执行移动
      this.grid[toPos] = numberValue;
      this.grid[fromPos] = -1;
      this.emptyPos = fromPos;
      
      console.log('moveNumber calling recordOperation');
      
      // 记录操作
      this.recordOperation("move", {
        from: fromPos,
        to: toPos,
        number: numberValue
      });
      
      console.log('moveNumber returning true');
      return true;
    },
    
    // 点击数字方块
    clickNumber(pos) {
      console.log('clickNumber called with pos:', pos);
      console.log('grid[pos]:', this.grid[pos]);
      
      if (this.grid[pos] <= 0 || this.grid[pos] === 99) {
        console.log('clickNumber returning early - invalid position');
        return; // 不能移动起点、终点或空位
      }
      
      console.log('clickNumber proceeding with move');
      
      // 找到相邻的空位
      const neighbors = this.getNeighbors(pos);
      let moved = false;
      
      for (const neighbor of neighbors) {
        if (this.grid[neighbor] === -1) {
          // 尝试移动到相邻的空位
          if (this.moveNumber(pos, neighbor)) {
            console.log('moveNumber succeeded to neighbor:', neighbor);
            moved = true;
            break;
          }
        }
      }
      
      if (moved) {
        // 移动成功，检查游戏状态
        this.autoCalc();
      } else {
        console.log('moveNumber failed - no valid adjacent empty position');
      }
    },
    
    // 查找从起点到终点的有效路径
    findValidPath() {
      const start = 0;
      const end = this.gridSize * this.gridSize - 1;
      
      // 使用BFS查找路径
      const queue = [{pos: start, path: [start], value: 0}];
      const visited = new Set([start]);
      
      while (queue.length > 0) {
        const current = queue.shift();
        
        if (current.pos === end) {
          return current.path; // 找到路径
        }
        
        const neighbors = this.getNeighbors(current.pos);
        for (const neighbor of neighbors) {
          if (visited.has(neighbor)) continue;
          
          const neighborValue = this.grid[neighbor];
          if (neighborValue === -1) continue; // 空位
          
          // 检查数字关系：必须递增
          if (neighborValue > current.value && neighborValue !== 99) {
            visited.add(neighbor);
            queue.push({
              pos: neighbor,
              path: [...current.path, neighbor],
              value: neighborValue
            });
          } else if (neighborValue === 99 && current.value > 0) {
            // 到达终点
            visited.add(neighbor);
            queue.push({
              pos: neighbor,
              path: [...current.path, neighbor],
              value: current.value
            });
          }
        }
      }
      
      return null; // 没有找到路径
    },
    
    // 自动计算游戏状态
    autoCalc() {
      const path = this.findValidPath();
      this.pathFound = path !== null;
      this.targetPath = path || [];
      
      if (this.pathFound) {
        this.gameManager.setWin();
      }
    },
    
    // 获取自动移动的下一步
    getNextAutoMove() {
      // 简单的启发式算法：尝试将数字移动到能够创建递增路径的位置
      const currentNumbers = [];
      for (let i = 0; i < this.grid.length; i++) {
        if (this.grid[i] > 0 && this.grid[i] < 99) {
          currentNumbers.push({pos: i, value: this.grid[i]});
        }
      }
      
      // 按值排序
      currentNumbers.sort((a, b) => a.value - b.value);
      
      // 尝试为每个数字找到合适的位置
      for (const num of currentNumbers) {
        const neighbors = this.getNeighbors(num.pos);
        for (const neighbor of neighbors) {
          if (this.grid[neighbor] === -1) {
            // 检查移动后是否能帮助创建路径
            const testGrid = [...this.grid];
            testGrid[neighbor] = num.value;
            testGrid[num.pos] = -1;
            
            // 简单的路径检查
            if (this.hasPotentialPath(testGrid, neighbor)) {
              return {from: num.pos, to: neighbor};
            }
          }
        }
      }
      
      return null;
    },
    
    // 检查是否有潜在的路径可能
    hasPotentialPath(grid, startPos) {
      // 简单的检查：从给定位置开始，看是否能到达终点
      const visited = new Set();
      const queue = [startPos];
      const end = this.gridSize * this.gridSize - 1;
      
      while (queue.length > 0) {
        const current = queue.shift();
        if (current === end) return true;
        
        const neighbors = this.getNeighbors(current);
        for (const neighbor of neighbors) {
          if (visited.has(neighbor)) continue;
          
          const value = grid[neighbor];
          if (value === -1 || value === 99) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
      
      return false;
    },
    
    // 重写stepFn方法，实现自动移动
    async stepFn() {
      await this.gameManager.step(async () => {
        const nextMove = this.getNextAutoMove();
        if (nextMove) {
          await this.moveNumber(nextMove.from, nextMove.to);
          await this.wait();
        } else {
          // 没有有效的自动移动，停止自动模式
          this.gameManager.stopAuto();
        }
      });
    },
    
    // 记录操作
    recordOperation(type, data) {
      console.log('recordOperation called:', type, data);
      console.log('gameManager exists:', !!this.gameManager);
      console.log('gameManager.recordOperation exists:', !!this.gameManager?.recordOperation);
      
      if (this.gameManager && this.gameManager.recordOperation) {
        this.gameManager.recordOperation({
          type: type,
          ...data,
          timestamp: Date.now(),
        });
        console.log('Operation recorded successfully');
      } else {
        console.error('Cannot record operation - gameManager not available');
      }
    },
    
    // 处理撤销操作
    handleUndo(operation) {
      console.log('=== HANDLEUNDO CALLED ===');
      console.log('handleUndo called with operation:', operation);
      console.log('Before undo - grid[5]:', this.grid[5], 'grid[11]:', this.grid[11]);
      switch (operation.type) {
        case "move":
          // 撤销移动操作
          this.grid[operation.from] = operation.number;
          this.grid[operation.to] = -1;
          this.emptyPos = operation.to;
          console.log('Undo completed - moved', operation.number, 'from', operation.to, 'to', operation.from);
          console.log('this.grid after undo:', this.grid[operation.from], this.grid[operation.to]);
          break;
      }
    },
    
    /**
     * 渲染文本视图 - 显示当前游戏状态
     * 用于终端交互式游戏
     */
    renderTextView() {
      console.log('\n╔════════════════════════════════════════════════╗');
      console.log('║              数字迷宫 (Number Maze)           ║');
      console.log('╚════════════════════════════════════════════════╝');
      console.log(`\n步数: ${this.step}\n`);
      
      // 显示6x6网格
      for (let row = 0; row < this.gridSize; row++) {
        let rowStr = '  ';
        for (let col = 0; col < this.gridSize; col++) {
          const pos = row * this.gridSize + col;
          const value = this.grid[pos];
          let cellStr;
          
          if (value === 0) {
            cellStr = '[起]'; // 起点
          } else if (value === 99) {
            cellStr = '[终]'; // 终点
          } else if (value === -1) {
            cellStr = '[  ]'; // 空位
          } else {
            cellStr = `[${value.toString().padStart(2, '0')}]`;
          }
          
          // 标记路径中的位置
          if (this.targetPath.includes(pos)) {
            cellStr = cellStr.replace('[', '*[').replace(']', ']*');
          }
          
          rowStr += cellStr + ' ';
        }
        console.log(rowStr);
      }
      
      console.log(`\n空位位置: ${this.emptyPos + 1}`);
      console.log(`路径状态: ${this.pathFound ? '✓ 找到有效路径' : '✗ 未找到路径'}`);
      
      if (this.pathFound && this.targetPath.length > 0) {
        const pathValues = this.targetPath.map(pos => {
          const value = this.grid[pos];
          return value === 0 ? '起' : value === 99 ? '终' : value;
        });
        console.log(`路径: ${pathValues.join(' → ')}`);
      }
      
      return '渲染完成';
    },
  },
  
  computed: {
    // 计算当前数字数量
    currentNumberCount() {
      let count = 0;
      for (let i = 0; i < this.grid.length; i++) {
        if (this.grid[i] > 0 && this.grid[i] < 99) {
          count++;
        }
      }
      return count;
    },
    
    // 计算网格状态（用于状态检测）
    gridState() {
      return this.grid.join(',');
    }
  }
};

// 使用工厂函数创建增强的NumberMaze组件并导出
export default GameComponentPresets.puzzleGame(NumberMaze, 800);

/**
 * 工厂函数GameComponentPresets.puzzleGame为NumberMaze组件添加的功能：
 * 
 * 基础增强功能（来自createEnhancedGameComponent）：
 * - gameManager属性：提供游戏状态管理、自动模式控制和步骤执行
 * - customButtons属性：存储自定义按钮配置
 * - displayButtons计算属性：决定显示哪些游戏控制按钮
 * - gameControlsConfig计算属性：游戏控制配置
 * - wait()、pass()、goon()等方法：游戏控制方法
 * - created和beforeUnmount生命周期钩子：管理游戏状态和事件监听
 * 
 * puzzleGame特有功能：
 * - step属性：游戏步骤计数器
 * - history属性：操作历史记录数组
 * - 支持撤销重做功能
 * - 提供益智游戏相关的自动操作和状态管理
 * - 支持自动步骤延迟配置（此处设置为800ms）
 */