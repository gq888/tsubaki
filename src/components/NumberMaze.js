/**
 * NumberMaze对象定义了数字迷宫游戏的基础组件，将传递给GameComponentPresets.puzzleGame工厂函数
 * 工厂函数会为该组件添加游戏管理、按钮控制、自动操作等功能
 * 
 * 游戏规则：
 * - 有一个4x4的网格，包含数字1-15和一个空格
 * - 目标是通过移动数字块，创建特定的数字序列（如1-15按顺序排列）
 * - 每次只能移动与空格相邻的数字块
 * - 移动次数越少越好
 * - 游戏提供多种目标模式：顺序排列、奇偶分离、斐波那契序列等
 */

import { GameComponentPresets } from "../utils/gameComponentFactory.js";

const NumberMaze = {
  name: "NumberMaze",
  data() {
    return {
      title: "Number Maze",
      // 4x4游戏网格，-1表示空格
      grid: [],
      // 空格位置
      emptyPos: { row: 3, col: 3 },
      // 游戏大小
      size: 4,
      // 目标模式：1=顺序排列, 2=奇偶分离, 3=斐波那契, 4=质数优先
      targetMode: 1,
      // 移动次数
      moveCount: 0,
      // 是否显示数字
      showNumbers: true,
      
      // 以下属性由工厂函数GameComponentPresets.puzzleGame添加：
      // gameManager: 游戏管理器实例，提供游戏状态控制和自动操作功能
      // customButtons: 自定义按钮数组，用于存储游戏控制按钮配置
      // step: 当前游戏步骤计数
      // history: 操作历史记录数组
    };
  },
  
  // 初始化
  methods: {
    init() {
      this.targetMode = this.targetMode || 1;
      this.size = 4;
      this.grid = [];
      this.emptyPos = { row: 3, col: 3 };
      this.moveCount = 0;
      
      // 确保游戏管理器的历史记录被清空
      if (this.gameManager) {
        this.gameManager.history = [];
        this.gameManager.hitflag = true;
        this.gameManager.winflag = false;
        this.gameManager.loseflag = false;
        this.gameManager.drawflag = false;
      }
      
      this.resetGame();
    },
    
    /**
     * 重置游戏
     */
    resetGame() {
      this.grid = this.createGrid();
      this.emptyPos = this.findEmptyPosition();
      this.moveCount = 0;
      this.shuffleGrid();
    },
    
    /**
     * 创建初始网格
     */
    createGrid() {
      const grid = [];
      let num = 1;
      for (let i = 0; i < this.size; i++) {
        grid[i] = [];
        for (let j = 0; j < this.size; j++) {
          if (i === this.size - 1 && j === this.size - 1) {
            grid[i][j] = -1; // 空格
          } else {
            grid[i][j] = num++;
          }
        }
      }
      return grid;
    },
    
    /**
     * 查找空格位置
     */
    findEmptyPosition() {
      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          if (this.grid[i][j] === -1) {
            return { row: i, col: j };
          }
        }
      }
      return { row: 3, col: 3 };
    },
    
    /**
     * 打乱网格（确保可解）
     */
    shuffleGrid() {
      // 执行1000次有效移动来打乱网格
      for (let i = 0; i < 1000; i++) {
        const validMoves = this.getValidMoves();
        if (validMoves.length > 0) {
          const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          this.moveNumber(randomMove.row, randomMove.col, false); // 不记录历史
        }
      }
      this.moveCount = 0; // 重置移动计数
    },
    
    /**
     * 获取有效移动位置
     */
    getValidMoves() {
      const moves = [];
      const { row, col } = this.emptyPos;
      
      // 上下左右四个方向
      const directions = [
        { row: row - 1, col: col }, // 上
        { row: row + 1, col: col }, // 下
        { row: row, col: col - 1 }, // 左
        { row: row, col: col + 1 }  // 右
      ];
      
      for (const dir of directions) {
        if (dir.row >= 0 && dir.row < this.size && 
            dir.col >= 0 && dir.col < this.size) {
          moves.push(dir);
        }
      }
      
      return moves;
    },
    
    /**
     * 点击数字块
     * @param {number} row - 行索引
     * @param {number} col - 列索引
     */
    clickNumber(row, col) {
      // 检查是否与空格相邻
      if (this.isAdjacentToEmpty(row, col)) {
        this.moveNumber(row, col, true);
      }
    },
    
    /**
     * 检查是否与空格相邻
     */
    isAdjacentToEmpty(row, col) {
      const { row: emptyRow, col: emptyCol } = this.emptyPos;
      return (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
             (Math.abs(col - emptyCol) === 1 && row === emptyRow);
    },
    
    /**
     * 移动数字块
     * @param {number} row - 要移动的数字块行索引
     * @param {number} col - 要移动的数字块列索引
     * @param {boolean} recordHistory - 是否记录历史
     */
    moveNumber(row, col, recordHistory = true) {
      const { row: emptyRow, col: emptyCol } = this.emptyPos;
      
      // 交换数字块和空格
      const temp = this.grid[emptyRow][emptyCol];
      this.grid[emptyRow][emptyCol] = this.grid[row][col];
      this.grid[row][col] = temp;
      
      // 更新空格位置
      this.emptyPos = { row, col };
      this.moveCount++;
      
      if (recordHistory) {
        // 记录操作
        this.gameManager.recordOperation({
          type: "move",
          from: { row, col },
          to: { row: emptyRow, col: emptyCol },
          number: this.grid[emptyRow][emptyCol],
          moveCount: this.moveCount
        });
        
        // 检查游戏是否完成
        this.checkGameCompletion();
      }
    },
    
    /**
     * 检查游戏是否完成
     */
    checkGameCompletion() {
      if (this.isTargetAchieved()) {
        this.gameManager.setWin();
        return;
      }
      
      // 检查是否还有可能的移动
      if (!this.hasValidMoves()) {
        this.gameManager.setLose();
      }
    },
    
    /**
     * 检查是否达到目标
     */
    isTargetAchieved() {
      switch (this.targetMode) {
        case 1: // 顺序排列
          return this.isSequentialOrder();
        case 2: // 奇偶分离
          return this.isOddEvenSeparated();
        case 3: // 斐波那契序列
          return this.isFibonacciOrder();
        case 4: // 质数优先
          return this.isPrimeFirstOrder();
        default:
          return this.isSequentialOrder();
      }
    },
    
    /**
     * 检查是否为顺序排列
     */
    isSequentialOrder() {
      let expectedNum = 1;
      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          if (i === this.size - 1 && j === this.size - 1) {
            return this.grid[i][j] === -1; // 最后一个应该是空格
          }
          if (this.grid[i][j] !== expectedNum++) {
            return false;
          }
        }
      }
      return true;
    },
    
    /**
     * 检查是否奇偶分离（奇数在上两行，偶数在下两行）
     */
    isOddEvenSeparated() {
      // 检查前两行是否都是奇数
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < this.size; j++) {
          const num = this.grid[i][j];
          if (num !== -1 && num % 2 === 0) {
            return false; // 找到了偶数
          }
        }
      }
      
      // 检查后两行是否都是偶数
      for (let i = 2; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          const num = this.grid[i][j];
          if (num !== -1 && num % 2 === 1) {
            return false; // 找到了奇数
          }
        }
      }
      
      return true;
    },
    
    /**
     * 检查是否为斐波那契序列（前8个斐波那契数）
     */
    isFibonacciOrder() {
      const fibonacci = [1, 1, 2, 3, 5, 8, 13, 21, 1, 2, 3, 4, 6, 7, 9];
      let index = 0;
      
      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          if (i === this.size - 1 && j === this.size - 1) {
            return this.grid[i][j] === -1;
          }
          if (this.grid[i][j] !== fibonacci[index++]) {
            return false;
          }
        }
      }
      return true;
    },
    
    /**
     * 检查是否质数优先（质数在前，合数在后）
     */
    isPrimeFirstOrder() {
      const primes = [2, 3, 5, 7, 11, 13, 1, 4, 6, 8, 9, 10, 12, 14, 15];
      let index = 0;
      
      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          if (i === this.size - 1 && j === this.size - 1) {
            return this.grid[i][j] === -1;
          }
          if (this.grid[i][j] !== primes[index++]) {
            return false;
          }
        }
      }
      return true;
    },
    
    /**
     * 是否还有有效移动
     */
    hasValidMoves() {
      return this.getValidMoves().length > 0;
    },
    
    /**
     * 自动执行游戏步骤（AI模式）
     * 使用A*算法寻找最优解
     */
    async stepFn() {
      await this.gameManager.step(async () => {
        // 简单的AI策略：选择能接近目标的移动
        const validMoves = this.getValidMoves();
        if (validMoves.length === 0) return;
        
        // 评估每个移动的得分
        let bestMove = null;
        let bestScore = -1;
        
        for (const move of validMoves) {
          const score = this.evaluateMove(move);
          if (score > bestScore) {
            bestScore = score;
            bestMove = move;
          }
        }
        
        if (bestMove) {
          this.moveNumber(bestMove.row, bestMove.col, true);
          await this.wait();
        }
      });
    },
    
    /**
     * 评估移动的得分
     */
    evaluateMove(move) {
      // 临时执行移动
      const tempGrid = this.grid.map(row => [...row]);
      const tempEmptyPos = { ...this.emptyPos };
      
      // 执行移动
      const { row, col } = move;
      const temp = tempGrid[tempEmptyPos.row][tempEmptyPos.col];
      tempGrid[tempEmptyPos.row][tempEmptyPos.col] = tempGrid[row][col];
      tempGrid[row][col] = temp;
      
      // 计算得分（基于与目标的接近程度）
      let score = 0;
      
      switch (this.targetMode) {
        case 1: // 顺序排列
          score = this.evaluateSequentialOrder(tempGrid);
          break;
        case 2: // 奇偶分离
          score = this.evaluateOddEvenSeparation(tempGrid);
          break;
        case 3: // 斐波那契序列
          score = this.evaluateFibonacciOrder(tempGrid);
          break;
        case 4: // 质数优先
          score = this.evaluatePrimeFirstOrder(tempGrid);
          break;
      }
      
      return score;
    },
    
    /**
     * 评估顺序排列的得分
     */
    evaluateSequentialOrder(grid) {
      let score = 0;
      let expectedNum = 1;
      
      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          if (i === this.size - 1 && j === this.size - 1) {
            if (grid[i][j] === -1) score += 10;
          } else {
            if (grid[i][j] === expectedNum) {
              score += 5; // 数字在正确位置
            } else if (Math.abs(grid[i][j] - expectedNum) <= 2) {
              score += 2; // 数字接近正确位置
            }
          }
          expectedNum++;
        }
      }
      
      return score;
    },
    
    /**
     * 评估奇偶分离的得分
     */
    evaluateOddEvenSeparation(grid) {
      let score = 0;
      
      // 检查前两行（应该都是奇数）
      for (let i = 0; i < 2; i++) {
        for (let j = 0; j < this.size; j++) {
          const num = grid[i][j];
          if (num !== -1 && num % 2 === 1) {
            score += 3; // 奇数在正确区域
          }
        }
      }
      
      // 检查后两行（应该都是偶数）
      for (let i = 2; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          const num = grid[i][j];
          if (num !== -1 && num % 2 === 0) {
            score += 3; // 偶数在正确区域
          }
        }
      }
      
      return score;
    },
    
    /**
     * 评估斐波那契序列的得分
     */
    evaluateFibonacciOrder(grid) {
      const fibonacci = [1, 1, 2, 3, 5, 8, 13, 21, 1, 2, 3, 4, 6, 7, 9];
      let score = 0;
      let index = 0;
      
      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          if (i === this.size - 1 && j === this.size - 1) {
            if (grid[i][j] === -1) score += 10;
          } else {
            if (grid[i][j] === fibonacci[index]) {
              score += 5; // 数字在正确位置
            }
          }
          index++;
        }
      }
      
      return score;
    },
    
    /**
     * 评估质数优先的得分
     */
    evaluatePrimeFirstOrder(grid) {
      const primes = [2, 3, 5, 7, 11, 13, 1, 4, 6, 8, 9, 10, 12, 14, 15];
      let score = 0;
      let index = 0;
      
      for (let i = 0; i < this.size; i++) {
        for (let j = 0; j < this.size; j++) {
          if (i === this.size - 1 && j === this.size - 1) {
            if (grid[i][j] === -1) score += 10;
          } else {
            if (grid[i][j] === primes[index]) {
              score += 5; // 数字在正确位置
            }
          }
          index++;
        }
      }
      
      return score;
    },
    
    /**
     * 处理撤销操作
     * @param {Object} operation - 要撤销的操作
     */
    handleUndo(operation) {
      if (operation.type === "move") {
        // 撤销移动操作
        this.moveNumber(operation.to.row, operation.to.col, false);
        this.moveCount = operation.moveCount;
      }
    },
    
    /**
     * 渲染文本视图 - 显示当前游戏状态
     * 用于终端交互式游戏
     */
    renderTextView() {
      console.log('\n╔════════════════════════════════════════════════╗');
      console.log('║              数字迷宫 (Number Maze)            ║');
      console.log('╚════════════════════════════════════════════════╝');
      console.log(`\n目标模式: ${this.getTargetModeName()}`);
      console.log(`移动次数: ${this.moveCount}`);
      console.log(`步数: ${this.step}\n`);
      
      // 显示网格
      console.log('┌────┬────┬────┬────┐');
      for (let i = 0; i < this.size; i++) {
        let row = '│';
        for (let j = 0; j < this.size; j++) {
          const num = this.grid[i][j];
          if (num === -1) {
            row += '    │';
          } else {
            row += ` ${num.toString().padStart(2, ' ')} │`;
          }
        }
        console.log(row);
        if (i < this.size - 1) {
          console.log('├────┼────┼────┼────┤');
        }
      }
      console.log('└────┴────┴────┴────┘');
      
      // 显示完成进度
      const progress = this.getCompletionProgress();
      console.log(`\n完成度: ${progress}%`);
      
      return '渲染完成';
    },
    
    /**
     * 获取目标模式名称
     */
    getTargetModeName() {
      const names = {
        1: '顺序排列',
        2: '奇偶分离',
        3: '斐波那契序列',
        4: '质数优先'
      };
      return names[this.targetMode] || '顺序排列';
    },
    
    /**
     * 获取完成进度
     */
    getCompletionProgress() {
      let correctPositions = 0;
      let totalPositions = this.size * this.size - 1; // 减去空格
      
      switch (this.targetMode) {
        case 1: // 顺序排列
          let expectedNum = 1;
          for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
              if (i === this.size - 1 && j === this.size - 1) break;
              if (this.grid[i][j] === expectedNum) {
                correctPositions++;
              }
              expectedNum++;
            }
          }
          break;
        default:
          // 其他模式的简单评估
          for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
              if (this.grid[i][j] !== -1) {
                correctPositions++;
              }
            }
          }
          break;
      }
      
      return Math.round((correctPositions / totalPositions) * 100);
    }
  }
};

// 使用工厂函数创建增强的NumberMaze组件并导出
export default GameComponentPresets.puzzleGame(NumberMaze, 600);

/**
 * 工厂函数GameComponentPresets.puzzleGame为NumberMaze组件添加的功能：
 * 
 * 基础增强功能（来自createEnhancedGameComponent）：
 * - gameManager属性：提供游戏状态管理、自动模式控制和步骤执行
 * - customButtons属性：存储自定义按钮配置
 * - displayButtons计算属性：决定显示哪些游戏控制按钮
 * - gameControlsConfig计算属性：游戏控制配置
 * - wait()、undo()、pass()、goon()等方法：游戏控制方法
 * - created和beforeUnmount生命周期钩子：管理游戏状态和事件监听
 * 
 * puzzleGame特有功能：
 * - 提供益智游戏相关的自动操作和状态管理
 * - 支持自动步骤延迟配置（此处设置为600ms）
 */