import { GameComponentPresets } from '../utils/gameComponentFactory.js';

export default GameComponentPresets.puzzleGame({
  name: 'NumberSequence',
  
  data() {
    return {
      grid: [],
      selectedCells: [],
      score: 0,
      gridSize: 5,
      minSequenceLength: 3
    };
  },

  computed: {
    isGameComplete() {
      return this.grid && this.grid.length > 0 && this.grid.every(row => row.every(cell => cell === null));
    },
    
    hasValidMoves() {
      return this.findAllValidSequences(this.grid).length > 0;
    }
  },

  methods: {
    init() {
      this.grid = this.generateGrid();
      this.selectedCells = [];
      this.score = 0;
    },

    handleCellClick(row, col) {
      if (this.grid[row][col] === null) return;
      
      const cellData = { row, col, value: this.grid[row][col] };
      
      // 如果点击的是已选中的第一个单元格，清除选择
      if (this.selectedCells.length > 0 && 
          this.selectedCells[0].row === row && 
          this.selectedCells[0].col === col) {
        this.clearSelection();
        return;
      }
      
      // 如果当前没有选择，开始新选择
      if (this.selectedCells.length === 0) {
        this.selectedCells = [cellData];
        return;
      }
      
      // 检查是否可以添加到当前序列
      const lastCell = this.selectedCells[this.selectedCells.length - 1];
      const distance = Math.abs(row - lastCell.row) + Math.abs(col - lastCell.col);
      
      // 必须相邻且值更大
      if (distance === 1 && this.grid[row][col] > lastCell.value) {
        // 检查是否已经包含这个单元格
        const alreadySelected = this.selectedCells.some(cell => 
          cell.row === row && cell.col === col
        );
        
        if (!alreadySelected) {
          this.selectedCells.push(cellData);
        }
      } else {
        // 不能添加，开始新选择
        this.selectedCells = [cellData];
      }
    },

    confirmSequence() {
      if (this.isValidSequence(this.selectedCells)) {
        this.selectSequence(this.selectedCells);
        this.clearSelection();
      }
    },

    clearSelection() {
      this.selectedCells = [];
    },

    isCellSelected(row, col) {
      return this.selectedCells.some(cell => cell.row === row && cell.col === col);
    },

    isCellSelectableNext(row, col) {
      if (this.selectedCells.length === 0) return false;
      if (this.grid[row][col] === null) return false;
      
      const lastCell = this.selectedCells[this.selectedCells.length - 1];
      const distance = Math.abs(row - lastCell.row) + Math.abs(col - lastCell.col);
      
      // 必须相邻、值更大且未被选中
      return distance === 1 && 
             this.grid[row][col] > lastCell.value &&
             !this.isCellSelected(row, col);
    },

    generateGrid() {
      const grid = [];
      for (let i = 0; i < this.gridSize; i++) {
        const row = [];
        for (let j = 0; j < this.gridSize; j++) {
          row.push(Math.floor(Math.random() * 9) + 1);
        }
        grid.push(row);
      }
      return grid;
    },

    copyGrid(grid) {
      return grid.map(row => [...row]);
    },

    async stepFn() {
      if (this.isGameComplete) {
        this.gameManager.setWin();
        return;
      }

      const validSequences = this.findAllValidSequences(this.grid);
      if (validSequences.length === 0) {
        this.gameManager.setLose();
        return;
      }

      await this.gameManager.step(async () => {
        // AI前瞻一步：选择"不能被任何序列消除的格子数量最少"的序列
        const bestSequence = this.findBestSequenceWithLookahead(validSequences);
        
        this.selectedCells = [];
        for (let seq of bestSequence) {
          this.selectedCells.push(seq);
          await this.wait();
        }
        this.confirmSequence();
      })
    },

    findAllValidSequences(grid) {
      const sequences = [];
      
      for (let i = 0; i < this.gridSize; i++) {
        for (let j = 0; j < this.gridSize; j++) {
          if (grid[i][j] !== null) {
            // ✅ 修复：为每个起始点创建独立的visited数组
            const visited = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));
            const res = this.findSequenceFrom(i, j, visited, grid);
            const validSequences = res.filter(seq => seq.length >= this.minSequenceLength);
            sequences.push(...validSequences);
          }
        }
      }
      
      return sequences;
    },

    findBestSequenceWithLookahead(validSequences) {
      // 使用递归深度优先搜索找到最优消除路径
      const result = this.findOptimalSequencePath(this.grid, []);
      
      if (result.path.length === 0) {
        // 如果没有找到路径，返回第一个序列（保险措施）
        return validSequences[0];
      }
      
      console.log('最优路径长度:', result.path.length, '最终剩余格子数:', result.remainingCells);
      return result.path[0];
    },

    // 一步前瞻函数：获取执行序列后的所有可达单元格
    getReachableCellsAfterSequence(grid, sequence) {
      // 应用序列到网格
      const newGrid = this.simulateSequenceExecution(sequence, grid);
      
      // 获取新网格中的所有有效序列
      const allSequences = this.findAllValidSequences(newGrid);
      
      // 收集所有序列经过的单元格
      const reachableCells = new Set();
      
      for (const seq of allSequences) {
        for (const cell of seq) {
          const key = `${cell.row},${cell.col}`;
          reachableCells.add(key);
        }
      }
      
      return reachableCells;
    },
    
    // 统计未经过的单元格数量
    countUnreachableCellsAfterSequence(grid, sequence) {
      const reachableCells = this.getReachableCellsAfterSequence(grid, sequence);
      
      // 统计网格中所有非空单元格
      let totalNonEmptyCells = 0;
      for (let i = 0; i < this.gridSize; i++) {
        for (let j = 0; j < this.gridSize; j++) {
          if (grid[i][j] !== null) {
            totalNonEmptyCells++;
          }
        }
      }
      
      // 未经过的单元格数量 = 总非空单元格 - 可达单元格
      return totalNonEmptyCells - reachableCells.size;
    },
    
    findOptimalSequencePath(grid, currentPath) {
      // 查找当前状态下的所有有效序列
      const validSequences = this.findAllValidSequences(grid);
      
      // 基础情况：没有有效序列，返回当前路径和剩余格子数
      if (validSequences.length === 0) {
        const remainingCells = this.countRemainingCells(grid);
        return {
          path: [...currentPath],
          remainingCells: remainingCells
        };
      }
      
      // ✅ 优化：对序列进行排序，优先处理未经过单元格数量最少的分支
      const sequencesWithScore = validSequences.map(sequence => ({
        sequence,
        unreachableCount: this.countUnreachableCellsAfterSequence(grid, sequence)
      }));
      
      // 按照未经过单元格数量由少到多排序
      sequencesWithScore.sort((a, b) => a.unreachableCount - b.unreachableCount);
      
      // 记录所有可能路径中的最优结果
      let bestResult = {
        path: [],
        remainingCells: Infinity
      };
      
      // 对每个有效序列进行递归探索
      for (const {sequence} of sequencesWithScore) {
        if (bestResult.remainingCells === 0) {
          return bestResult;
        }

        // 模拟执行当前序列后的状态
        const futureGrid = this.simulateSequenceExecution(sequence, grid);
        
        // 递归探索执行该序列后的所有可能路径
        const result = this.findOptimalSequencePath(
          futureGrid,
          [...currentPath, sequence]
        );
        
        // 更新最优结果（优先选择剩余格子最少的路径）
        if (result.remainingCells < bestResult.remainingCells) {
          bestResult = result;
        }
      }
      
      return bestResult;
    },

    countRemainingCells(grid) {
      let count = 0;
      for (let row = 0; row < this.gridSize; row++) {
        for (let col = 0; col < this.gridSize; col++) {
          if (grid[row][col] !== null) {
            count++;
          }
        }
      }
      return count;
    },

    simulateSequenceExecution(sequence, grid = this.grid) {
      // 创建传入状态的深拷贝
      const simulatedGrid = this.copyGrid(grid);
      
      // 模拟消除序列
      for (const cell of sequence) {
        simulatedGrid[cell.row][cell.col] = null;
      }
      
      // 模拟重力效果
      this.applyGravityToGrid(simulatedGrid);
      
      return simulatedGrid;
    },

    applyGravityToGrid(grid) {
      for (let col = 0; col < this.gridSize; col++) {
        let writePos = this.gridSize - 1;
        for (let row = this.gridSize - 1; row >= 0; row--) {
          if (grid[row][col] !== null) {
            if (row !== writePos) {
              grid[writePos][col] = grid[row][col];
              grid[row][col] = null;
            }
            writePos--;
          }
        }
      }
    },

    dfsSequences(row, col, sequence, visited, foundSequences, grid) {
      // 如果序列长度达到要求，记录当前序列
      if (sequence.length >= this.minSequenceLength) {
        foundSequences.push([...sequence]);
      }
      
      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      const currentValue = sequence[sequence.length - 1].value;
      
      for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        
        if (this.isValidCell(newRow, newCol) && 
            !visited[newRow][newCol] && 
            grid[newRow][newCol] !== null &&
            grid[newRow][newCol] > currentValue) {
          
          visited[newRow][newCol] = true;
          sequence.push({
            row: newRow, 
            col: newCol, 
            value: grid[newRow][newCol]
          });
          
          this.dfsSequences(newRow, newCol, sequence, visited, foundSequences, grid);
          
          // 回溯
          sequence.pop();
          visited[newRow][newCol] = false;
        }
      }
    },

    findSequenceFrom(startRow, startCol, visited, grid) {
      const sequences = [];
      const currentSequence = [{row: startRow, col: startCol, value: grid[startRow][startCol]}];
      
      this.dfsSequences(startRow, startCol, currentSequence, visited, sequences, grid);
      
      return sequences;
    },

    isValidCell(row, col) {
      return row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize;
    },

    selectSequence(sequence) {
      if (!this.isValidSequence(sequence)) {
        return false;
      }

      // 记录操作前的状态（在消除和重力应用之前）
      const beforeGrid = this.copyGrid(this.grid);
      const beforeScore = this.score;
      
      // 清除选中的序列
      for (const cell of sequence) {
        this.grid[cell.row][cell.col] = null;
      }
      
      // 下落效果
      this.applyGravityToGrid(this.grid);
      
      // 更新分数
      this.score += sequence.length * 10;
      
      // 记录操作（包含操作前的完整状态）
      this.gameManager.recordOperation({
        type: 'selectSequence',
        data: {
          sequence: sequence.map(cell => ({row: cell.row, col: cell.col, value: cell.value})),
          beforeScore: beforeScore,
          afterScore: this.score,
          beforeGrid: beforeGrid,
          afterGrid: this.copyGrid(this.grid)
        }
      });

      // 检查游戏状态
      this.checkGameState();
      
      return true;
    },

    isValidSequence(sequence) {
      if (sequence.length < this.minSequenceLength) {
        return false;
      }

      // 检查是否严格递增
      for (let i = 1; i < sequence.length; i++) {
        if (sequence[i].value <= sequence[i-1].value) {
          return false;
        }
      }

      // 检查是否相邻
      for (let i = 1; i < sequence.length; i++) {
        const prev = sequence[i-1];
        const curr = sequence[i];
        const distance = Math.abs(curr.row - prev.row) + Math.abs(curr.col - prev.col);
        if (distance !== 1) {
          return false;
        }
      }

      return true;
    },

    checkGameState() {
      if (this.isGameComplete) {
        this.gameManager.setWin();
      } else if (!this.hasValidMoves) {
        this.gameManager.setLose();
      }
    },

    handleUndo(operation) {
      if (operation.type === 'selectSequence') {
        // 恢复操作前的网格状态（包含数字的原始位置）
        this.grid = this.copyGrid(operation.data.beforeGrid);
        this.score = operation.data.beforeScore;
        this.selectedCells = [];
      }
    },

    renderTextView() {
      let output = `数字接龙 - 分数: ${this.score}\n`;
      output += '═'.repeat(this.gridSize * 4 + 1) + '\n';
      
      for (let i = 0; i < this.gridSize; i++) {
        output += '║';
        for (let j = 0; j < this.gridSize; j++) {
          const cell = this.grid[i][j];
          if (cell === null) {
            output += '   ║';
          } else {
            output += ` ${cell} ║`;
          }
        }
        output += '\n';
        if (i < this.gridSize - 1) {
          output += '╠' + '═══╬'.repeat(this.gridSize - 1) + '═══╣\n';
        }
      }
      
      output += '═'.repeat(this.gridSize * 4 + 1) + '\n';
      
      if (this.gameManager.winflag) {
        output += '🎉 恭喜！你清空了所有数字！\n';
      } else if (this.gameManager.loseflag) {
        output += '😔 没有可用的序列了！\n';
      } else {
        output += `提示: 选择相邻的递增数字序列（长度≥${this.minSequenceLength}）\n`;
      }
      
      // 输出到控制台
      console.log(output);
      
      return output;
    },
  }
});