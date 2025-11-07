import { GameComponentPresets } from '../utils/gameComponentFactory.js';

export default GameComponentPresets.puzzleGame({
  name: 'NumberSequence',
  
  data() {
    return {
      grid: [],
      selectedCells: [],
      score: 0,
      rowCount: 6,
      columnCount: 4,
      minSequenceLength: 3,
      // 状态缓存
      _stateCache: null
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
      for (let i = 0; i < this.rowCount; i++) {
        const row = [];
        for (let j = 0; j < this.columnCount; j++) {
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
        this._stateCache = new Map();
        
        const result = this.findOptimalSequencePath(this.grid, []);
        const bestSequence = result.path[0] || validSequences[0];
        
        this._stateCache = null; // 清理缓存
        
        this.selectedCells = [];
        for (let seq of bestSequence) {
          this.selectedCells.push(seq);
          await this.wait();
        }
        this.confirmSequence();
      })
    },

    findAllValidSequences(grid, allowStacking = null) {
      const sequences = [];
      
      for (let i = 0; i < this.rowCount; i++) {
        for (let j = 0; j < this.columnCount; j++) {
          if (grid[i][j] !== null) {
            // ✅ 修复：为每个起始点创建独立的visited数组
            const visited = Array(this.rowCount).fill().map(() => Array(this.columnCount).fill(false));
            const res = this.findSequenceFrom(i, j, visited, grid);
            const validSequences = res.filter(seq => seq.length >= this.minSequenceLength);
            sequences.push(...validSequences);
          }
        }
      }
      
      if (allowStacking !== null) {
        return sequences.filter(seq => {
          const hasStacking = this.hasStackingAboveSequence(grid, seq);
          return allowStacking ? !hasStacking : hasStacking;
        });
      }
      
      return sequences;
    },
    
    // 检查序列上方是否存在未消除的格子
    hasStackingAboveSequence(grid, sequence) {
      if (!sequence || sequence.length === 0) return false;
      
      // 对于序列中的每个单元格，检查其上方是否有非空单元格
      for (const cell of sequence) {
        for (let row = cell.row - 1; row >= 0; row--) {
          if (grid[row][cell.col] !== null && !sequence.find(seqCell => seqCell.row === row && seqCell.col === cell.col)) {
            return true; // 上方存在未消除的格子
          }
        }
      }
      
      return false; // 上方没有未消除的格子
    },
    
    // 统计未经过的单元格数量
    countUnreachableCellsAfterSequence(newGrid) {
      
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
      
      // 统计执行后网格中所有非空单元格
      let totalNonEmptyCells = 0;
      for (let i = 0; i < this.rowCount; i++) {
        for (let j = 0; j < this.columnCount; j++) {
          if (newGrid[i][j] !== null) {
            totalNonEmptyCells++;
          }
        }
      }
      
      // 未经过的单元格数量 = 总非空单元格 - 可达单元格
      return totalNonEmptyCells - reachableCells.size;
    },
    
    createRegionSubgrid(region) {
      // 创建区域子网格，只包含该区域内的单元格
      const regionGrid = Array.from({length: this.rowCount}, () => Array(this.columnCount).fill(null));
      
      for (const cell of region.cells) {
        regionGrid[cell.row][cell.col] = cell.value;
      }
      
      return regionGrid;
    },
    
    detectRegionsAfterColumnElimination(grid) {
      const regions = [];
      const visited = Array.from({length: this.rowCount}, () => Array(this.columnCount).fill(false));
      
      for (let row = 0; row < this.rowCount; row++) {
        for (let col = 0; col < this.columnCount; col++) {
          if (grid[row][col] !== null && !visited[row][col]) {
            // 发现新的区域，使用BFS探索
            const region = {
              cells: [],
              remainingCells: 0
            };
            
            const queue = [{row, col}];
            visited[row][col] = true;
            
            while (queue.length > 0) {
              const {row: r, col: c} = queue.shift();
              region.cells.push({row: r, col: c, value: grid[r][c]});
              region.remainingCells++;
              
              // 检查四个方向的邻居
              const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
              for (const [dr, dc] of directions) {
                const newRow = r + dr;
                const newCol = c + dc;
                
                if (this.isValidCell(newRow, newCol) && 
                    !visited[newRow][newCol] && 
                    grid[newRow][newCol] !== null) {
                  visited[newRow][newCol] = true;
                  queue.push({row: newRow, col: newCol});
                }
              }
            }
            
            regions.push(region);
          }
        }
      }
      
      // 按剩余单元格数量排序
      regions.sort((a, b) => a.remainingCells - b.remainingCells);
      
      return regions;
    },
    
    findOptimalSequencePath(grid, currentPath, allowStacking = null, depth = 0) {
      const gridKey = this.getGridKey(grid);
      if (this._stateCache && this._stateCache.has(gridKey)) {
        return this._stateCache.get(gridKey);
      }
      
      const validSequences = this.findAllValidSequences(grid, allowStacking);
      
      // 基础情况：没有有效序列，返回当前路径和剩余格子数
      if (validSequences.length === 0) {
        const remainingCells = this.countRemainingCells(grid);
        return {
          path: [...currentPath],
          remainingCells: remainingCells
        };
      }
      
      const sequencesWithScore = [];
      
      for (const sequence of validSequences) {
        const newGrid = this.simulateSequenceExecution(sequence, grid);
        
        const noStackingResult = this.findOptimalSequencePath(
          newGrid,
          [...currentPath, sequence],
          false,
          depth + 1,
        );
        
        // 如果找到完美解，立即返回
        if (noStackingResult.remainingCells === 0) {
          return noStackingResult;
        }
        
        const unreachable = this.countUnreachableCellsAfterSequence(newGrid);
        const score = noStackingResult.remainingCells * 10000 + unreachable * 100 - sequence.length * 10;
        
        sequencesWithScore.push({ 
          sequence, 
          score, 
          newGrid, 
        });
      }
      
      sequencesWithScore.sort((a, b) => a.score - b.score);
      
      let bestResult = null;
      
      for (const {sequence, newGrid} of sequencesWithScore) {
        if (bestResult && bestResult.remainingCells === 0) {
          break;
        }
        
        // 区域检测：检查是否存在因整列消除导致的纵向分割
        const regions = this.detectRegionsAfterColumnElimination(newGrid);
        
        if (regions.length > 1) {
          let totalRemainingCells = 0;
          const regionResults = [];
          
          for (const region of regions) {
            const regionGrid = this.createRegionSubgrid(region);
            const regionResult = this.findOptimalSequencePath(
              regionGrid,
              [], // 区域独立求解，不传入currentPath
              true,
              depth + 1,
            );
            
            regionResults.push(regionResult);
            totalRemainingCells += regionResult.remainingCells;
            
            if (regionResult.remainingCells !== 0) {
              break;
            }
          }
          
          // 如果所有区域都能完美解决
          if (totalRemainingCells === 0) {
            const mergedPath = [sequence];
            for (const regionResult of regionResults) {
              mergedPath.push(...regionResult.path);
            }
            return {
              path: [...currentPath, ...mergedPath],
              remainingCells: 0
            };
          }
        } else {
          // 单区域情况，直接递归
          const result = this.findOptimalSequencePath(
            newGrid,
            [...currentPath, sequence],
            true,
            depth + 1,
          );
          
          if (result.remainingCells === 0) {
            return result;
          }
          
          // 更新最优结果
          if (!bestResult || result.remainingCells < bestResult.remainingCells) {
            bestResult = result;
          }
        }
      }
      
      // 返回找到的最优结果，或当前状态
      return bestResult || {
        path: [...currentPath],
        remainingCells: this.countRemainingCells(grid)
      };
    },
    
    getGridKey(grid) {
      // 生成网格的唯一标识符
      return grid.map(row => row.map(cell => cell === null ? '_' : cell).join(',')).join('|');
    },

    countRemainingCells(grid) {
      let count = 0;
      for (let row = 0; row < this.rowCount; row++) {
        for (let col = 0; col < this.columnCount; col++) {
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
      for (let col = 0; col < this.columnCount; col++) {
        let writePos = this.rowCount - 1;
        for (let row = this.rowCount - 1; row >= 0; row--) {
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
      return row >= 0 && row < this.rowCount && col >= 0 && col < this.columnCount;
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
      output += '═'.repeat(this.columnCount * 4 + 1) + '\n';
      
      for (let i = 0; i < this.rowCount; i++) {
        output += '║';
        for (let j = 0; j < this.columnCount; j++) {
          const cell = this.grid[i][j];
          if (cell === null) {
            output += '   ║';
          } else {
            output += ` ${cell} ║`;
          }
        }
        output += '\n';
        if (i < this.rowCount - 1) {
          output += '╠' + '═══╬'.repeat(this.columnCount - 1) + '═══╣\n';
        }
      }
      
      output += '═'.repeat(this.columnCount * 4 + 1) + '\n';
      
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