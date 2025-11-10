import { GameComponentPresets } from '../utils/gameComponentFactory.js';
import { shuffleCards } from '../utils/help.js';

export default GameComponentPresets.puzzleGame({
  name: 'NumberSequence',
  
  data() {
    return {
      grid: [],
      selectedCells: [],
      score: 0,
      rowCount: 8,
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
      this.generateMode === 0 && shuffleCards(cards, total);
      const grid = [];
      const generate = [
        () => Math.floor(13 * Math.random()),
        (card) => card % 13,
        (card) => (card >> 2)
      ][this.generateMode];
      for (let i = 0; i < this.rowCount; i++) {
        const row = [];
        for (let j = 0; j < this.columnCount; j++) {
          row.push(generate(cards[i * this.columnCount + j]) + 1);
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

    sortSequencesWithMinCrossColumnsCount(sequences) {
      const crossColumnsCount = new Array(this.columnCount - 1)
        .fill(null)
        .map((_, index) => ({
          crossSequences: [],
          index,
        }));

      sequences.map(seq => {
        const crossColumns = new Array(this.columnCount).fill(false);
        seq.map(cell => crossColumns[cell.col] = true);
        for (let i = 0; i < this.columnCount - 1; i ++) {
          if (crossColumns[i] && crossColumns[i + 1]) {
            crossColumnsCount[i].crossSequences.push(seq);
          }
        }
      })
      
      // 按列间交叉序列数量从多到少排序，相同数量按序号从小到大排序
      return crossColumnsCount.sort((a, b) => {
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
      const repeatNumberAmount = new Array(14).fill(0);
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

      // ✅ 优化1：区域分割检测（纵向独立子问题，从基于连通性的算法回滚，因为连通性算法无法识别包含虽然连通但无有效序列的情况）
      const regionResult = this.tryRegionDecomposition(grid, validSequences, depth);
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
      const sequencesWithMinCrossColumnsCount = this.sortSequencesWithMinCrossColumnsCount(validSequences);
      
      for (const sequence of validSequences) {
        if (bestResult.remainingCells === 0) {
          break;
        }
        
        const newGrid = this.simulateSequenceExecution(sequence, grid);
        
        // ✨ 评分函数 v5-Corrected - 基于当前难度（rowCount=7）的降维分析
        // 数据来源：411个样本（种子1-50，rowCount=7），修正后的降维算法
        // 关键修正：
        // 1. 使用最新基准数据（rowCount=7）而非历史数据（rowCount=9）
        // 2. 严格区分特征-特征相关性（降维）和特征-目标相关性（权重）
        // 3. 基于VIF而非目标相关性来决定移除哪个冗余特征
        
        // 核心发现：难度调整导致特征重要性完全改变！
        // - totalRepeat: 从r=0（无效）变为r=-0.337（高度有效）
        // - sequenceLength: 从r=0.575（最强）变为r=-0.114（弱）
        // - 重复特征组（totalRepeat/avgRepeat/maxRepeat/minRepeat）成为最重要特征
        
        // 降维后的6个独立特征（基于VIF和修正后的算法）
        const totalRepeat = sequence.reduce((total, cell) => total + repeatNumberAmount[cell.value], 0);  // r=-0.337（高），VIF=6.87
        const minVisits = Math.min(...sequence.map(cell => cellVisits[cell.row][cell.col]));  // 优先消除被访问次数少的单元格，提前消除这些最难消除的解题瓶颈，更容易找到完美解
        const avgRepeat = totalRepeat / sequence.length;  // r=-0.364（最高），VIF=6.87
        const maxRepeat = Math.max(...sequence.map(cell => repeatNumberAmount[cell.value]));  // r=-0.308（高），VIF=5.44，优先消除重复次多的数字利于寻找严格递增序列
        const unreachable = !allowStacking ? this.countUnreachableCellsAfterSequence(newGrid) : 0;  // 静态不可达单元格数量，代表这些单元格无法被非堆叠序列消除
        const minRepeat = Math.min(...sequence.map(cell => repeatNumberAmount[cell.value]));  // r=-0.308（高），VIF=1.78
        const crossSequencesIndex = sequencesWithMinCrossColumnsCount.findIndex(group => group.crossSequences.indexOf(sequence) >=0); // 优先消除数量最少的一组列间交叉序列，便于按列划分子问题，可以快速试错，序号越大越优先，-1最不优先
        const notStackingRemainCells = allowStacking ? sequence.notStackingRemainCells : 0; // 没经过统计方法验证的特征默认视为低相关度特征并保留
        const avgRow = sequence.reduce((sum, cell) => sum + cell.row, 0) / sequence.length;  // r=0.199（中），VIF=3.35
        const sequenceLength = sequence.length;  // r=-0.114（低），VIF=1.40
        
        // 评分函数：权重与特征-目标相关性成正比
        // ⚠️ 关键：相关性为负时使用负权重，确保排序方向正确
        const score = 
          // 高相关性特征（重复特征组，总权重占比~88%）
          // 注：相关性为负，意味着值越大排名越靠前，所以用负权重
          - avgRepeat * 1000 +         // r=-0.364（负相关→负权重）
          - totalRepeat * 926 +        // r=-0.337（负相关→负权重）
          - maxRepeat * 847 +          // r=-0.308（负相关→负权重）
          - minRepeat * 845 +          // r=-0.308（负相关→负权重）
          
          // 中相关性特征（空间特征，权重占比~9%）
          avgRow * 546 +               // r=0.199（正相关→正权重）
          minVisits * 680 +
          unreachable * 190 +

          // 低相关性特征（序列长度，权重占比~3%）
          - crossSequencesIndex * 100 +
          notStackingRemainCells * 60 +
          - sequenceLength * 312;      // r=-0.114（负相关→负权重）
        
        // 注：移除的特征（因VIF=∞或相关性极低）：
        // - 访问频率组（minVisits/avgVisits/maxVisits/totalVisits）：VIF=∞
        // - 空间进度组（depth/remainingCells/avgCol）：VIF=∞
        // - 数值特征组（valueVariance/valueRange/avgValue）：相关性<0.06
        // - 形状特征组（columnSpan/rowSpan/positionSpread）：相关性<0.09
        // - 领域知识（unreachable）：相关性降至0.036（在新难度下失效）
        
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
    
    tryRegionDecomposition(grid, validSequences, depth) {
      const sequencesWithMinCrossColumnsCount = this.sortSequencesWithMinCrossColumnsCount(validSequences);
      const gridGroups = [{
        subGrids: [],
        leftSubGrid: grid,
      }]

      for (let i = 0; i < gridGroups.length; i++) {
        let {subGrids} = gridGroups[i];
        // 按列间交叉序列从少到多遍历
        for (let j = sequencesWithMinCrossColumnsCount.length - 1; j >= 0; j--) {
          const crossSequencesGroup = sequencesWithMinCrossColumnsCount[j];
          // 有列间交叉序列时，退出子问题预分割阶段
          if (crossSequencesGroup.crossSequences.length !== 0) break;
          const rightColumnRemainingCells = this.countRemainingCellsInOneColumn(grid, crossSequencesGroup.index + 1);
          const [rightMin, rightMax] = this.getMinAndMaxNumberInOneColumn(grid, crossSequencesGroup.index + 1);
          // 如果列中没有剩余单元格，说明当前网格存在左右两个不连通区域，将当前子网格分割为左右两个子网格
          if (rightColumnRemainingCells === 0) {
            const rightSubGrid = this.createRegionSubgrid(gridGroups[i].leftSubGrid, crossSequencesGroup.index, false);
            subGrids.push(rightSubGrid);
            gridGroups[i].leftSubGrid = this.createRegionSubgrid(gridGroups[i].leftSubGrid, crossSequencesGroup.index, true);
            continue;
          }
          // 如果两列中有剩余单元格，但列中的值不全相同，此时当堆叠序列被消除时可能重新产生列间交叉序列，无法分割
          const [leftMin, leftMax] = this.getMinAndMaxNumberInOneColumn(gridGroups[i].leftSubGrid, crossSequencesGroup.index);
          if (rightMax - rightMin !== 0 || leftMax - leftMin !== 0) continue;
          // 如果两列中的值相同，因为相同的值无法组成严格递增序列，所以将当前子网格分割为左右两个子网格
          if (leftMin === rightMin) {
            subGrids.push(this.createRegionSubgrid(gridGroups[i].leftSubGrid, crossSequencesGroup.index, false));
            gridGroups[i].leftSubGrid = this.createRegionSubgrid(gridGroups[i].leftSubGrid, crossSequencesGroup.index, true);
            continue;
          }
          // 如果当前列是第一列，不继续分割
          if (crossSequencesGroup.index === 0) continue;
          const [thirdMin, thirdMax] = this.getMinAndMaxNumberInOneColumn(gridGroups[i].leftSubGrid, crossSequencesGroup.index - 1);
          // 如果当前列的上一列中的值不全相同，不继续分割
          if (thirdMax - thirdMin !== 0) continue;
          // 如果三列中的值各自相同，且当前列两侧的列中的值都比当前列中的值大或小，当前列中的值无法组成严格递增序列，此时存在两种分割方案
          if (rightMin < leftMax && thirdMax < leftMax || rightMax > leftMax && thirdMin > leftMax) {
            gridGroups.push({
              subGrids: [...subGrids, this.createRegionSubgrid(gridGroups[i].leftSubGrid, crossSequencesGroup.index - 1, false)],
              leftSubGrid: this.createRegionSubgrid(gridGroups[i].leftSubGrid, crossSequencesGroup.index - 1, true),
            })
            subGrids.push(this.createRegionSubgrid(gridGroups[i].leftSubGrid, crossSequencesGroup.index, false));
            gridGroups[i].leftSubGrid = this.createRegionSubgrid(gridGroups[i].leftSubGrid, crossSequencesGroup.index, true);
          }
        }
      }
      const remainingCells = this.countRemainingCells(grid);
      let result = {
        hasSubGrid: false,
        firstSequence: null,
        remainingCells,
      };
      for (let {subGrids, leftSubGrid} of gridGroups) {
        subGrids.push(leftSubGrid);
        subGrids = subGrids.filter(subGrid => this.countRemainingCells(subGrid) !== 0).sort((a, b) => this.countRemainingCells(a) - this.countRemainingCells(b));
        // 子问题没有缩小问题规模，说明分解失败，若不退出将陷入死循环
        if (subGrids.length === 1) break;
        let tempFirstSequence = null;
        let tempRemainingCells = 0;
        for (const subGrid of subGrids) {
          const subResult = this.findOptimalSequencePathWithCache(subGrid, tempFirstSequence, null, depth + 1);
          
          tempFirstSequence = subResult.firstSequence;
          tempRemainingCells += subResult.remainingCells;
          
          // ✅ 关键剪枝：存在子区域无完美解，立即放弃该分解方案
          if (subResult.remainingCells !== 0) {
            result.hasSubGrid = true;
            break;
          }
        }

        if (tempRemainingCells === 0) {
          return {
            hasSubGrid: true,
            firstSequence: tempFirstSequence,
            remainingCells: 0,
          };
        }
      }
      return result;
    },
    
    getGridKey(grid) {
      // 生成网格的唯一标识符
      return grid.map(row => row.map(cell => cell === null ? '_' : cell).join(',')).join('|');
    },

    // 统计某一列中剩余单元格的数值范围
    getMinAndMaxNumberInOneColumn(grid, col) {
      let min = Infinity, max = 0;
      for (let row = 0; row < this.rowCount; row++) {
        const value = grid[row][col];
        if (value == null) continue;
        if (value < min) min = value;
        if (value > max) max = value;
      }
      return [min, max];
    },

    // 计算某一列中剩余单元格的数量
    countRemainingCellsInOneColumn(grid, col) {
      let count = 0;
      for (let row = 0; row < this.rowCount; row++) {
        if (grid[row][col] !== null) {
          count++;
        }
      }
      return count;
    },

    // 计算网格中剩余单元格的数量
    countRemainingCells(grid) {
      let count = 0;
      for (let col = 0; col < this.columnCount; col++) {
        count += this.countRemainingCellsInOneColumn(grid, col);
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