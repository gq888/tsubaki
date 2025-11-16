import { GameComponentPresets } from '../utils/gameComponentFactory.js';
import { shuffleCards } from '../utils/help.js';
import { xgbPredict as xgbPredictMode0 } from '../models/mode0_xgb_ensemble.js';
import { xgbPredict as xgbPredictMode1 } from '../models/mode1_xgb_ensemble.js';

const XGB_WEIGHTS = {
  totalRepeat: 9,
  unreachable: 9,
  totalVisits: 16,
  sequenceLength: 17,
  remainingCells: 38,
  avgValue: 1,
  valueVariance: 24,
  valueRange: 52,
  avgRow: 29,
  avgCol: 1,
  positionSpread: 1,
  columnSpan: 17,
  rowSpan: 18,
  depth: 26,
  allowStacking: 1,
  minVisits: 13,
  maxVisits: 8,
  minRepeat: 18,
  maxRepeat: 2,
  crossSequencesIndex: 14,
  notStackingRemainCells: 2,
  lengthRepeatProduct: 226,
  lengthSpreadProduct: 4,
  repeatSpreadProduct: 347,
  rowSpreadProduct: 55,
  logLength: 0,
  logTotalRepeat: 18,
  logPositionSpread: 0,
  sqrtLength: 0,
  sqrtTotalRepeat: 5,
  sqrtPositionSpread: 0,
  repeatDensity: 6,
  spanEfficiency: 8,
  positionConcentration: 0
};

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
      generateMode: 1,
      // 状态缓存
      _stateCache: null,
      // 特征收集系统
      _featureCollector: null,
      _enableFeatureCollection: false
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
    computeXgbApproxScore(features) {
      let s = 0;
      for (const k in XGB_WEIGHTS) {
        const w = XGB_WEIGHTS[k] || 0;
        const v = features && features[k] !== undefined ? features[k] : 0;
        s += w * v;
      }
      return s;
    },
    // ==================== 特征收集系统 ====================
    
    /**
     * 初始化特征收集器
     */
    initFeatureCollector() {
      this._featureCollector = {
        totalSearches: 0,
        perfectSolutionFound: false,
        depthData: new Map(), // depth -> {candidates: [], perfectIndex: -1, features: []}
        summary: {
          totalCandidates: 0,
          totalDepths: 0,
          avgPerfectPosition: 0,
          avgCandidatesPerDepth: 0
        }
      };
      this._enableFeatureCollection = true;
    },
    
    /**
     * 提取序列的特征
     */
    extractSequenceFeatures(sequence, grid, validSequences, depth, allowStacking, sequencesWithMinCrossColumnsCount) {
      const newGrid = this.simulateSequenceExecution(sequence, grid);
      const repeatNumberAmount = this.countRepeatNumberAmount(grid);
      const cellVisits = this.countCellVisits(validSequences);
      
      // 基础特征
      const totalRepeat = sequence.reduce((total, cell) => total + repeatNumberAmount[cell.value], 0); // 优先消除重复次多的数字利于寻找严格递增序列
      const unreachable = !allowStacking ? this.countUnreachableCellsAfterSequence(newGrid) : 0; // 静态不可达单元格数量，代表这些单元格无法被非堆叠序列消除
      const totalVisits = sequence.reduce((total, cell) => total + cellVisits[cell.row][cell.col], 0); // 优先消除被访问次数少的单元格，提前消除这些最难消除的解题瓶颈，更容易找到完美解
      const sequenceLength = sequence.length; // 序列长度特征，剩余数字越少，后续计算规模越小，可以快速试错
      const remainingCells = this.countRemainingCells(newGrid);
      
      // 高级特征
      const avgValue = sequence.reduce((sum, cell) => sum + cell.value, 0) / sequence.length;
      const valueVariance = sequence.reduce((sum, cell) => sum + Math.pow(cell.value - avgValue, 2), 0) / sequence.length;
      const valueRange = sequence[sequence.length - 1].value - sequence[0].value;
      
      // 位置特征
      const avgRow = sequence.reduce((sum, cell) => sum + cell.row, 0) / sequence.length;
      const avgCol = sequence.reduce((sum, cell) => sum + cell.col, 0) / sequence.length;
      const positionSpread = Math.sqrt(
        sequence.reduce((sum, cell) => sum + Math.pow(cell.row - avgRow, 2) + Math.pow(cell.col - avgCol, 2), 0) / sequence.length
      );
      
      // 跨列特征
      const crossColumns = new Array(this.columnCount).fill(false);
      sequence.forEach(cell => crossColumns[cell.col] = true);
      const columnSpan = crossColumns.filter(Boolean).length;
      
      // 垂直特征
      const rowSpan = Math.max(...sequence.map(c => c.row)) - Math.min(...sequence.map(c => c.row)) + 1;
      
      // 新增特征：crossSequencesIndex，优先消除数量最少的一组列间交叉序列，便于按列划分子问题，可以快速试错，序号越大越优先，-1最不优先
      const crossSequencesIndex = sequencesWithMinCrossColumnsCount
        ? sequencesWithMinCrossColumnsCount.findIndex(group => group.crossSequences.indexOf(sequence) >= 0)
        : -1;
      
      // 新增特征：notStackingRemainCells（如果sequence对象包含此属性），没经过统计方法验证的特征默认视为低相关度特征并保留
      const notStackingRemainCells = sequence.notStackingRemainCells || 0;
      
      // 🔬 特征工程：交互特征（Feature Engineering）
      // 基于Stage 3-4的最强特征进行交互组合
      const minRepeat = Math.min(...sequence.map(cell => repeatNumberAmount[cell.value]));
      const maxRepeat = Math.max(...sequence.map(cell => repeatNumberAmount[cell.value]));
      
      // 交互特征1：长度×重复（序列长度与总重复次数的乘积）
      // 假设：长序列+高重复 = 更优（双重效应）
      const lengthRepeatProduct = sequenceLength * totalRepeat;
      
      // 交互特征2：长度×位置分散度（几何特征）
      // 假设：长序列+分散分布 = 覆盖更广，更优
      const lengthSpreadProduct = sequenceLength * positionSpread;
      
      // 交互特征3：重复×位置分散度
      // 假设：高重复+分散分布 = 全局优化效果
      const repeatSpreadProduct = totalRepeat * positionSpread;
      
      // 交互特征4：行跨度×位置分散度
      // 假设：垂直跨度与整体分散度的协同
      const rowSpreadProduct = rowSpan * positionSpread;
      
      // 🔬 非线性变换特征
      // 对数变换：压缩大值，扩展小值
      const logLength = Math.log(sequenceLength + 1);
      const logTotalRepeat = Math.log(totalRepeat + 1);
      const logPositionSpread = Math.log(positionSpread + 1);
      
      // 平方根变换：温和的非线性
      const sqrtLength = Math.sqrt(sequenceLength);
      const sqrtTotalRepeat = Math.sqrt(totalRepeat);
      const sqrtPositionSpread = Math.sqrt(positionSpread);
      
      // 🔬 比率特征
      // 重复密度：平均每个单元格的重复次数
      const repeatDensity = totalRepeat / sequenceLength;
      
      // 跨度效率：序列长度 / 行跨度（紧凑度）
      const spanEfficiency = sequenceLength / (rowSpan + 0.1); // 避免除零
      
      // 位置集中度：1 / (positionSpread + 0.1)（越集中越大）
      const positionConcentration = 1 / (positionSpread + 0.1);
      
      return {
        // 原有启发式特征
        totalRepeat,
        unreachable,
        totalVisits,
        sequenceLength,
        remainingCells,
        // 新增特征
        avgValue,
        valueVariance,
        valueRange,
        avgRow,
        avgCol,
        positionSpread,
        columnSpan,
        rowSpan,
        depth,
        allowStacking,
        // 访问频率特征
        minVisits: Math.min(...sequence.map(cell => cellVisits[cell.row][cell.col])),
        maxVisits: Math.max(...sequence.map(cell => cellVisits[cell.row][cell.col])),
        // 重复数字特征
        minRepeat,
        maxRepeat,
        // 新增特征
        crossSequencesIndex,
        notStackingRemainCells,
        
        // 🆕 交互特征（Feature Engineering）
        lengthRepeatProduct,      // 长度×重复
        lengthSpreadProduct,      // 长度×分散度
        repeatSpreadProduct,      // 重复×分散度
        rowSpreadProduct,         // 行跨度×分散度
        
        // 🆕 非线性变换特征
        logLength,                // log(长度)
        logTotalRepeat,           // log(重复)
        logPositionSpread,        // log(分散度)
        sqrtLength,               // sqrt(长度)
        sqrtTotalRepeat,          // sqrt(重复)
        sqrtPositionSpread,       // sqrt(分散度)
        
        // 🆕 比率特征
        repeatDensity,            // 重复密度
        spanEfficiency,           // 跨度效率
        positionConcentration     // 位置集中度
      };
    },
    
    /**
     * 记录候选序列数据
     */
    recordCandidates(depth, sequencesWithScore, bestResultRemainingCells) {
      if (!this._enableFeatureCollection || !this._featureCollector) return;
      
      const isPerfectDepth = bestResultRemainingCells === 0;
      let perfectIndex = -1;
      
      // 找到完美解的位置
      if (isPerfectDepth) {
        perfectIndex = sequencesWithScore.findIndex(item => {
          // 需要实际检查这个序列是否导致完美解
          const testResult = this.findOptimalSequencePathWithCache(
            item.newGrid,
            item.sequence,
            item.allowStacking,
            depth + 1
          );
          return testResult.remainingCells === 0;
        });
      }
      
      // 记录深度数据
      if (!this._featureCollector.depthData.has(depth)) {
        this._featureCollector.depthData.set(depth, {
          candidates: [],
          perfectIndex: -1,
          totalCandidates: sequencesWithScore.length,
          isPerfectDepth
        });
      }
      
      const depthInfo = this._featureCollector.depthData.get(depth);
      depthInfo.perfectIndex = perfectIndex;
      depthInfo.candidates = sequencesWithScore.map((item, index) => ({
        index,
        score: item.score,
        isPerfect: index === perfectIndex,
        features: item.features || {}
      }));
      
      this._featureCollector.totalSearches++;
      if (isPerfectDepth) {
        this._featureCollector.perfectSolutionFound = true;
      }
    },
    
    /**
     * 生成特征收集报告
     */
    generateFeatureReport() {
      if (!this._featureCollector) return null;
      
      const depths = Array.from(this._featureCollector.depthData.entries());
      const perfectDepths = depths.filter(data => data[1].perfectIndex >= 0);
      
      // 计算统计数据
      const totalCandidates = depths.reduce((sum, data) => sum + data[1].totalCandidates, 0);
      const avgCandidatesPerDepth = totalCandidates / depths.length;
      
      const perfectPositions = perfectDepths.map(data => data[1].perfectIndex);
      const avgPerfectPosition = perfectPositions.length > 0 
        ? perfectPositions.reduce((a, b) => a + b, 0) / perfectPositions.length 
        : -1;
      
      const perfectRelativePositions = perfectDepths.map(([_, data]) => {
        const relativePos = data.perfectIndex / data.totalCandidates;
        return {
          depth: _,
          absolutePosition: data.perfectIndex,
          relativePosition: relativePos,
          totalCandidates: data.totalCandidates
        };
      });
      
      const avgRelativePosition = perfectRelativePositions.length > 0
        ? perfectRelativePositions.reduce((sum, item) => sum + item.relativePosition, 0) / perfectRelativePositions.length
        : -1;
      
      return {
        summary: {
          totalSearches: this._featureCollector.totalSearches,
          totalDepths: depths.length,
          totalCandidates,
          avgCandidatesPerDepth: avgCandidatesPerDepth.toFixed(2),
          perfectSolutionFound: this._featureCollector.perfectSolutionFound,
          perfectDepthsCount: perfectDepths.length,
          avgPerfectPosition: avgPerfectPosition.toFixed(2),
          avgRelativePosition: (avgRelativePosition * 100).toFixed(2) + '%'
        },
        perfectPositionDetails: perfectRelativePositions,
        depthDetails: depths.map(([depth, data]) => ({
          depth,
          totalCandidates: data.totalCandidates,
          perfectIndex: data.perfectIndex,
          isPerfectDepth: data.isPerfectDepth,
          relativePosition: data.perfectIndex >= 0 ? (data.perfectIndex / data.totalCandidates * 100).toFixed(2) + '%' : 'N/A',
          candidates: data.candidates  // 包含完整的候选序列和特征数据
        }))
      };
    },
    
    // ==================== 原有方法 ====================
    
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
      this.generateMode !== 0 && shuffleCards(cards, total);
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
        // this.forceUpdate();
        
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
    
    /**
     * Mode 0 评分函数（generateMode=0：纯随机生成）
     * Stage 2优化：基于450样本降维分析的相关性权重
     * 训练数据：mode0-train-stage2.json (454样本, 50种子)
     * 降维分析：mode0-reduction-stage2.json
     * 策略：仅用Top 6独立特征（VIF<5），权重=|相关系数|×1000
     */
    calculateScoreMode0(sequence, repeatNumberAmount, cellVisits, sequencesWithMinCrossColumnsCount, newGrid, allowStacking) {
      // 提取Top 6独立特征（Stage 2降维推荐）
      const positionSpread = Math.sqrt(
        sequence.reduce((sum, cell) => {
          const avgRowCalc = sequence.reduce((s, c) => s + c.row, 0) / sequence.length;
          const avgColCalc = sequence.reduce((s, c) => s + c.col, 0) / sequence.length;
          return sum + Math.pow(cell.row - avgRowCalc, 2) + Math.pow(cell.col - avgColCalc, 2);
        }, 0) / sequence.length
      );
      
      const totalRepeat = sequence.reduce((total, cell) => total + repeatNumberAmount[cell.value], 0);
      const sequenceLength = sequence.length;
      const minRepeat = Math.min(...sequence.map(cell => repeatNumberAmount[cell.value]));
      const rowSpan = Math.max(...sequence.map(c => c.row)) - Math.min(...sequence.map(c => c.row)) + 1;
      const avgRow = sequence.reduce((sum, cell) => sum + cell.row, 0) / sequence.length;
      
      // ✅ Stage 3最优版本（9特征，历史最佳）
      // 训练数据：mode0-train-stage3.json (910样本, 100种子)
      // 测试集性能：66.36%（历史最佳，改善5.91%）
      // 泛化误差：12.9%（尚未达标，目标≤3%）
      // 注：Stage 4(10特征)和FE(交互项)均失败，此版本为当前最优
      const valueRange = Math.max(...sequence.map(c => c.value)) - Math.min(...sequence.map(c => c.value));
      const maxRepeat = Math.max(...sequence.map(cell => repeatNumberAmount[cell.value]));
      const crossSequencesIndex = sequencesWithMinCrossColumnsCount
        ? sequencesWithMinCrossColumnsCount.findIndex(group => group.crossSequences.indexOf(sequence) >= 0)
        : -1;
      
      return (
        - sequenceLength * 288 +           // r=-0.288 ⭐ 最强
        - totalRepeat * 264 +              // r=-0.264
        - positionSpread * 253 +           // r=-0.253
        - rowSpan * 251 +                  // r=-0.251
        - minRepeat * 213 +                // r=-0.213
        + crossSequencesIndex * 172 +      // r=+0.172
        + avgRow * 170 +                   // r=+0.170
        - valueRange * 136 +               // r=-0.136
        - maxRepeat * 131                  // r=-0.131
      );
      
      // Stage 2降维移除的14个特征:
      // 1. VIF>10严重共线性（7个）:
      //    - remainingCells/depth (VIF=39.55)
      //    - totalVisits/maxVisits (VIF=11.52)
      //    - valueVariance/valueRange (VIF=10.90)
      //    - minVisits (VIF=5.21)
      //
      // 2. RFE低重要性（7个）:
      //    - unreachable, crossSequencesIndex, maxRepeat
      //    - avgCol, avgValue, notStackingRemainCells, columnSpan
      //
      // 关键发现：positionSpread超越sequenceLength成为最强特征
      // 原因：样本量增加后，空间分布特征的稳定性更高
    },
    
    /**
     * Mode 1 评分函数（generateMode=1：模数生成）
     * 基于450个样本的统计分析
     * 数据来源：features-baseline-mode1-rowCount8.json
     * 降维分析：dimensionality-reduction-mode1.json
     */
    calculateScoreMode1(sequence, repeatNumberAmount, cellVisits, sequencesWithMinCrossColumnsCount, newGrid, allowStacking) {
      // Top 5 独立特征（所有VIF < 7）
      const avgCol = sequence.reduce((sum, cell) => sum + cell.col, 0) / sequence.length;      // r=-0.577（最强），VIF=1.54
      const maxRepeat = Math.max(...sequence.map(cell => repeatNumberAmount[cell.value]));     // r=-0.526，VIF=6.57
      const avgRow = sequence.reduce((sum, cell) => sum + cell.row, 0) / sequence.length;      // r=0.427，VIF=6.57
      const unreachable = !allowStacking ? this.countUnreachableCellsAfterSequence(newGrid) : 0;  // r=-0.399，VIF=2.33
      const minRepeat = Math.min(...sequence.map(cell => repeatNumberAmount[cell.value]));     // r=-0.399，VIF=3.08

      // 需要的其他特征（与Stage 2分析一致）
      const sequenceLength = sequence.length;
      const positionSpread = Math.sqrt(
        sequence.reduce((sum, cell) => {
          const avgRowCalc = sequence.reduce((s, c) => s + c.row, 0) / sequence.length;
          const avgColCalc = sequence.reduce((s, c) => s + c.col, 0) / sequence.length;
          return sum + Math.pow(cell.row - avgRowCalc, 2) + Math.pow(cell.col - avgColCalc, 2);
        }, 0) / sequence.length
      );
      const rowSpan = Math.max(...sequence.map(c => c.row)) - Math.min(...sequence.map(c => c.row)) + 1;
      const totalRepeat = sequence.reduce((total, cell) => total + repeatNumberAmount[cell.value], 0);
      const valueRange = Math.max(...sequence.map(c => c.value)) - Math.min(...sequence.map(c => c.value));
      const crossSequencesIndex = sequencesWithMinCrossColumnsCount
        ? sequencesWithMinCrossColumnsCount.findIndex(group => group.crossSequences.indexOf(sequence) >= 0)
        : -1;
      const logLength = Math.log(sequenceLength + 1);
      const logTotalRepeat = Math.log(totalRepeat + 1);
      const positionConcentration = 1 / (positionSpread + 0.1);
      const rowSpreadProduct = rowSpan * positionSpread;

      // 权重与相关性成正比，符号与相关性一致
      return (
        avgRow * (-516.0040793486988) +
        logLength * (446.4458185789566) +
        positionConcentration * (-407.83460898031444) +
        rowSpreadProduct * (377.40050408868217) +
        logTotalRepeat * (360.9363088368075) +
        valueRange * (355.63035409066214) +
        unreachable * (209.37170085844357) +
        maxRepeat * (199.24352488570165) +
        crossSequencesIndex * (-194.91040684872942)
      );
      
      // 注：移除的特征（VIF>10或相关性极低）
      // - avgVisits/maxVisits（VIF=494.53）
      // - totalVisits（VIF=107.89）
      // - depth/remainingCells（VIF=856.36）
      // - valueVariance/valueRange（VIF=20.27）
      // - minVisits（VIF=12.09）
      // - sequenceLength（r=0.197，被高VIF特征替代）
      // - crossSequencesIndex（r=0.301，中等但非最优）
      // - totalRepeat（r=0.334，被maxRepeat/minRepeat替代）
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
        
        // ✨ 基于generateMode的条件评分函数
        // 数据来源：450个样本（种子1-50），rowCount=8，两种生成模式独立分析
        // 已移除avgRepeat（与totalRepeat完全线性相关）
        
        const linearScore = this.generateMode === 0 
          ? this.calculateScoreMode0(sequence, repeatNumberAmount, cellVisits, sequencesWithMinCrossColumnsCount, newGrid, allowStacking)
          : this.calculateScoreMode1(sequence, repeatNumberAmount, cellVisits, sequencesWithMinCrossColumnsCount, newGrid, allowStacking);

        const features = this.extractSequenceFeatures(sequence, grid, validSequences, depth, allowStacking, sequencesWithMinCrossColumnsCount);
        const xgbApproxScore = this.computeXgbApproxScore(features);
        const xgbPreciseScore = (this.generateMode === 0 ? xgbPredictMode0 : xgbPredictMode1)(features);
        
        sequencesWithScore.push({ 
          sequence, 
          linearScore,
          xgbApproxScore,
          xgbPreciseScore,
          newGrid,
          features,
          allowStacking
        });
      }
      
      const linOrder = sequencesWithScore
        .map((v, i) => ({ i, s: v.linearScore }))
        .sort((a, b) => a.s - b.s)
        .map(x => x.i);
      const xgbOrder = sequencesWithScore
        .map((v, i) => ({ i, s: v.xgbPreciseScore }))
        .sort((a, b) => a.s - b.s)
        .map(x => x.i);
      const linRank = new Map(linOrder.map((idx, r) => [idx, r + 1]));
      const xgbRank = new Map(xgbOrder.map((idx, r) => [idx, r + 1]));
      sequencesWithScore.forEach((item, idx) => {
        item.score = 0.5 * (linRank.get(idx) || idx + 1) + 0.5 * (xgbRank.get(idx) || idx + 1);
      });
      sequencesWithScore.sort((a, b) => a.score - b.score);

      let pruned = false;
      let candidateList = sequencesWithScore;
      if (this.generateMode === 1 && depth > 0) {
        const total = sequencesWithScore.length;
        const bestScore = sequencesWithScore[0].score;
        const gapThresh = Math.max(1, Math.floor(total * 0.01));
        const p = total >= 80 ? 0.06 : total >= 40 ? 0.12 : 0.24;
        const kRank = Math.min(total, Math.max(12, Math.floor(total * p)));
        const topLinear = 3;
        const topXgb = 3;
        const agreeThresh = 2;

        const rankSelected = new Set(sequencesWithScore.slice(0, kRank).map((_, i) => i));
        const gapSelected = new Set();
        const linTopIdx = new Set(linOrder.slice(0, Math.min(topLinear, total)));
        const xgbTopIdx = new Set(xgbOrder.slice(0, Math.min(topXgb, total)));
        const agreeSelected = new Set();

        sequencesWithScore.forEach((it, idx) => {
          if ((it.score - bestScore) <= gapThresh) gapSelected.add(idx);
          const ar = Math.abs((linRank.get(idx) || total) - (xgbRank.get(idx) || total));
          if (ar <= agreeThresh) agreeSelected.add(idx);
        });

        const unionIdx = new Set();
        rankSelected.forEach(i => unionIdx.add(i));
        gapSelected.forEach(i => unionIdx.add(i));
        agreeSelected.forEach(i => unionIdx.add(i));
        linTopIdx.forEach(i => unionIdx.add(i));
        xgbTopIdx.forEach(i => unionIdx.add(i));

        const unionList = Array.from(unionIdx).sort((a, b) => a - b);
        const maxK = Math.min(14, Math.max(8, Math.floor(total * 0.17)));
        const finalIdx = unionList.slice(0, maxK);
        candidateList = finalIdx.map(i => sequencesWithScore[i]);
        pruned = candidateList.length < total;
      }

      for (const {sequence, newGrid} of candidateList) {
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
      
      // 记录候选序列数据（用于特征分析）
      if (this._enableFeatureCollection) {
        this.recordCandidates(depth, sequencesWithScore, bestResult.remainingCells);
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