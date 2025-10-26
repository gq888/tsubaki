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
      return this.findAllValidSequences().length > 0;
    }
  },

  methods: {
    init() {
      this.grid = this.generateGrid();
      this.selectedCells = [];
      this.score = 0;
      this.gameManager.recordOperation({type: 'init', data: { grid: this.copyGrid(this.grid) }});
      this.gameManager.emit('init');
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

    stepFn() {
      if (this.isGameComplete) {
        this.gameManager.setWin();
        return;
      }

      const validSequences = this.findAllValidSequences();
      if (validSequences.length === 0) {
        this.gameManager.setLose();
        return;
      }

      // AI选择最长的序列
      const bestSequence = validSequences.reduce((best, current) => 
        current.length > best.length ? current : best
      );
      
      this.selectSequence(bestSequence);
    },

    findAllValidSequences() {
      const sequences = [];
      const visited = Array(this.gridSize).fill().map(() => Array(this.gridSize).fill(false));
      
      for (let i = 0; i < this.gridSize; i++) {
        for (let j = 0; j < this.gridSize; j++) {
          if (this.grid[i][j] !== null) {
            const sequence = this.findSequenceFrom(i, j, visited);
            if (sequence.length >= this.minSequenceLength) {
              sequences.push(sequence);
            }
          }
        }
      }
      
      return sequences;
    },

    findSequenceFrom(startRow, startCol, visited) {
      const sequences = [];
      const currentSequence = [{row: startRow, col: startCol, value: this.grid[startRow][startCol]}];
      
      this.dfsFindSequence(startRow, startCol, currentSequence, visited, sequences);
      
      return sequences.length > 0 ? sequences[0] : [];
    },

    dfsFindSequence(row, col, currentSequence, visited, allSequences) {
      if (currentSequence.length >= this.minSequenceLength) {
        allSequences.push([...currentSequence]);
        return;
      }

      const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
      const lastValue = currentSequence[currentSequence.length - 1].value;

      for (const [dr, dc] of directions) {
        const newRow = row + dr;
        const newCol = col + dc;
        
        if (this.isValidCell(newRow, newCol) && 
            !visited[newRow][newCol] && 
            this.grid[newRow][newCol] !== null &&
            this.grid[newRow][newCol] > lastValue) {
          
          visited[newRow][newCol] = true;
          currentSequence.push({
            row: newRow, 
            col: newCol, 
            value: this.grid[newRow][newCol]
          });
          
          this.dfsFindSequence(newRow, newCol, currentSequence, visited, allSequences);
          
          currentSequence.pop();
          visited[newRow][newCol] = false;
        }
      }
    },

    isValidCell(row, col) {
      return row >= 0 && row < this.gridSize && col >= 0 && col < this.gridSize;
    },

    selectSequence(sequence) {
      if (!this.isValidSequence(sequence)) {
        return false;
      }

      // 清除选中的序列
      for (const cell of sequence) {
        this.grid[cell.row][cell.col] = null;
      }
      
      // 下落效果
      this.applyGravity();
      
      // 更新分数
      this.score += sequence.length * 10;
      
      // 记录操作
      this.gameManager.recordOperation({
        type: 'selectSequence',
        data: {
          sequence: sequence.map(cell => ({row: cell.row, col: cell.col, value: cell.value})),
          score: this.score,
          grid: this.copyGrid(this.grid)
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

    applyGravity() {
      for (let col = 0; col < this.gridSize; col++) {
        // 从底部开始，将非空单元格下移
        let writePos = this.gridSize - 1;
        for (let row = this.gridSize - 1; row >= 0; row--) {
          if (this.grid[row][col] !== null) {
            if (row !== writePos) {
              this.grid[writePos][col] = this.grid[row][col];
              this.grid[row][col] = null;
            }
            writePos--;
          }
        }
      }
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
        // 恢复网格状态
        this.grid = this.copyGrid(operation.data.grid);
        this.score = operation.data.score;
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

    getAvailableActions() {
      const actions = [];
      
      if (!this.gameManager.winflag && !this.gameManager.loseflag) {
        actions.push({
          name: 'stepFn',
          label: '单步执行 (►)',
          description: 'AI执行一步最优选择'
        });
        
        actions.push({
          name: 'pass',
          label: '自动运行 (AUTO)',
          description: 'AI自动完成游戏'
        });
      }
      
      return actions;
    }
  }
});