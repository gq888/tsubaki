import { GameComponentPresets } from "../utils/gameComponentFactory.js";

/**
 * NumberPuzzle对象定义了数字拼图游戏的基础组件
 * 游戏规则：4×4网格，15个数字方块和1个空位，通过移动数字方块将数字按顺序排列
 */
// 目标处理顺序：[数字, 目标行, 目标列] 对
const TARGET_SEQUENCE = [
  [1, 0, 0], [2, 0, 1], [4, 3, 3], [3, 0, 3], [4, 2, 3], [4, 1, 3], [3, 0, 2], [4, 0, 3],
  [5, 1, 0], [6, 1, 1], [7, 1, 3], [8, 2, 3], [7, 1, 2], [8, 1, 3],
  [9, 3, 0], [13, 3, 1], [9, 2, 0], [13, 3, 0], [10, 3, 1], [14, 3, 2], [10, 2, 1], [14, 3, 1]
];

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
          number: number,
          hash: JSON.stringify(this.grid),
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
     * 检查是否只剩下最后6个格子需要处理（右下角区域）
     * 第3行第2列到第4行第4列的六个格子
     */
    isFinalSixCells() {
      // 检查最后6个格子是否包含数字10,11,12,0,14,15
      const finalCells = [
        {row: 2, col: 1}, {row: 2, col: 2}, {row: 2, col: 3},
        {row: 3, col: 1}, {row: 3, col: 2}, {row: 3, col: 3}
      ];
      
      const finalNumbers = [10, 11, 12, 0, 14, 15];
      const numbersInFinalCells = [];
      
      for (const cell of finalCells) {
        const number = this.grid[cell.row][cell.col];
        numbersInFinalCells.push(number);
      }
      
      // 检查这些数字是否都在最后6个数字范围内
      return numbersInFinalCells.every(num => finalNumbers.includes(num)) && 
             numbersInFinalCells.length === 6;
    },

    /**
     * 检查移动是否能让数字到达目标位置
     */
    canReachTargetInSteps(number, targetRow, targetCol, steps = 2) {
      const currentPos = this.findNumberPosition(number);
      if (!currentPos) return false;
      
      if (currentPos.row === targetRow && currentPos.col === targetCol) {
        return true;
      }
      
      if (steps <= 0) return false;
      
      // 使用临时网格模拟移动
      const tempGrid = this.grid.map(row => [...row]);
      const tempEmptyPos = { ...this.emptyPos };
      
      // 尝试所有可能的移动
      const validMoves = this.getValidMoves();
      
      for (const move of validMoves) {
        // 模拟执行移动
        const numberAtMove = tempGrid[move.row][move.col];
        tempGrid[move.row][move.col] = 0;
        tempGrid[tempEmptyPos.row][tempEmptyPos.col] = numberAtMove;
        
        // 检查数字是否到达目标位置
        const newPos = this.findNumberPositionInGrid(number, tempGrid);
        if (newPos && newPos.row === targetRow && newPos.col === targetCol) {
          return true;
        }
        
        // 递归检查下一步
        if (steps > 1) {
          // 更新空位位置继续检查
          const newEmptyPos = { ...move };
          const canReach = this.canReachTargetInStepsWithGrid(
            number, targetRow, targetCol, steps - 1, 
            tempGrid, newEmptyPos
          );
          if (canReach) {
            return true;
          }
        }
        
        // 恢复网格状态
        tempGrid[move.row][move.col] = numberAtMove;
        tempGrid[tempEmptyPos.row][tempEmptyPos.col] = 0;
      }
      
      return false;
    },

    /**
     * 在指定网格中查找数字位置
     */
    findNumberPositionInGrid(number, grid) {
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          if (grid[i][j] === number) {
            return { row: i, col: j };
          }
        }
      }
      return null;
    },

    /**
     * 使用指定网格进行两步前瞻分析
     */
    canReachTargetInStepsWithGrid(number, targetRow, targetCol, steps, grid, emptyPos) {
      if (steps <= 0) return false;
      
      // 获取当前数字位置
      const currentPos = this.findNumberPositionInGrid(number, grid);
      if (!currentPos) return false;
      
      if (currentPos.row === targetRow && currentPos.col === targetCol) {
        return true;
      }
      
      // 获取有效移动
      const validMoves = [];
      const directions = [
        { row: emptyPos.row - 1, col: emptyPos.col },
        { row: emptyPos.row + 1, col: emptyPos.col },
        { row: emptyPos.row, col: emptyPos.col - 1 },
        { row: emptyPos.row, col: emptyPos.col + 1 }
      ];
      
      for (const dir of directions) {
        if (dir.row >= 0 && dir.row < 4 && dir.col >= 0 && dir.col < 4) {
          validMoves.push(dir);
        }
      }
      
      // 尝试所有可能的移动
      for (const move of validMoves) {
        // 模拟执行移动
        const numberAtMove = grid[move.row][move.col];
        const tempGrid = grid.map(row => [...row]);
        const tempEmptyPos = { ...emptyPos };
        
        tempGrid[move.row][move.col] = 0;
        tempGrid[tempEmptyPos.row][tempEmptyPos.col] = numberAtMove;
        
        // 检查数字是否到达目标位置
        const newPos = this.findNumberPositionInGrid(number, tempGrid);
        if (newPos && newPos.row === targetRow && newPos.col === targetCol) {
          return true;
        }
        
        // 递归检查下一步
        if (steps > 1) {
          const newEmptyPos = { ...move };
          const canReach = this.canReachTargetInStepsWithGrid(
            number, targetRow, targetCol, steps - 1, 
            tempGrid, newEmptyPos
          );
          if (canReach) {
            return true;
          }
        }
      }
      
      return false;
    },

    /**
     * 检查候选移动是否通过两步前瞻分析
     */
    checkTwoStepLookahead(move) {
      // 模拟执行移动
      const tempGrid = this.grid.map(row => [...row]);
      const tempEmptyPos = { ...this.emptyPos };
      
      const numberAtMove = tempGrid[move.row][move.col];
      tempGrid[move.row][move.col] = 0;
      tempGrid[tempEmptyPos.row][tempEmptyPos.col] = numberAtMove;
      const newEmptyPos = { ...move };
      
      // 检查第一步移动后，数字10或14是否到达目标位置
      const targetPos10 = { row: 2, col: 1 }; // 数字10的目标位置：3行2列（索引从0开始）
      const targetPos14 = { row: 3, col: 1}; // 数字14的目标位置：4行2列（索引从0开始）
      
      const pos10AfterMove = this.findNumberPositionInGrid(10, tempGrid);
      const pos14AfterMove = this.findNumberPositionInGrid(14, tempGrid);
      
      // 检查两个数字是否都已经到达目标位置（完成状态）
      const tenInTarget = pos10AfterMove && pos10AfterMove.row === targetPos10.row && pos10AfterMove.col === targetPos10.col;
      const fourteenInTarget = pos14AfterMove && pos14AfterMove.row === targetPos14.row && pos14AfterMove.col === targetPos14.col;
      
      // 如果两个数字都已经到位，这个移动是可接受的（避免无限循环）
      if (tenInTarget && fourteenInTarget) {
        return true;
      }
      
      let firstNumberMoved = null;
      let firstTargetReached = false;
      
      // 检查数字10是否到达目标位置
      if (tenInTarget) {
        firstNumberMoved = 10;
        firstTargetReached = true;
      }
      
      // 检查数字14是否到达目标位置
      if (fourteenInTarget && firstNumberMoved === null) {
        firstNumberMoved = 14;
        firstTargetReached = true;
      }
      
      // 如果第一步没有让任何数字到达目标位置，返回false
      if (!firstTargetReached) {
        return false;
      }
      
      // 检查第二步是否能让另一个数字也到达目标位置
      const secondNumber = firstNumberMoved === 10 ? 14 : 10;
      const secondTargetPos = secondNumber === 14 ? targetPos14 : targetPos10;
      
      // 检查第二步是否能让第二个数字到达目标位置
      const canReachSecondTarget = this.canReachTargetInStepsWithGrid(
        secondNumber, secondTargetPos.row, secondTargetPos.col, 1, 
        tempGrid, newEmptyPos
      );
      
      return canReachSecondTarget;
    },

    /**
     * 检查是否存在将数字14移动到数字10目标位置，或将数字10移动到数字14目标位置的移动
     * 这是在两步前瞻分析失败时的加速策略
     */
    checkSpecialTargetMoves() {
      const targetPos10 = { row: 2, col: 1 }; // 数字10的目标位置：3行2列（索引从0开始）
      const targetPos14 = { row: 3, col: 1}; // 数字14的目标位置：4行2列（索引从0开始）
      
      // 获取当前数字10和14的位置
      const currentPos10 = this.findNumberPosition(10);
      const currentPos14 = this.findNumberPosition(14);
      
      if (!currentPos10 || !currentPos14) {
        return null;
      }
      
      // 获取所有有效移动
      const allValidMoves = this.getValidMoves();
      
      // 检查是否存在将数字14移动到数字10目标位置的移动
      const move14to10Target = allValidMoves.find(move => {
        // 检查这个移动是否会把数字14移动到数字10的目标位置
        if (currentPos14.row === move.row && currentPos14.col === move.col) {
          // 这个移动会把数字14移动到空位，然后空位会移动到数字14的原始位置
          // 我们需要检查这个移动是否会让数字14最终到达数字10的目标位置
          const tempGrid = this.grid.map(row => [...row]);
          const tempEmptyPos = { ...this.emptyPos };
          
          // 模拟移动
          tempGrid[move.row][move.col] = 0;
          tempGrid[tempEmptyPos.row][tempEmptyPos.col] = 14;
          const newPos14 = this.findNumberPositionInGrid(14, tempGrid);

          if (currentPos10.row === targetPos14.row && currentPos10.col === targetPos14.col) {
            return newPos14 && newPos14.row === targetPos14.row && newPos14.col === targetPos14.col + 1;
          }
          
          // 检查数字14的新位置是否是数字10的目标位置
          return currentPos10.col === targetPos10.col + 2 && newPos14 && newPos14.row === targetPos10.row && newPos14.col === targetPos10.col;
        }
        return false;
      });
      
      if (move14to10Target) {
        return move14to10Target;
      }
      
      // 检查是否存在将数字10移动到数字14目标位置的移动
      const move10to14Target = allValidMoves.find(move => {
        // 检查这个移动是否会把数字10移动到数字14的目标位置
        if (currentPos10.row === move.row && currentPos10.col === move.col) {
          // 模拟移动
          const tempGrid = this.grid.map(row => [...row]);
          const tempEmptyPos = { ...this.emptyPos };
          
          // 模拟移动
          tempGrid[move.row][move.col] = 0;
          tempGrid[tempEmptyPos.row][tempEmptyPos.col] = 10;
          const newPos10 = this.findNumberPositionInGrid(10, tempGrid);

          if (currentPos14.row === targetPos10.row && currentPos14.col === targetPos10.col) {
            return newPos10 && newPos10.row === targetPos10.row && newPos10.col === targetPos10.col + 1;
          }
          
          // 检查数字10的新位置是否是数字14的目标位置
          return currentPos14.col === targetPos14.col + 2 && newPos10 && newPos10.row === targetPos14.row && newPos10.col === targetPos14.col;
        }
        return false;
      });
      
      return move10to14Target;
    },

    /**
     * 在最后6个格子区域内进行完全随机移动（带两步前瞻分析）
     */
    randomMoveInFinalSixCells() {
      // 获取最后6个格子的有效移动
      const finalCells = [
        {row: 2, col: 1}, {row: 2, col: 2}, {row: 2, col: 3},
        {row: 3, col: 1}, {row: 3, col: 2}, {row: 3, col: 3}
      ];
      
      // 获取所有有效移动
      const allValidMoves = this.getValidMoves();
      
      // 过滤出只影响最后6个格子的移动
      const finalSixMoves = allValidMoves.filter(move => {
        // 移动的目标位置必须在最后6个格子内
        return finalCells.some(cell => cell.row === move.row && cell.col === move.col);
      });
      
      // 首先检查是否存在通过两步前瞻分析的移动
      let lookaheadMoves = [];
      try {
        lookaheadMoves = finalSixMoves.filter(move => this.checkTwoStepLookahead(move));
      } catch (error) {
        console.warn('两步前瞻分析出错，使用随机移动:', error);
        lookaheadMoves = [];
      }
      
      // 如果存在通过两步前瞻分析的移动，随机选择一个执行
      if (lookaheadMoves.length === 1) {
        this.clickCard(lookaheadMoves[0].row, lookaheadMoves[0].col);
        return;
      } else if (lookaheadMoves.length > 1) {
        // 最后四格快速胜利检测
        const directCorrectMove = this.findDirectCorrectMove(finalSixMoves);

        if (directCorrectMove) {
          this.clickCard(directCorrectMove.row, directCorrectMove.col);
          return;
        }
      }
      
      // 如果不存在通过两步前瞻分析的移动，检查是否存在特殊目标移动
      if (finalSixMoves.length > 0) {
        // 首先检查是否存在将数字14移动到数字10目标位置，或将数字10移动到数字14目标位置的移动
        const specialTargetMove = this.checkSpecialTargetMoves();
        
        if (specialTargetMove) {
          // 如果存在特殊目标移动，立即执行
          this.clickCard(specialTargetMove.row, specialTargetMove.col);
          return;
        }
        
        // 如果不存在特殊目标移动，随机选择一个普通移动
        const randomMove = finalSixMoves[Math.floor(Math.random() * finalSixMoves.length)];
        this.clickCard(randomMove.row, randomMove.col);
        return;
      }
      
      // 最后的保底策略：随机选择一个有效移动
      const randomMove = allValidMoves[Math.floor(Math.random() * allValidMoves.length)];
      this.clickCard(randomMove.row, randomMove.col);
    },

    /**
     * 单步执行 - 基于路径规划的智能算法
     * 按照固定顺序将目标数字移动到指定目标位置
     */
    stepFn() {
      // 找到当前需要处理的目标
      const currentTarget = this.findCurrentTarget(TARGET_SEQUENCE);
      if (!currentTarget) {
        // 所有目标都已完成，检查是否在最后6个格子阶段
        if (this.isFinalSixCells()) {
          // 在最后6个格子内进行完全随机移动
          this.randomMoveInFinalSixCells();
        } else {
          // 普通随机移动
          const validMoves = this.getValidMoves();
          if (validMoves.length > 0) {
            const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
            this.clickCard(randomMove.row, randomMove.col);
          }
        }
        return;
      }

      const [targetNumber, targetRow, targetCol] = currentTarget;

      // 计算下一步移动
      const nextMove = this.calculateNextMove(targetNumber, targetRow, targetCol);
      if (nextMove) {
        // 模拟执行移动
        const tempGrid = this.grid.map(row => [...row]);
        const tempEmptyPos = { ...this.emptyPos };
        
        const numberAtMove = tempGrid[nextMove.row][nextMove.col];
        tempGrid[nextMove.row][nextMove.col] = 0;
        tempGrid[tempEmptyPos.row][tempEmptyPos.col] = numberAtMove;
        if (!this.gameManager.history.find(operation => operation.hash === JSON.stringify(tempGrid))) {
          this.clickCard(nextMove.row, nextMove.col);
          return;
        } else {
          // 防死锁条件触发：添加智能随机移动逻辑
          this.makeSafeRandomMove();
          return;
        }
      }

      // 如果没有找到路径，随机移动
      const validMoves = this.getValidMoves();
      if (validMoves.length > 0) {
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        this.clickCard(randomMove.row, randomMove.col);
      }
    },

    /**
     * 找到当前需要处理的目标
     * 按照目标序列顺序检查，返回第一个未完成的目标
     */
    findCurrentTarget(targetSequence) {
      for (let i = 0; i < targetSequence.length; i++) {
        const [targetNumber, targetRow, targetCol] = targetSequence[i];
        
        // 检查目标数字是否已在目标位置
        if (this.grid[targetRow][targetCol] !== targetNumber) {
          // 检查目标数字当前位置
          const currentPos = this.findNumberPosition(targetNumber);
          if (currentPos) {
            // 检查是否有后续相同数字的目标位置
            let hasLaterTargetAndIntermediateCompleted = false;
            const laterTargets = targetSequence.slice(i + 1).filter(target => target[0] === targetNumber);
            for (const laterTarget of laterTargets) {
              const [laterNumber, laterRow, laterCol] = laterTarget;
              
              // 如果数字在后续目标位置，检查中间是否有未完成的目标
              if (currentPos.row === laterRow && currentPos.col === laterCol) {
                // 检查从当前位置到后续目标位置之间的目标是否都已完成
                let intermediateCompleted = true;
                for (let j = targetSequence.findIndex(t => t[0] === laterNumber && t[1] === laterRow && t[2] === laterCol); j > i; j--) {
                  const [interNumber, interRow, interCol] = targetSequence[j];
                  if (interNumber === targetNumber) continue;
                  const interIndex = interNumber - 1;
                  const targetIndex = targetNumber - 1;
                  const targetIndexInGrid = this.grid[Math.floor(targetIndex / 4)][targetIndex % 4]
                  const interIndexInGrid = this.grid[Math.floor(interIndex / 4)][interIndex % 4]
                  const interNumberInGrid = this.grid[interRow][interCol]
                  if (targetIndexInGrid === targetNumber && interIndexInGrid === interNumber || interNumberInGrid === interNumber){//} || interNumberInGrid === 0 && (targetIndexInGrid === 0)) {
                    break;
                  }
                  intermediateCompleted = false;
                  break;
                }
                if (intermediateCompleted) {
                  hasLaterTargetAndIntermediateCompleted = true;
                  break;
                }
              }
            }
            if (hasLaterTargetAndIntermediateCompleted) {
              continue;
            }
          }
          return [targetNumber, targetRow, targetCol];
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
     * 使用路径规划算法避免干扰已完成的数字，同时避开正在计算的目标数字
     */
    calculateNextMove(targetNumber, targetRow, targetCol) {
      const numberPos = this.findNumberPosition(targetNumber);
      if (!numberPos) return null;

      // 如果数字已在目标位置，返回null
      if (numberPos.row === targetRow && numberPos.col === targetCol) {
        return null;
      }

      // 计算数字到目标的最短路径，避开目标数字本身
      const numberPath = this.findShortestPath(numberPos, { row: targetRow, col: targetCol }, targetNumber);
      if (!numberPath || numberPath.length === 0) return null;

      // 获取路径的下一步
      const nextNumberPos = numberPath[0];

      // 计算空位需要移动到的位置（数字路径的下一步）
      const requiredEmptyPos = nextNumberPos;

      // 如果空位已经在所需位置，直接移动数字
      if (this.emptyPos.row === requiredEmptyPos.row && this.emptyPos.col === requiredEmptyPos.col) {
        return numberPos;
      }

      // 计算空位到所需位置的路径，同样避开目标数字
      const emptyPath = this.findShortestPath(this.emptyPos, requiredEmptyPos, targetNumber);
      if (!emptyPath || emptyPath.length === 0) return null;

      // 返回空位移动的下一步
      return emptyPath[0];
    },

    /**
     * 使用BFS算法找到最短路径
     * 避免经过已完成的数字位置，同时避开指定的目标数字
     */
    findShortestPath(start, end, excludeNumber = null) {
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

          // 检查是否是需要避开的目标数字（防止无限循环）
          if (excludeNumber !== null && numberAtPos === excludeNumber) {
            continue; // 避免经过正在移动的目标数字
          }

          visited.add(neighborKey);
          queue.push({ pos: neighbor, path: [...path, neighbor] });
        }
      }

      return null; // 没有找到路径
    },

    /**
     * 在不破坏连续已完成数字序列的前提下进行随机移动
     * 找出从数字1开始的最长连续已完成数字序列，确保随机移动不会破坏这些数字
     */
    makeSafeRandomMove() {
      // 找出从数字1开始的最长连续已完成数字序列
      const protectedNumbers = this.getContinuousCompletedNumbers();
      
      // 获取所有有效移动
      const allValidMoves = this.getValidMoves();
      
      // 过滤出不会破坏已完成数字序列的移动
      const safeMoves = allValidMoves.filter(move => {
        const numberAtMove = this.grid[move.row][move.col];
        // 如果移动的位置是空位或者是未完成的数字，则是安全的
        return numberAtMove === 0 || !protectedNumbers.includes(numberAtMove);
      });
      
      // 优先选择安全的移动
      if (safeMoves.length > 0) {
        const randomSafeMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
        this.clickCard(randomSafeMove.row, randomSafeMove.col);
        return;
      }

      // 如果没有安全的移动（理论上不应该发生），选择任意移动
      if (allValidMoves.length > 0) {
        const randomMove = allValidMoves[Math.floor(Math.random() * allValidMoves.length)];
        this.clickCard(randomMove.row, randomMove.col);
      }
    },
    
    /**
     * 找出从数字1开始的最长连续已完成数字序列
     * 例如：如果数字1、2已完成，数字3未完成，则返回[1, 2]
     */
    getContinuousCompletedNumbers() {
      const continuousNumbers = [];
      let currentNumber = 1;
      
      // 按顺序检查每个数字是否已完成
      while (currentNumber <= 15) {
        const targetPos = this.findTargetPositionForNumber(currentNumber);
        if (targetPos && this.grid[targetPos.row][targetPos.col] === currentNumber) {
          continuousNumbers.push(currentNumber);
          currentNumber++;
        } else {
          break;
        }
      }
      
      return continuousNumbers;
    },
    
    /**
     * 找到数字在目标序列中的目标位置
     */
    findTargetPositionForNumber(number) {
      for (const [targetNumber, targetRow, targetCol] of TARGET_SEQUENCE) {
        if (targetNumber === number) {
          return { row: targetRow, col: targetCol };
        }
      }
      return null;
    },

    /**
     * 检查数字是否已完成（在正确的目标位置）
     * 同时检查当前数字之前所有数字是否都已完成目标
     */
    isNumberCompleted(number, row, col) {
      // 找到当前数字在目标序列中的索引
      const currentIndex = TARGET_SEQUENCE.findIndex(target => target[0] === number && target[1] === row && target[2] === col);
      if (currentIndex === -1) return false;
      
      // 检查当前数字及之前所有数字是否都已完成
      // 兼容Node.js v16，使用filter代替findLast
      const prevTargetSquence = TARGET_SEQUENCE.filter((target, index) => {
        if (index > currentIndex) return false;
        
        // 查找是否有后续相同数字的目标位置
        let hasLaterTarget = false;
        for (let i = currentIndex; i >= index + 1; i--) {
          const t = TARGET_SEQUENCE[i];
          if (t[0] === target[0]) {
            hasLaterTarget = true;
            break;
          }
        }
        
        return !hasLaterTarget;
      });
      
      for (let i = 0; i < prevTargetSquence.length; i++) {
        const [targetNumber, targetRow, targetCol] = prevTargetSquence[i];
        
        // 检查目标数字是否在正确的目标位置
        if (this.grid[targetRow][targetCol] !== targetNumber) {
          return false;
        }
      }
      
      return true;
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
        if (this.emptyPos.row === targetRow && this.emptyPos.col === targetCol) {
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