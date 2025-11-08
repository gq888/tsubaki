import { GameComponentPresets } from '../utils/gameComponentFactory.js';

export default GameComponentPresets.puzzleGame({
  name: 'NumberSequence',
  
  data() {
    return {
      grid: [],
      selectedCells: [],
      score: 0,
      rowCount: 6,
      columnCount: 5,
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
        
        const result = this.findOptimalSequencePathWithCache(this.grid);
        console.log('remainingCells', result.remainingCells)
        const bestSequence = result.firstSequence || validSequences[0];
        
        this._stateCache = null; // 清理缓存
        
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
      
      return sequences;
    },

    sortSequencesWithMinCrossColumnsCount(sequences) {
      const crossColumnsCount = new Array(this.columnCount - 1)
        .fill(null)
        .map((_, index) => ({
          crossSequences: [],
          leftSequences: [],
          rightSequences: [],
          index,
        }));

      sequences.map(seq => {
        const crossColumns = new Array(this.columnCount).fill(false);
        seq.map(cell => crossColumns[cell.col] = true);
        for (let i = 0; i < this.columnCount - 1; i ++) {
          if (crossColumns[i] && crossColumns[i + 1]) {
            crossColumnsCount[i].crossSequences.push(seq);
          } else if (seq[0].col <= i && !crossColumns[i + 1]) {
            crossColumnsCount[i].leftSequences.push(seq);
          } else {
            crossColumnsCount[i].rightSequences.push(seq);
          }
        }
      })
      
      return crossColumnsCount.filter(item => item.leftSequences.length > 0 && item.rightSequences.length > 0).sort((a, b) => {
        const aCount = a.crossSequences.length;
        const bCount = b.crossSequences.length;  
        return bCount - aCount;
      });
    },

    findAllValidSequencesWithStackingOrNot(grid, allowStacking = null) {
      const sequences = this.findAllValidSequences(grid);
      
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

    countRepeatNumberAmount(grid) {
      const repeatNumberAmount = new Array(10).fill(0);
      for (let i = 0; i < this.rowCount; i++) {
        for (let j = 0; j < this.columnCount; j++) {
          if (grid[i][j] !== null) {
            repeatNumberAmount[grid[i][j]] ++;
          }
        }
      }
      return repeatNumberAmount;
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
    
    createRegionSubgrid(grid, index, left) {
      // 创建区域子网格，只包含该区域内的单元格
      const regionGrid = Array.from({length: this.rowCount}, () => Array(this.columnCount).fill(null));
      
      for (let col = 0; col < this.columnCount; col++) {
        if (!left) {
          if (col <= index) continue;
        } else {
          if (col > index) continue;
        }
        for(let row = 0; row < this.rowCount; row++) {
          regionGrid[row][col] = grid[row][col];
        }
      }
      
      return regionGrid;
    },

    findOptimalSequencePathWithCache(grid, firstSequence = null, allowStacking = null, depth = 0) {
      const gridKey = this.getGridKey(grid);
      if (this._stateCache && this._stateCache.has(gridKey)) {
        const cachedResult = this._stateCache.get(gridKey);
        // firstSequence 不录入缓存，缓存内容应仅与gridKey有关
        if (firstSequence) {
          cachedResult.firstSequence = firstSequence;
        }
        // 不堆叠时记录的非完美解，可以在非不堆叠的情况重新寻找完美解，其他情况则直接返回缓存结果
        if (!(cachedResult.allowStacking === false && cachedResult.remainingCells !== 0 && allowStacking !== false)) {
          return cachedResult;
        }
      }

      const bestResult = this.findOptimalSequencePath(grid, allowStacking, depth);
      if (this._stateCache) {
        this._stateCache.set(gridKey, bestResult);
      }
      
      // firstSequence 不录入缓存，缓存内容应仅与gridKey有关
      if (firstSequence) {
        bestResult.firstSequence = firstSequence;
      }
      bestResult.allowStacking = allowStacking;
      return bestResult;
    },
    
    findOptimalSequencePath(grid, allowStacking = null, depth = 0) {
      // findAllValidSequencesWithStackingOrNot 将所有序列分为堆叠和不堆叠两类
      const validSequences = this.findAllValidSequencesWithStackingOrNot(grid, allowStacking);
      
      // 基础情况：没有有效序列
      if (validSequences.length === 0) {
        return {
          firstSequence: null,
          remainingCells: this.countRemainingCells(grid)
        };
      }

      // ✅ 优化1：区域分割检测（纵向独立子问题）
      const crossSequences = [];
      const regionResult = this.tryRegionDecomposition(grid, validSequences, depth, crossSequences);
      if (regionResult && regionResult.remainingCells === 0) {
        return regionResult;
      }
      
      // ✅ 优化2：然后横向分割，优先尝试上层无堆叠序列（启发式搜索）
      const noStackResult = this.exploreSequences(grid, validSequences, false, depth, null, crossSequences);
      if (noStackResult && noStackResult.remainingCells === 0) {
        return noStackResult;
      }
      
      // ✅ 优化3：最后尝试其他堆叠在下层的序列（启发式排序 + 智能剪枝）
      const result = this.exploreSequences(grid, validSequences, true, depth, noStackResult, crossSequences);
      
      return result;
    },
    
    exploreSequences(grid, validSequences, allowStacking, depth, initialBest = null, crossSequences = []) {
      const currentRemaining = this.countRemainingCells(grid);
      let bestResult = initialBest || {
        firstSequence: null,
        remainingCells: currentRemaining
      };
      const sequencesWithScore = [];
      const repeatNumberAmount = this.countRepeatNumberAmount(grid);
      
      for (const sequence of validSequences) {
        if (bestResult.remainingCells === 0) {
          break;
        }
        
        const newGrid = this.simulateSequenceExecution(sequence, grid);
        const crossSequencesIndex = crossSequences.indexOf(sequence) - 100; // 优先处理列间交叉序列，便于按列划分子问题
        const totalRepeat = sequence.reduce((total, cell) => total + repeatNumberAmount[cell.value], 0); // 优先消除重复次多的数字利于寻找严格递增序列
        const unreachable = this.countUnreachableCellsAfterSequence(newGrid);
        const notStackingRemainCells = allowStacking ? sequence.notStackingRemainCells : 0;
        const score = crossSequencesIndex * 100000 + notStackingRemainCells * 1000 + unreachable * 100 - sequence.length * 10 - totalRepeat * 10000;
        
        sequencesWithScore.push({ 
          sequence, 
          score, 
          newGrid, 
        });
      }
      
      sequencesWithScore.sort((a, b) => a.score - b.score);
      
      for (const {sequence, newGrid} of sequencesWithScore) {
        if (bestResult.remainingCells === 0) {
          break;
        }

        const result = this.findOptimalSequencePathWithCache(
          newGrid,
          sequence,
          allowStacking,
          depth + 1,
        );

        // 记录非堆叠时的剩余单元格数量，用于堆叠时的启发式搜索
        if (!allowStacking) {
          sequence.notStackingRemainCells = result.remainingCells;
        }
        
        // 更新最优结果
        if (result.remainingCells < bestResult.remainingCells) {
          bestResult = result;
          
          // ✅ 找到完美解，立即停止
          if (bestResult.remainingCells === 0) {
            break;
          }
        }
      }
      
      return bestResult;
    },
    
    tryRegionDecomposition(grid, validSequences, depth, crossSequences) {
      const sequencesWithMinCrossColumnsCount = this.sortSequencesWithMinCrossColumnsCount(validSequences);
      if (sequencesWithMinCrossColumnsCount.length === 0) return null;
      
      const subGrids = [];
      let rightSubGrid = grid;

      for (const sequence of sequencesWithMinCrossColumnsCount) {
        if (sequence.crossSequences.length === 0) {
          subGrids.push(this.createRegionSubgrid(rightSubGrid, sequence.index, true));
          rightSubGrid = this.createRegionSubgrid(rightSubGrid, sequence.index, false);
        } else {
          crossSequences.push(...sequence.crossSequences);
        }
      }
      
      if (subGrids.length === 0) return null;
      
      subGrids.push(rightSubGrid);
      let tempFirstSequence = null;
      
      for (const subGrid of subGrids) {
        const result = this.findOptimalSequencePathWithCache(subGrid, tempFirstSequence, null, depth + 1);
        
        // ✅ 关键剪枝：任何子区域非完美解，立即放弃该分解方案
        if (result.remainingCells !== 0) {
          return null;
        }
        tempFirstSequence = result.firstSequence;
      }

      return {
        firstSequence: tempFirstSequence,
        remainingCells: 0
      }
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
          } else if (this.selectedCells.find(cell => cell.row === i && cell.col === j)) {
            output += `(${cell})║`;
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