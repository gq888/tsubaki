import { GameComponentPresets } from '../utils/gameComponentFactory.js';

export default GameComponentPresets.puzzleGame({
  name: 'NumberSequence',
  
  data() {
    return {
      grid: [],
      selectedCells: [],
      score: 0,
      gridSize: 4,
      minSequenceLength: 3
    };
  },

  computed: {
    isGameComplete() {
      return this.grid && this.grid.length > 0 && this.grid.every(row => row.every(cell => cell === null));
    },
    
    hasValidMoves() {
      return this.findAllValidSequences().length > 0;
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

      const validSequences = this.findAllValidSequences();
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

    findAllValidSequences() {
      const sequences = [];
      const visited = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));
      
      for (let i = 0; i < this.gridSize; i++) {
        for (let j = 0; j < this.gridSize; j++) {
          if (this.grid[i][j] !== null) {
            const res = this.findSequenceFrom(i, j, visited);
            res.filter(seq => seq.length >= this.minSequenceLength);
            sequences.push(...res);
          }
        }
      }
      
      return sequences;
    },

    findBestSequenceWithLookahead(validSequences) {
      let bestSequence = validSequences[0];
      let minUnreachableCount = Infinity;

      for (const sequence of validSequences) {
        // 前瞻一步：模拟执行这个序列后的状态
        const futureState = this.simulateSequenceExecution(sequence);
        
        // 计算执行后"不能被任何序列消除的格子"数量
        const unreachableCount = this.countUnreachableCells(futureState);
        
        // 优先选择该数量最少的序列，如果数量相同则选择更长的序列
        if (unreachableCount < minUnreachableCount || 
            (unreachableCount === minUnreachableCount && sequence.length > bestSequence.length)) {
          minUnreachableCount = unreachableCount;
          bestSequence = sequence;
        }
      }
      console.log('bestSequence =', bestSequence, 'minUnreachableCount =', minUnreachableCount);
      return bestSequence;
    },

    simulateSequenceExecution(sequence) {
      // 创建当前状态的深拷贝
      const simulatedGrid = this.copyGrid(this.grid);
      
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

    countUnreachableCells(grid) {
      let unreachableCount = 0;
      
      // 遍历每个格子
      for (let row = 0; row < this.gridSize; row++) {
        for (let col = 0; col < this.gridSize; col++) {
          if (grid[row][col] !== null) {
            // 检查这个格子是否能被任何有效序列消除
            const canReach = this.canCellBeReachedInAnySequence(row, col, grid);
            if (!canReach) {
              unreachableCount++;
            }
          }
        }
      }
      
      return unreachableCount;
    },

    canCellBeReachedInAnySequence(targetRow, targetCol, grid) {
      // ✅ 正确实现：检查目标格子是否能被任何有效序列包含
      
      // 方法1：检查从目标格子出发的递增序列
      const sequence = [];
      const foundSequences = [];
      
      if (grid[targetRow][targetCol] !== null) {
        sequence.push({
          row: targetRow, 
          col: targetCol, 
          value: grid[targetRow][targetCol]
        });
        
        const visited = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));
        visited[targetRow][targetCol] = true;
        
        this.dfsFindSequenceFromCell(targetRow, targetCol, sequence, visited, foundSequences, grid);
      }
      
      // 方法2：检查目标格子是否可以作为其他序列的一部分
      // 遍历所有可能的起始点，看是否能形成包含目标格子的序列
      if (foundSequences.length === 0) {
        for (let startRow = 0; startRow < this.gridSize; startRow++) {
          for (let startCol = 0; startCol < this.gridSize; startCol++) {
            if (grid[startRow][startCol] !== null && !(startRow === targetRow && startCol === targetCol)) {
              const visited = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));
              const startSequence = [{
                row: startRow, 
                col: startCol, 
                value: grid[startRow][startCol]
              }];
              
              visited[startRow][startCol] = true;
              const sequences = [];
              
              this.dfsFindSequenceFromCell(startRow, startCol, startSequence, visited, sequences, grid, targetRow, targetCol);
              
              if (sequences.length > 0) {
                foundSequences.push(...sequences);
              }
            }
          }
        }
      }
      
      return foundSequences.length > 0;
    },

    dfsFindSequenceFromCell(row, col, sequence, visited, foundSequences, grid, targetRow = row, targetCol = col) {
      // 检查当前序列是否包含目标格子
      const containsTarget = sequence.some(cell => cell.row === targetRow && cell.col === targetCol);
      
      // 如果序列长度达到要求且包含目标格子，记录当前序列
      if (sequence.length >= this.minSequenceLength && containsTarget) {
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
          
          this.dfsFindSequenceFromCell(newRow, newCol, sequence, visited, foundSequences, grid, targetRow, targetCol);
          
          // 回溯
          sequence.pop();
          visited[newRow][newCol] = false;
        }
      }
    },

    findSequenceFrom(startRow, startCol, visited) {
      const sequences = [];
      const currentSequence = [{row: startRow, col: startCol, value: this.grid[startRow][startCol]}];
      
      this.dfsFindSequenceFromCell(startRow, startCol, currentSequence, visited, sequences, this.grid);
      
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