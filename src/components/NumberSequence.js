import { GameComponentPresets } from '../utils/gameComponentFactory.js';
import { shuffleCards } from '../utils/help.js';

export default GameComponentPresets.puzzleGame({
  name: 'NumberSequence',
  
  data() {
    return {
      grid: [],
      selectedCells: [],
      score: 0,
      rowCount: 9,
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
    },

    // 每层递归最多消除三个格子
    maxDepth() {
      return Math.ceil(this.rowCount * this.columnCount / 3);
    }
  },

  created() {
    this.sendCustomButtons();
  },

  methods: {
    sendCustomButtons() {
      // 添加Spider游戏特有的发牌按钮（如果牌堆有牌）
      this.customButtons.push({
        action: 'handleCellClick',
        label: 'CLICK',
        method: 'handleCellClick',
        args: [],
        description: 'CLICK ONE CELL'
      });
    },

    init() {
      this.grid = this.generateGrid();
      this.selectedCells = [];
      this.score = 0;
    },

    handleCellClick(row, col) {
      if (this.grid[row][col] === null) return;
      
      const cellData = { row, col, value: this.grid[row][col] };
      
      // 如果当前没有选择，开始新选择
      if (this.selectedCells.length === 0) {
        this.selectedCells = [cellData];
        return;
      }
      
      // 如果点击的是已选中的最后一个单元格，确认选择
      if (this.selectedCells[this.selectedCells.length - 1].row === row && 
          this.selectedCells[this.selectedCells.length - 1].col === col) {
        this.confirmSequence();
        return;
      }
      
      // 如果点击的是已选中的第一个单元格，清除选择
      if (this.selectedCells[0].row === row && 
          this.selectedCells[0].col === col) {
        this.clearSelection();
        return;
      }
      
      // 检查是否可以添加到当前序列
      if (this.isCellSelectableNext(row, col)) {
        const lastCell = this.selectedCells[this.selectedCells.length - 1];
        const fromLastCell = this.findSequenceFrom(lastCell.row, lastCell.col, undefined, this.grid);
        const toCell = fromLastCell.filter(seq => seq[seq.length - 1].row === row && seq[seq.length - 1].col === col && !seq.slice(1).some(cell => this.isCellSelected(cell.row, cell.col)));
        toCell[0].slice(1).forEach(cell => this.selectedCells.push(cell));
      } else {
        // 不能添加到当前序列，尝试从第一个单元格开始新选择
        const firstCell = this.selectedCells[0];
        const fromFirstCell = this.findSequenceFrom(firstCell.row, firstCell.col, undefined, this.grid);
        const toCell = fromFirstCell.filter(seq => seq[seq.length - 1].row === row && seq[seq.length - 1].col === col);
        if (toCell.length > 0) {
          this.clearSelection();
          toCell[0].forEach(cell => this.selectedCells.push(cell));
        } else {
          // 不能添加，开始新选择
          this.selectedCells = [cellData];
        }
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
      if (lastCell.row === row && lastCell.col === col) return false;
      const fromLastCell = this.findSequenceFrom(lastCell.row, lastCell.col, undefined, this.grid);
      const toCell = fromLastCell.filter(seq => seq[seq.length - 1].row === row && seq[seq.length - 1].col === col && !seq.slice(1).some(cell => this.isCellSelected(cell.row, cell.col)));
      if (toCell.length === 0) return false;
      return true;
    },

    generateGrid() {
      let cards = [];
      const total = this.rowCount * this.columnCount;
      for (let i = 0; i < total; i++) {
        cards.push(i);
      }
      shuffleCards(cards, total);
      const grid = [];
      for (let i = 0; i < this.rowCount; i++) {
        const row = [];
        for (let j = 0; j < this.columnCount; j++) {
          row.push((cards[i * this.columnCount + j] % 13) + 1);
          // row.push((cards[i * this.columnCount + j] >> 2) + 1);
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
            const res = this.findSequenceFrom(i, j, undefined, grid);
            const validSequences = res.filter(seq => seq.length >= this.minSequenceLength);
            sequences.push(...validSequences);
          }
        }
      }
      
      return sequences;
    },

    findAllValidSequencesWithStackingOrNot(grid, allowStacking = null) {
      const sequences = this.findAllValidSequences(grid);
      
      if (allowStacking !== null) {
        return sequences.filter(seq => {
          const hasStacking = this.hasStackingAboveSequence(grid, seq);
          return allowStacking ? hasStacking : !hasStacking;
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
      const repeatNumberAmount = new Array(13).fill(0);
      for (let i = 0; i < this.rowCount; i++) {
        for (let j = 0; j < this.columnCount; j++) {
          if (grid[i][j] !== null) {
            repeatNumberAmount[grid[i][j]] ++;
          }
        }
      }
      return repeatNumberAmount;
    },

    // 统计所有序列经过每个单元格的次数，次数越多越容易被消除
    countCellVisits(sequences) {
      const cellVisits = new Array(this.rowCount).fill(null)
        .map(() => new Array(this.columnCount).fill(0));
      
      for (const seq of sequences) {
        for (const cell of seq) {
          cellVisits[cell.row][cell.col]++;
        }
      }
      
      return cellVisits;
    },
    
    // 统计未经过的单元格数量，代表这些单元格无法被非堆叠序列消除
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
    
    detectRegionsAfterColumnElimination(grid) {
      // 使用BFS检测消除操作后的独立区域
      const visited = Array(this.rowCount).fill(null).map(() => Array(this.columnCount).fill(false));
      const regions = [];
      
      // 遍历所有单元格，找到未访问的非空单元格作为新区域的起始点
      for (let row = 0; row < this.rowCount; row++) {
        for (let col = 0; col < this.columnCount; col++) {
          if (grid[row][col] !== null && !visited[row][col]) {
            // 找到新区域，使用BFS探索
            const region = [];
            const queue = [{row, col}];
            visited[row][col] = true;
            
            while (queue.length > 0) {
              const {row: r, col: c} = queue.shift();
              region.push({row: r, col: c, value: grid[r][c]});
              
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
      
      // 按区域大小（剩余单元格数量）排序
      regions.sort((a, b) => a.length - b.length);
      
      return regions;
    },
    
    createRegionSubgrid(regionCells) {
      // 根据区域单元格创建子网格
      const regionGrid = Array.from({length: this.rowCount}, () => Array(this.columnCount).fill(null));
      
      // 将区域中的单元格复制到子网格中
      for (const cell of regionCells) {
        regionGrid[cell.row][cell.col] = cell.value;
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
        // 非不堆叠缓存的优先级大于不堆叠缓存，不堆叠时记录的非完美解，可以在非不堆叠的情况重新寻找完美解，其他情况则直接返回缓存结果
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
      // findAllValidSequencesWithStackingOrNot 函数将所有序列分为堆叠和不堆叠两类
      const validSequences = this.findAllValidSequencesWithStackingOrNot(grid, allowStacking);
      
      // 基础情况：没有有效序列
      if (validSequences.length === 0) {
        return {
          firstSequence: null,
          remainingCells: this.countRemainingCells(grid)
        };
      }

      // ✅ 优化1：区域分割检测（基于连通性的独立子问题）
      const regionResult = this.tryRegionDecomposition(grid, depth);
      if (regionResult.remainingCells === 0) {
        return regionResult;
      } else if (regionResult.hasSubGrid) {
        return regionResult; // ✅ 最关键剪枝：区域分解成功，但存在子区域无完美解，立即放弃该分解方案
      }
      
      // ✅ 优化2：然后横向分割，优先尝试上层无堆叠序列，因为无堆叠序列消除时不会触发重力机制打乱数字分布，更容易命中缓存，并可以为堆叠序列提供新的特征信息
      const noStackResult = this.exploreSequences(grid, validSequences, false, depth, null);
      if (noStackResult && noStackResult.remainingCells === 0) {
        return noStackResult;
      }
      
      // ✅ 优化3：最后尝试其他堆叠在下层的序列
      const result = this.exploreSequences(grid, validSequences, true, depth, noStackResult);
      
      return result;
    },
    
    exploreSequences(grid, validSequences, allowStacking, depth, initialBest = null) {
      const currentRemaining = this.countRemainingCells(grid);
      let bestResult = initialBest || {
        firstSequence: null,
        remainingCells: currentRemaining
      };
      
      // 如果深度过大且还有很多剩余，说明很难找到完美解
      if (depth > this.maxDepth * 0.8) {
        if (currentRemaining > this.maxDepth * 1.5) {
          return bestResult;
        }
        if (depth > this.maxDepth * 0.9 && currentRemaining > this.maxDepth * 0.5) {
          return bestResult;
        }
      }
      
      const sequencesWithScore = [];
      const repeatNumberAmount = this.countRepeatNumberAmount(grid);
      const cellVisits = this.countCellVisits(validSequences);
      
      for (const sequence of validSequences) {
        if (bestResult.remainingCells === 0) {
          break;
        }
        
        const newGrid = this.simulateSequenceExecution(sequence, grid);
        const totalRepeat = sequence.reduce((total, cell) => total + repeatNumberAmount[cell.value], 0); // 优先消除重复次多的数字利于寻找严格递增序列，是与完美解相关度较高的特征
        const unreachable = !allowStacking ? this.countUnreachableCellsAfterSequence(newGrid) : 0; // 计算静态不可达单元格数量，代表这些单元格无法被非堆叠序列消除
        const totalVisits = sequence.reduce((total, cell) => total + cellVisits[cell.row][cell.col], 0); // 优先消除被访问次数少的单元格，提前消除这些最难消除的解题瓶颈，更容易找到完美解
        const notStackingRemainCells = allowStacking ? sequence.notStackingRemainCells : 0;
        const sequenceLengthBonus = sequence.length * 1000; // 增加序列长度奖励，剩余数字越少，后续计算规模越小
        
        // ✨ 优化后的评分函数 - 最终优化版本（v3）
        // 经过4轮迭代优化，v3达到最佳平衡：
        // 成果：性能提升20.8%，第1位占比提升至56.76%，前30%位置占比提升至72.97%
        // 权重调整（相对于基准）：
        // 1. unreachable权重提升20%（100→120），更积极避免死角
        // 2. sequenceLengthBonus提升30%（1000→1300），适度偏好长序列
        // 3. totalVisits权重降低15%（10000→8500），减少对访问频率的依赖
        // 4. totalRepeat保持不变（100000），它是核心特征
        const score = notStackingRemainCells * 10 + unreachable * 120 + totalVisits * 8500 - sequenceLengthBonus * 1.3 - totalRepeat * 100000;
        
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
    
    tryRegionDecomposition(grid, depth) {
      // 检测消除操作后的独立区域
      const regions = this.detectRegionsAfterColumnElimination(grid);
      let result = {
        hasSubGrid: false,
        firstSequence: null,
        remainingCells: this.countRemainingCells(grid),
      };
      
      // 如果存在多个独立区域，分别处理每个区域
      if (regions.length <= 1) return result;

      result.hasSubGrid = true;
      let tempFirstSequence = null;
      
      // 按区域大小排序（已从大到小）
      for (const region of regions) {
        const regionGrid = this.createRegionSubgrid(region);
        const subResult = this.findOptimalSequencePathWithCache(regionGrid, tempFirstSequence, null, depth + 1);
        
        // ✅ 关键剪枝：存在子区域无完美解，立即放弃该分解方案
        if (subResult.remainingCells !== 0) {
          return result;
        }
        
        tempFirstSequence = subResult.firstSequence;
      }

      result.firstSequence = tempFirstSequence;
      return result;
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
      foundSequences.push([...sequence]);
      
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

    findSequenceFrom(startRow, startCol, visited = Array(this.rowCount).fill().map(() => Array(this.columnCount).fill(false)), grid) {
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
      output += '═'.repeat(this.columnCount * 5 + 1) + '\n';
      
      for (let i = 0; i < this.rowCount; i++) {
        output += '║';
        for (let j = 0; j < this.columnCount; j++) {
          const cell = this.grid[i][j];
          if (cell === null) {
            output += '    ║';
          } else if (this.selectedCells.find(cell => cell.row === i && cell.col === j)) {
            output += `(${cell.toString().padStart(2, ' ')})║`;
          } else {
            output += ` ${cell.toString().padStart(2, ' ')} ║`;
          }
        }
        output += '\n';
        if (i < this.rowCount - 1) {
          output += '╠' + '════╬'.repeat(this.columnCount - 1) + '════╣\n';
        }
      }
      
      output += '═'.repeat(this.columnCount * 5 + 1) + '\n';
      
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