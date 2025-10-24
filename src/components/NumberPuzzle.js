import { GameComponentPresets } from "../utils/gameComponentFactory.js";

/**
 * NumberPuzzle对象定义了数字拼图游戏的基础组件
 * 游戏规则：4×4网格，15个数字方块和1个空位，通过移动数字方块将数字按顺序排列
 */
const NumberPuzzle = {
  name: "NumberPuzzle",
  data() {
    return {
      title: "数字拼图",
      grid: [], // 4×4网格，0表示空位
      emptyPos: { row: 3, col: 3 }, // 空位位置
      moves: 0, // 移动次数
      
      // 以下属性由工厂函数添加：
      // gameManager: 游戏管理器实例
      // customButtons: 自定义按钮数组
      // step: 当前游戏步骤计数
    };
  },
  
  methods: {
    /**
     * 初始化游戏
     * 创建已解决的拼图，然后进行随机打乱
     */
    init() {
      // 创建已解决的拼图状态
      this.grid = [];
      let num = 1;
      for (let i = 0; i < 4; i++) {
        this.grid[i] = [];
        for (let j = 0; j < 4; j++) {
          if (i === 3 && j === 3) {
            this.grid[i][j] = 0; // 右下角为空位
          } else {
            this.grid[i][j] = num++;
          }
        }
      }
      this.emptyPos = { row: 3, col: 3 };
      this.moves = 0;
      
      // 随机打乱拼图（确保可解）
      this.shuffleGrid();
    },
    
    /**
     * 随机打乱拼图
     * 通过模拟有效移动来确保拼图可解
     */
    shuffleGrid() {
      const moves = 100; // 进行100次随机移动
      for (let i = 0; i < moves; i++) {
        const validMoves = this.getValidMoves();
        if (validMoves.length > 0) {
          const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          this.executeMove(randomMove.row, randomMove.col, false); // 不记录历史
        }
      }
    },
    
    /**
     * 获取所有有效的移动
     * 返回可以与空位交换的数字位置数组
     */
    getValidMoves(direction) {
      const moves = [];
      const { row, col } = this.emptyPos;
      
      // 检查四个方向
      let directions = [
        { row: row - 1, col: col }, // 上
        { row: row + 1, col: col }, // 下
        { row: row, col: col - 1 }, // 左
        { row: row, col: col + 1 }  // 右
      ];

      if (direction !== undefined) {
        directions = directions.filter((_, index) => index === direction);
      }
      
      for (const dir of directions) {
        if (dir.row >= 0 && dir.row < 4 && dir.col >= 0 && dir.col < 4) {
          moves.push(dir);
        }
      }
      
      return moves;
    },
    
    /**
     * 执行移动操作
     * @param {number} row - 要移动的数字行位置
     * @param {number} col - 要移动的数字列位置
     * @param {boolean} recordHistory - 是否记录到历史
     */
    executeMove(row, col, recordHistory = true) {
      // 检查是否与空位相邻
      if (!this.isAdjacent(row, col, this.emptyPos.row, this.emptyPos.col)) {
        return false;
      }
      
      // 交换数字和空位
      const number = this.grid[row][col];
      this.grid[row][col] = 0;
      this.grid[this.emptyPos.row][this.emptyPos.col] = number;
      
      // 更新空位位置
      const oldEmptyPos = { ...this.emptyPos };
      this.emptyPos = { row, col };
      
      if (recordHistory) {
        this.moves++;
        this.gameManager.recordOperation({
          type: "move",
          from: { row, col },
          to: oldEmptyPos,
          number: number
        });
      }
      
      return true;
    },
    
    /**
     * 检查两个位置是否相邻
     */
    isAdjacent(row1, col1, row2, col2) {
      const rowDiff = Math.abs(row1 - row2);
      const colDiff = Math.abs(col1 - col2);
      return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    },
    
    /**
     * 点击卡片处理
     */
    clickCard(rowOrDirection, col) {
      if (!this.gameManager.hitflag) return;

      if (rowOrDirection === undefined) return;

      let row;
      if (col === undefined) {
        const move = this.getValidMoves(rowOrDirection);
        if (move.length === 0) return;
        row = move[0].row;
        col = move[0].col;
      } else {
        row = rowOrDirection;
      }
      
      // 如果点击的是空位，忽略
      if (this.grid[row][col] === 0) return;
      
      // 尝试移动
      if (this.executeMove(row, col)) {
        // 检查是否完成
        if (this.done()) {
          this.gameManager.setWin();
        }
      }
    },
    
    /**
     * 单步执行
     * 自动找到一个有效的移动并执行
     */
    /**
     * 基于改进贪心策略的智能算法
     * 使用简单的贪心策略选择最佳移动
     */
    stepFn() {
      // 获取所有有效移动
      const validMoves = this.getValidMoves();
      if (validMoves.length === 0) return;
      
      // 策略1：如果可以直接完成游戏，直接完成
      const winningMove = this.findWinningMove(validMoves);
      if (winningMove) {
        this.clickCard(winningMove.row, winningMove.col);
        return;
      }
      
      // 策略2：选择能直接将数字放到正确位置的移动
      const directMove = this.findDirectCorrectMove(validMoves);
      if (directMove) {
        this.clickCard(directMove.row, directMove.col);
        return;
      }
      
      // 保底策略：随机选择一个移动
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      this.clickCard(randomMove.row, randomMove.col);
    },
    
    /**
     * 找到可以直接完成游戏的移动
     */
    findWinningMove(validMoves) {
      for (const move of validMoves) {
        if (this.willCompleteGame(move)) {
          return move;
        }
      }
      return null;
    },
    
    /**
     * 找到能直接将数字放到正确位置的移动
     */
    findDirectCorrectMove(validMoves) {
      for (const move of validMoves) {
        const number = this.grid[move.row][move.col];
        const targetRow = Math.floor((number - 1) / 4);
        const targetCol = (number - 1) % 4;
        
        // 如果这个移动能将数字放到正确位置
        if (move.row === targetRow && move.col === targetCol) {
          return move;
        }
      }
      return null;
    },
    
    /**
     * 检查移动是否能完成游戏
     */
    willCompleteGame(move) {
      const tempGrid = this.grid.map(row => [...row]);
      const tempEmptyPos = { ...this.emptyPos };
      
      const number = tempGrid[move.row][move.col];
      tempGrid[move.row][move.col] = 0;
      tempGrid[tempEmptyPos.row][tempEmptyPos.col] = number;
      
      return this.isGridComplete(tempGrid);
    },
    
    /**
     * 检查网格是否完成
     */
    isGridComplete(grid) {
      let expectedNumber = 1;
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (i === 3 && j === 3) {
            return grid[i][j] === 0;
          } else {
            if (grid[i][j] !== expectedNumber) {
              return false;
            }
            expectedNumber++;
          }
        }
      }
      return true;
    },
    /**
     * 检查游戏是否完成
     */
    done() {
      let expectedNumber = 1;
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (i === 3 && j === 3) {
            // 最后一个位置应该是空位
            return this.grid[i][j] === 0;
          } else {
            if (this.grid[i][j] !== expectedNumber) {
              return false;
            }
            expectedNumber++;
          }
        }
      }
      return true;
    },
    
    /**
     * 处理撤销操作
     */
    handleUndo(operation) {
      if (operation && operation.type === "move") {
        // 撤销移动：将数字移回原位置
        const { from, to, number } = operation;
        this.grid[to.row][to.col] = 0;
        this.grid[from.row][from.col] = number;
        this.emptyPos = { ...to };
        this.moves--;
      }
    },
    
    /**
     * 撤销上一步
     */
    undo() {
      this.gameManager.undo();
    },
    
    /**
     * 记录移动操作
     */
    recordMove(operation) {
      this.gameManager.recordOperation(operation);
    },
    
    /**
     * 渲染文本视图
     */
    renderTextView() {
      console.log('\n╔════════════════════════════════════════════════╗');
      console.log('║              数字拼图游戏                    ║');
      console.log('╚════════════════════════════════════════════════╝');
      console.log(`\n步数: ${this.step} | 移动次数: ${this.moves}\n`);
      
      // 显示网格
      console.log('┌────┬────┬────┬────┐');
      for (let i = 0; i < 4; i++) {
        let rowStr = '│';
        for (let j = 0; j < 4; j++) {
          const value = this.grid[i][j];
          rowStr += value === 0 ? '    │' : value.toString().padStart(4, ' ') + '│';
        }
        console.log(rowStr);
        if (i < 3) {
          console.log('├────┼────┼────┼────┤');
        }
      }
      console.log('└────┴────┴────┴────┘');
      
      if (this.done()) {
        console.log('\n🎉 恭喜！拼图完成！');
      }
      
      return '渲染完成';
    },
    
    sendCustomButtons() {
      // 添加Spider游戏特有的发牌按钮（如果牌堆有牌）
      this.customButtons.push({
        action: 'clickCard',
        label: 'MOVE',
        method: 'clickCard',
        args: [],
        description: 'MOVE TO ONE DIRECTION'
      });
    },
  },
  created() {
    this.sendCustomButtons();
  }
};

// 使用工厂函数创建增强的数字拼图组件并导出
export default GameComponentPresets.puzzleGame(NumberPuzzle, 300);