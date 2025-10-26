import { GameComponentPresets } from "../utils/gameComponentFactory.js";

/**
 * TowerHanoi对象定义了汉诺塔游戏的基础组件，将传递给GameComponentPresets.puzzleGame工厂函数
 * 工厂函数会为该组件添加游戏管理、按钮控制、自动操作等功能
 * 
 * 游戏规则：
 * - 有三根柱子，第一根柱子上有若干个大小不同的圆盘
 * - 目标是将所有圆盘移动到第三根柱子
 * - 每次只能移动一个圆盘
 * - 大盘不能放在小盘上面
 * - 移动次数越少越好
 */
const TowerHanoi = {
  name: "TowerHanoi",
  data() {
    return {
      title: "Tower of Hanoi",
      // 三根柱子，每根柱子是一个数组，存储圆盘（数字越大表示圆盘越大）
      towers: [[], [], []],
      // 当前选中的柱子索引（-1表示未选中）
      selectedTower: -1,
      // 圆盘总数
      diskCount: 4,
      // 移动次数
      moveCount: 0,
      // 最少需要移动的次数（理论最优解）
      minMoves: 0,
      
      // 以下属性由工厂函数GameComponentPresets.puzzleGame添加：
      // gameManager: 游戏管理器实例，提供游戏状态控制和自动操作功能
      // customButtons: 自定义按钮数组，用于存储游戏控制按钮配置
      // step: 当前游戏步骤计数
      // history: 操作历史记录数组
    };
  },
  
  // 初始化
  methods: {
    init() {
      this.resetGame();
    },
    
    /**
     * 重置游戏
     */
    resetGame() {
      this.towers = [[], [], []];
      this.selectedTower = -1;
      this.moveCount = 0;
      this.minMoves = Math.pow(2, this.diskCount) - 1;
      
      // 在第一根柱子上放置所有圆盘（从大到小）
      for (let i = this.diskCount; i >= 1; i--) {
        this.towers[0].push(i);
      }
      
      this.gameManager.recordOperation();
    },
    
    /**
     * 选择或移动圆盘
     * @param {number} towerIndex - 柱子索引（0, 1, 2）
     */
    clickTower(towerIndex) {
      // 如果当前没有选中柱子
      if (this.selectedTower === -1) {
        // 只能选中有圆盘的柱子
        if (this.towers[towerIndex].length > 0) {
          this.selectedTower = towerIndex;
          this.gameManager.recordOperation();
        }
        return;
      }
      
      // 如果点击的是同一个柱子，取消选择
      if (this.selectedTower === towerIndex) {
        this.selectedTower = -1;
        return;
      }
      
      // 尝试移动圆盘
      this.moveDisk(this.selectedTower, towerIndex);
    },
    
    /**
     * 移动圆盘
     * @param {number} fromTower - 源柱子索引
     * @param {number} toTower - 目标柱子索引
     */
    moveDisk(fromTower, toTower) {
      const fromDisks = this.towers[fromTower];
      const toDisks = this.towers[toTower];
      
      // 源柱子必须不为空
      if (fromDisks.length === 0) {
        this.selectedTower = -1;
        return;
      }
      
      const disk = fromDisks[fromDisks.length - 1];
      
      // 目标柱子必须为空，或者顶部的圆盘比要移动的圆盘大
      if (toDisks.length === 0 || toDisks[toDisks.length - 1] > disk) {
        // 执行移动
        fromDisks.pop();
        toDisks.push(disk);
        this.moveCount++;
        this.selectedTower = -1;
        
        // 记录操作
        this.gameManager.recordOperation({
          type: "move",
          from: fromTower,
          to: toTower,
          disk: disk,
          moveCount: this.moveCount
        });
        
        // 检查游戏是否完成
        this.checkGameCompletion();
      } else {
        // 移动无效，取消选择
        this.selectedTower = -1;
      }
    },
    
    /**
     * 检查游戏是否完成
     */
    checkGameCompletion() {
      // 如果所有圆盘都在第三根柱子上，游戏胜利
      if (this.towers[2].length === this.diskCount) {
        this.gameManager.setWin();
        return;
      }
      
      // 检查是否还有可能的移动
      if (!this.hasValidMoves()) {
        this.gameManager.setLose();
      }
    },
    
    /**
     * 检查是否还有有效的移动
     * @returns {boolean} 是否还有有效移动
     */
    hasValidMoves() {
      // 汉诺塔总是有解，所以这里返回true
      // 只有在极端情况下才会没有有效移动
      return true;
    },
    
    /**
     * 自动执行游戏步骤（AI模式）
     * 使用递归算法解决汉诺塔问题
     */
    async stepFn() {
      await this.gameManager.step(async () => {
        // 使用最优算法移动圆盘
        await this.solveHanoi(this.diskCount, 0, 2, 1);
      });
    },
    
    /**
     * 递归解决汉诺塔问题
     * @param {number} n - 要移动的圆盘数量
     * @param {number} from - 源柱子
     * @param {number} to - 目标柱子
     * @param {number} aux - 辅助柱子
     */
    async solveHanoi(n, from, to, aux) {
      if (n === 1) {
        // 移动一个圆盘
        this.moveDisk(from, to);
        await this.wait();
      } else {
        // 递归移动n-1个圆盘到辅助柱子
        await this.solveHanoi(n - 1, from, aux, to);
        // 移动最大的圆盘到目标柱子
        this.moveDisk(from, to);
        await this.wait();
        // 将n-1个圆盘从辅助柱子移动到目标柱子
        await this.solveHanoi(n - 1, aux, to, from);
      }
    },
    
    /**
     * 处理撤销操作
     * @param {Object} operation - 要撤销的操作
     */
    handleUndo(operation) {
      if (operation.type === "move") {
        // 撤销移动操作
        const disk = this.towers[operation.to].pop();
        this.towers[operation.from].push(disk);
        this.moveCount--;
        this.selectedTower = -1;
      }
    },
    
    /**
     * 获取塔的名称
     * @param {number} towerIndex - 塔的索引
     * @returns {string} 塔的名称
     */
    getTowerName(towerIndex) {
      const towerNames = ['A塔', 'B塔', 'C塔'];
      return towerNames[towerIndex] || '未知塔';
    },

    /**
     * 获取圆盘的CSS类名
     * @param {number} diskSize - 圆盘大小
     * @returns {string} CSS类名
     */
    getDiskClass(diskSize) {
      return `disk-size-${diskSize}`;
    },

    /**
     * 获取圆盘的样式
     * @param {number} diskSize - 圆盘大小
     * @returns {Object} 样式对象
     */
    getDiskStyle(diskSize) {
      const baseWidth = 40;
      const widthIncrement = 20;
      const width = baseWidth + (diskSize - 1) * widthIncrement;
      
      return {
        width: `${width}px`,
        backgroundColor: this.getDiskColor(diskSize)
      };
    },

    /**
     * 获取圆盘颜色
     * @param {number} diskSize - 圆盘大小
     * @returns {string} 颜色值
     */
    getDiskColor(diskSize) {
      const colors = [
        'linear-gradient(45deg, #ff6b6b, #ee5a52)', // 1
        'linear-gradient(45deg, #4ecdc4, #44a08d)', // 2
        'linear-gradient(45deg, #45b7d1, #3498db)', // 3
        'linear-gradient(45deg, #f9ca24, #f0932b)', // 4
        'linear-gradient(45deg, #6c5ce7, #5f3dc4)', // 5
        'linear-gradient(45deg, #fd79a8, #e84393)', // 6
        'linear-gradient(45deg, #00b894, #00a085)', // 7
        'linear-gradient(45deg, #a29bfe, #6c5ce7)'  // 8
      ];
      return colors[diskSize - 1] || colors[0];
    },
    
    /**
     * 渲染文本视图 - 显示当前游戏状态
     * 用于终端交互式游戏
     */
    renderTextView() {
      console.log('\n╔════════════════════════════════════════════════╗');
      console.log('║            汉诺塔 (Tower of Hanoi)             ║');
      console.log('╚════════════════════════════════════════════════╝');
      console.log(`\n步数: ${this.step} | 移动次数: ${this.moveCount} | 最优解: ${this.minMoves} 步\n`);
      
      // 显示三根柱子
      const towerNames = ['A塔', 'B塔', 'C塔'];
      const maxHeight = this.diskCount;
      
      // 从顶部到底部显示每层的圆盘
      for (let level = maxHeight - 1; level >= 0; level--) {
        let line = '';
        for (let tower = 0; tower < 3; tower++) {
          const disks = this.towers[tower];
          const diskIndex = level - (maxHeight - disks.length);
          
          if (diskIndex >= 0 && diskIndex < disks.length) {
            const diskSize = disks[diskIndex];
            const diskVisual = '█'.repeat(diskSize * 2 + 1);
            line += `  ${diskVisual.padStart(this.diskCount + 1, ' ').padEnd(this.diskCount * 2 + 1, ' ')}  `;
          } else {
            line += `  ${'|'.padStart(this.diskCount + 1, ' ').padEnd(this.diskCount * 2 + 1, ' ')}  `;
          }
        }
        console.log(line);
      }
      
      // 显示柱子底部
      console.log('  ' + '═'.repeat(this.diskCount * 2 + 1) + '  ' + '  ' + '═'.repeat(this.diskCount * 2 + 1) + '  ' + '  ' + '═'.repeat(this.diskCount * 2 + 1) + '  ');
      console.log(`  ${towerNames[0].padStart(this.diskCount + 1, ' ').padEnd(this.diskCount * 2 + 1, ' ')}  ${towerNames[1].padStart(this.diskCount + 1, ' ').padEnd(this.diskCount * 2 + 1, ' ')}  ${towerNames[2].padStart(this.diskCount + 1, ' ').padEnd(this.diskCount * 2 + 1, ' ')}  `);
      
      // 显示选中状态
      if (this.selectedTower >= 0) {
        console.log(`\n已选中: ${towerNames[this.selectedTower]}`);
      }
      
      return '渲染完成';
    },
    
    /**
     * 获取当前可用的操作列表
     * 用于终端交互式游戏
     */
    getAvailableActions() {
      const actions = [];
      const towerNames = ['A塔', 'B塔', 'C塔'];
      
      // 重新开始按钮
      actions.push({
        id: 1,
        label: '重新开始 (RESTART)',
        method: 'goon',
        args: []
      });
      
      // 柱子操作
      for (let i = 0; i < 3; i++) {
        const hasDisks = this.towers[i].length > 0;
        
        if (this.selectedTower === -1) {
          // 未选中状态，可以选择有圆盘的柱子
          if (hasDisks) {
            actions.push({
              id: actions.length + 1,
              label: `选择${towerNames[i]}`,
              method: 'clickTower',
              args: [i]
            });
          }
        } else {
          // 已选中状态，可以移动到目标柱子
          if (i !== this.selectedTower) {
            const canMove = this.towers[i].length === 0 || 
                           this.towers[this.selectedTower][this.towers[this.selectedTower].length - 1] < this.towers[i][this.towers[i].length - 1];
            
            if (canMove) {
              actions.push({
                id: actions.length + 1,
                label: `移动到${towerNames[i]}`,
                method: 'clickTower',
                args: [i]
              });
            }
          }
          
          // 取消选择
          actions.push({
            id: actions.length + 1,
            label: '取消选择',
            method: 'clickTower',
            args: [this.selectedTower]
          });
        }
      }
      
      return actions;
    }
  },
  
  computed: {
    /**
     * 计算游戏完成度百分比
     */
    completionPercentage() {
      const completedDisks = this.towers[2].length;
      return Math.round((completedDisks / this.diskCount) * 100);
    },
    
    /**
     * 计算效率评分（移动次数与最优解的比值）
     */
    efficiencyScore() {
      if (this.moveCount === 0) return 100;
      const optimalMoves = this.minMoves;
      const actualMoves = this.moveCount;
      return Math.round((optimalMoves / actualMoves) * 100);
    }
  },
  
  watch: {
    /**
     * 监听移动次数变化
     */
    moveCount(newVal, oldVal) {
      if (newVal > oldVal) {
        console.log(`移动次数: ${newVal}`);
      }
    }
  }
};

// 使用工厂函数创建增强的TowerHanoi组件并导出
export default GameComponentPresets.puzzleGame(TowerHanoi, 800);

/**
 * 工厂函数GameComponentPresets.puzzleGame为TowerHanoi组件添加的功能：
 * 
 * 基础增强功能（来自createEnhancedGameComponent）：
 * - gameManager属性：提供游戏状态管理、自动模式控制和步骤执行
 * - customButtons属性：存储自定义按钮配置
 * - displayButtons计算属性：决定显示哪些游戏控制按钮
 * - gameControlsConfig计算属性：游戏控制配置
 * - wait()、undo()、pass()、goon()等方法：游戏控制方法
 * - created和beforeUnmount生命周期钩子：管理游戏状态和事件监听
 * 
 * puzzleGame特有功能：
 * - 提供益智游戏相关的自动操作和状态管理
 * - 支持撤销操作（通过handleUndo方法）
 * - 支持自动步骤延迟配置（此处设置为800ms）
 * - 提供提示功能（自动计算最优解）
 */