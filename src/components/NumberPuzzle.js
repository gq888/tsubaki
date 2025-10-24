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
     * 单步执行 - 基于路径规划的智能算法
     * 按照固定顺序将目标数字移动到指定目标位置
     */
    stepFn() {
      // 目标处理顺序：[数字, 目标位置] 对
      const targetSequence = [
        [1, 0], [2, 1], [4, 15], [3, 3], [4, 11], [4, 7], [3, 2], [4, 3],
        [5, 4], [6, 5], [8, 15], [7, 7], [8, 11], [7, 6], [8, 7], [9, 15],
        [13, 8], [9, 14], [9, 13], [9, 9], [13, 12], [9, 8], [10, 15],
        [14, 9], [10, 14], [10, 10], [14, 13], [10, 9], [11, 10], [12, 11], [15, 14]
      ];

      // 找到当前需要处理的目标
      const currentTarget = this.findCurrentTarget(targetSequence);
      if (!currentTarget) {
        // 所有目标都已完成，随机移动
        const validMoves = this.getValidMoves();
        if (validMoves.length > 0) {
          const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          this.clickCard(randomMove.row, randomMove.col);
        }
        return;
      }

      const [targetNumber, targetPos] = currentTarget;
      const targetRow = Math.floor(targetPos / 4);
      const targetCol = targetPos % 4;

      // 计算下一步移动
      const nextMove = this.calculateNextMove(targetNumber, targetRow, targetCol);
      if (nextMove) {
        this.clickCard(nextMove.row, nextMove.col);
      } else {
        // 如果没有找到路径，随机移动
        const validMoves = this.getValidMoves();
        if (validMoves.length > 0) {
          const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
          this.clickCard(randomMove.row, randomMove.col);
        }
      }
    },

    /**
     * 找到当前需要处理的目标
     * 按照目标序列顺序检查，返回第一个未完成的目标
     */
    findCurrentTarget(targetSequence) {
      for (let i = 0; i < targetSequence.length; i++) {
        const [targetNumber, targetPos] = targetSequence[i];
        const targetRow = Math.floor(targetPos / 4);
        const targetCol = targetPos % 4;
        
        // 检查目标数字是否已在目标位置
        if (this.grid[targetRow][targetCol] !== targetNumber) {
          // 检查目标数字当前位置
          const currentPos = this.findNumberPosition(targetNumber);
          if (currentPos) {
            // 检查是否有后续相同数字的目标位置
            const laterTargets = targetSequence.slice(i + 1).filter(target => target[0] === targetNumber);
            for (const laterTarget of laterTargets) {
              const laterPos = laterTarget[1];
              const laterRow = Math.floor(laterPos / 4);
              const laterCol = laterPos % 4;
              
              // 如果数字在后续目标位置，检查中间是否有未完成的目标
              if (currentPos.row === laterRow && currentPos.col === laterCol) {
                // 检查从当前位置到后续目标位置之间的目标是否都已完成
                let allIntermediateCompleted = true;
                for (let j = i + 1; j < targetSequence.findIndex(t => t[1] === laterPos); j++) {
                  const [interNumber, interPos] = targetSequence[j];
                  const interRow = Math.floor(interPos / 4);
                  const interCol = interPos % 4;
                  if (this.grid[interRow][interCol] !== interNumber) {
                    allIntermediateCompleted = false;
                    break;
                  }
                }
                if (allIntermediateCompleted) {
                  return [targetNumber, targetPos];
                }
              }
            }
          }
          return [targetNumber, targetPos];
        }
      }
      return null;
    },

    /**
     * 找到数字的当前位置
     */
    findNumberPosition(number) {
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (this.grid[i][j] === number) {
            return { row: i, col: j };
          }
        }
      }
      return null;
    },

    /**
     * 计算能将目标数字移动到目标位置的下一步移动
     * 使用路径规划算法避免干扰已完成的数字
     */
    calculateNextMove(targetNumber, targetRow, targetCol) {
      const numberPos = this.findNumberPosition(targetNumber);
      if (!numberPos) return null;

      // 如果数字已在目标位置，返回null
      if (numberPos.row === targetRow && numberPos.col === targetCol) {
        return null;
      }

      // 计算数字到目标的最短路径
      const numberPath = this.findShortestPath(numberPos, { row: targetRow, col: targetCol });
      if (!numberPath || numberPath.length === 0) return null;

      // 获取路径的下一步
      const nextNumberPos = numberPath[0];

      // 计算空位需要移动到的位置（数字路径的下一步）
      const requiredEmptyPos = nextNumberPos;

      // 如果空位已经在所需位置，直接移动数字
      if (this.emptyPos.row === requiredEmptyPos.row && this.emptyPos.col === requiredEmptyPos.col) {
        return numberPos;
      }

      // 计算空位到所需位置的路径
      const emptyPath = this.findShortestPath(this.emptyPos, requiredEmptyPos);
      if (!emptyPath || emptyPath.length === 0) return null;

      // 返回空位移动的下一步
      return emptyPath[0];
    },

    /**
     * 使用BFS算法找到最短路径
     * 避免经过已完成的数字位置
     */
    findShortestPath(start, end) {
      if (start.row === end.row && start.col === end.col) {
        return [];
      }

      const queue = [{ pos: start, path: [] }];
      const visited = new Set();
      visited.add(`${start.row},${start.col}`);

      while (queue.length > 0) {
        const { pos, path } = queue.shift();

        // 获取相邻位置
        const neighbors = [
          { row: pos.row - 1, col: pos.col }, // 上
          { row: pos.row + 1, col: pos.col }, // 下
          { row: pos.row, col: pos.col - 1 }, // 左
          { row: pos.row, col: pos.col + 1 }  // 右
        ];

        for (const neighbor of neighbors) {
          // 检查边界
          if (neighbor.row < 0 || neighbor.row >= 4 || neighbor.col < 0 || neighbor.col >= 4) {
            continue;
          }

          const neighborKey = `${neighbor.row},${neighbor.col}`;
          if (visited.has(neighborKey)) {
            continue;
          }

          // 检查是否是目标位置
          if (neighbor.row === end.row && neighbor.col === end.col) {
            return [...path, neighbor];
          }

          // 检查该位置是否包含已完成的数字
          const numberAtPos = this.grid[neighbor.row][neighbor.col];
          if (numberAtPos !== 0 && this.isNumberCompleted(numberAtPos, neighbor.row, neighbor.col)) {
            continue; // 避免经过已完成的数字
          }

          visited.add(neighborKey);
          queue.push({ pos: neighbor, path: [...path, neighbor] });
        }
      }

      return null; // 没有找到路径
    },

    /**
     * 检查数字是否已完成（在正确的目标位置）
     */
    isNumberCompleted(number, row, col) {
      const targetPos = this.getTargetPositionForNumber(number);
      if (!targetPos) return false;
      return row === targetPos.row && col === targetPos.col;
    },

    /**
     * 获取数字的目标位置
     */
    getTargetPositionForNumber(number) {
      const targetSequence = [
        [1, 0], [2, 1], [4, 15], [3, 3], [4, 11], [4, 7], [3, 2], [4, 3],
        [5, 4], [6, 5], [8, 15], [7, 7], [8, 11], [7, 6], [8, 7], [9, 15],
        [13, 8], [9, 14], [9, 13], [9, 9], [13, 12], [9, 8], [10, 15],
        [14, 9], [10, 14], [10, 10], [14, 13], [10, 9], [11, 10], [12, 11], [15, 14]
      ];

      for (const [targetNumber, targetPos] of targetSequence) {
        if (targetNumber === number) {
          return {
            row: Math.floor(targetPos / 4),
            col: targetPos % 4
          };
        }
      }
      return null;
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