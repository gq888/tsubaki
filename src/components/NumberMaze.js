import { shuffleCards } from "../utils/help.js";
import { GameComponentPresets } from "../utils/gameComponentFactory.js";

/**
 * NumberMaze对象定义了数字迷宫游戏的基础组件，将传递给GameComponentPresets.puzzleGame工厂函数
 * 工厂函数会为该组件添加游戏管理、按钮控制、自动操作等功能
 * 
 * 游戏规则：
 * 1. 6x6网格包含起点(0)、终点(35)和数字方块
 * 2. 数字方块可以向相邻空位移动
 * 3. 需要创建从起点到终点的路径，路径数字必须满足递增关系
 * 4. 当存在有效路径时游戏胜利
 * 5. 提供自动移动功能，智能寻找解决方案
 */

const NumberMaze = {
  name: "NumberMaze",
  data() {
    return {
      title: "Number Maze",
      grid: [], // 6x6网格，-1表示空位
      gridSize: 6,
      numbers: [], // 数字方块数组
      emptyPos: -1, // 空位位置
      targetPath: [], // 目标路径
      pathFound: false, // 是否找到有效路径
      number: 20, // 使用20个数字方块
      
      // 以下属性由工厂函数GameComponentPresets.puzzleGame添加：
      // gameManager: 游戏状态管理器实例，提供游戏状态控制和自动操作功能
      // customButtons: 自定义按钮数组，用于存储游戏控制按钮配置
      // step: 当前游戏步骤计数
      // history: 操作历史记录数组，支持撤销重做功能
    };
  },
  
  // 初始化
  methods: {
    init() {
      this.grid = Array(this.gridSize * this.gridSize).fill(-1);
      this.numbers = [];
      this.emptyPos = -1;
      this.pathFound = false;
      this.targetPath = [];
      
      // 生成数字方块（1-20）
      for (let i = 0; i < this.number; i++) {
        this.numbers.push(i + 1);
      }
      shuffleCards(this.numbers, this.number);
      
      // 随机放置数字方块到网格中（除了起点和终点）
      const availablePositions = [];
      for (let i = 0; i < this.gridSize * this.gridSize; i++) {
        if (i !== 0 && i !== this.gridSize * this.gridSize - 1) { // 0是起点，35是终点
          availablePositions.push(i);
        }
      }
      shuffleCards(availablePositions, availablePositions.length);
      
      // 放置数字方块
      for (let i = 0; i < Math.min(this.number, availablePositions.length); i++) {
        this.grid[availablePositions[i]] = this.numbers[i];
      }
      
      // 设置一个空位（用于移动）
      if (availablePositions.length > this.number) {
        this.emptyPos = availablePositions[this.number];
        this.grid[this.emptyPos] = -1;
      }
      
      // 设置起点和终点标记
      this.grid[0] = 0; // 起点
      this.grid[this.gridSize * this.gridSize - 1] = 99; // 终点
      
      this.autoCalc();
    },
    
    // 获取指定位置的相邻位置
    getNeighbors(pos) {
      const neighbors = [];
      const row = Math.floor(pos / this.gridSize);
      const col = pos % this.gridSize;
      
      // 上
      if (row > 0) neighbors.push(pos - this.gridSize);
      // 下
      if (row < this.gridSize - 1) neighbors.push(pos + this.gridSize);
      // 左
      if (col > 0) neighbors.push(pos - 1);
      // 右
      if (col < this.gridSize - 1) neighbors.push(pos + 1);
      
      return neighbors;
    },
    
    // 移动数字方块
    async moveNumber(fromPos, toPos) {
      console.log('moveNumber called with fromPos:', fromPos, 'toPos:', toPos);
      
      if (this.grid[toPos] !== -1) {
        console.log('moveNumber returning false - target not empty');
        return false; // 目标位置不是空位
      }
      
      // 检查是否相邻
      const neighbors = this.getNeighbors(fromPos);
      console.log('neighbors:', neighbors);
      console.log('toPos in neighbors:', neighbors.includes(toPos));
      
      if (!neighbors.includes(toPos)) {
        console.log('moveNumber returning false - not adjacent');
        return false; // 不相邻
      }
      
      // 获取要移动的数字值
      const numberValue = this.grid[fromPos];
      console.log('numberValue:', numberValue);
      
      // 执行移动
      this.grid[toPos] = numberValue;
      this.grid[fromPos] = -1;
      this.emptyPos = fromPos;
      
      console.log('moveNumber calling recordOperation');
      
      // 记录操作
      this.recordOperation("move", {
        from: fromPos,
        to: toPos,
        number: numberValue
      });
      
      console.log('moveNumber returning true');
      return true;
    },
    
    // 点击数字方块
    clickNumber(pos) {
      console.log('clickNumber called with pos:', pos);
      console.log('grid[pos]:', this.grid[pos]);
      
      if (this.grid[pos] <= 0 || this.grid[pos] === 99) {
        this.emptyPos = pos;
        return; // 不能移动起点、终点或空位
      }
      
      console.log('clickNumber proceeding with move');
      
      // 找到相邻的空位
      const neighbors = this.getNeighbors(pos);

      if (neighbors.find(neighbor => this.emptyPos === neighbor)) {
        // 尝试移动到相邻的空位
        if (this.moveNumber(pos, this.emptyPos)) {
          console.log('moveNumber succeeded to emptyPos:', this.emptyPos);
          return;
        }
      }
      
      for (const neighbor of neighbors) {
        if (this.grid[neighbor] === -1) {
          // 尝试移动到相邻的空位
          if (this.moveNumber(pos, neighbor)) {
            console.log('moveNumber succeeded to neighbor:', neighbor);
            break;
          }
        }
      }
    },
    
    // 查找从起点到终点的有效路径
    findValidPath() {
      const start = 0;
      const end = this.gridSize * this.gridSize - 1;
      
      // 使用BFS查找路径
      const queue = [{pos: start, path: [start], value: 0}];
      const visited = new Set([start]);
      
      while (queue.length > 0) {
        const current = queue.shift();
        
        if (current.pos === end) {
          return current.path; // 找到路径
        }
        
        const neighbors = this.getNeighbors(current.pos);
        for (const neighbor of neighbors) {
          if (visited.has(neighbor)) continue;
          
          const neighborValue = this.grid[neighbor];
          if (neighborValue === -1) continue; // 空位
          
          // 检查数字关系：必须递增
          if (neighborValue > current.value && neighborValue !== 99) {
            visited.add(neighbor);
            queue.push({
              pos: neighbor,
              path: [...current.path, neighbor],
              value: neighborValue
            });
          } else if (neighborValue === 99 && current.value > 0) {
            // 到达终点
            visited.add(neighbor);
            queue.push({
              pos: neighbor,
              path: [...current.path, neighbor],
              value: current.value
            });
          }
        }
      }
      
      return null; // 没有找到路径
    },
    
    // 自动计算游戏状态
    autoCalc() {
      const path = this.findValidPath();
      this.pathFound = path !== null;
      this.targetPath = path || [];
      
      if (this.pathFound) {
        this.gameManager.setWin();
      }
    },
    
    // 获取自动移动的下一步
    getNextAutoMove() {
      // 计算曼哈顿距离
      const getManhattanDistance = (pos1, pos2) => {
        const row1 = Math.floor(pos1 / this.gridSize);
        const col1 = pos1 % this.gridSize;
        const row2 = Math.floor(pos2 / this.gridSize);
        const col2 = pos2 % this.gridSize;
        return Math.abs(row1 - row2) + Math.abs(col1 - col2);
      };
      
      // 找到网格中指定值的数字位置
      const findNumberPosition = (value) => {
        for (let i = 0; i < this.grid.length; i++) {
          if (this.grid[i] === value) return i;
        }
        return -1;
      };
      
      // 根据深度计算数字区间（使用严格小于，避免重叠）
      const getNumberRange = (deep) => {
        const minNum = this.number / 9 * deep;
        const maxNum = this.number / 9 * (deep + 1);
        // 使用 minNum < num <= maxNum 的区间划分
        return { min: Math.floor(minNum) + 1, max: Math.floor(maxNum) };
      };
      
      // 根据数字值计算其理想的曼哈顿距离范围（应该距离起点多远）
      const getIdealDistance = (num) => {
        // 数字所属的区间深度
        const deep = Math.floor((num - 1) / (this.number / 9));
        return deep + 1; // deep=0的数字理想距离为1，deep=1的数字理想距离为2，以此类推
      };
      
      // 缓存每个数字的当前位置和理想距离偏差
      const numberDeviationCache = new Map();
      for (let num = 1; num <= this.number; num++) {
        const pos = findNumberPosition(num);
        if (pos >= 0) {
          const currentDist = getManhattanDistance(0, pos);
          const idealDist = getIdealDistance(num);
          const deviation = Math.abs(currentDist - idealDist);
          numberDeviationCache.set(num, { pos, currentDist, idealDist, deviation });
        }
      }
      
      // 计算所有数字到理想位置的总距离
      const calculateGlobalDistance = () => {
        let totalDistance = 0;
        for (const [num, data] of numberDeviationCache) {
          totalDistance += data.deviation;
        }
        return totalDistance;
      };
      
      // ========== 阶段1：全局整理阶段 ==========
      // 尝试找到能减少全局距离的移动（让所有数字更接近理想位置）
      const currentGlobalDistance = calculateGlobalDistance();
      const globalOptimizationMoves = [];
      
      for (const [num, data] of numberDeviationCache) {
        const currentPos = data.pos;
        const neighbors = this.getNeighbors(currentPos);
        const currentDeviation = data.deviation;
        const idealDist = data.idealDist;
        
        for (const neighbor of neighbors) {
          if (this.grid[neighbor] === -1) {
            const newDist = getManhattanDistance(0, neighbor);
            const newDeviation = Math.abs(newDist - idealDist);
            
            // 如果这个移动能让该数字更接近理想位置
            if (newDeviation < currentDeviation) {
              const improvement = currentDeviation - newDeviation;
              globalOptimizationMoves.push({
                from: currentPos,
                to: neighbor,
                number: num,
                improvement: improvement
              });
            }
          }
        }
      }
      
      // 如果找到能改善全局距离的移动，且还在初期阶段（前50步），优先执行全局优化
      // 50步后切换到DFS路径搜索，此时棋盘应该已经较为有序
      const currentStep = this.step || 0;
      if (globalOptimizationMoves.length > 0 && currentStep % 10 < 6) {
        // 按改善程度排序，选择改善最大的移动
        globalOptimizationMoves.sort((a, b) => b.improvement - a.improvement);
        // 从前30%中随机选择，保持多样性
        const topCount = Math.max(1, Math.ceil(globalOptimizationMoves.length * 0.3));
        const randomIndex = Math.floor(Math.random() * topCount);
        const move = globalOptimizationMoves[randomIndex];
        console.log('Global optimization move:', { 
          number: move.number, 
          from: move.from, 
          to: move.to, 
          improvement: move.improvement.toFixed(2),
          globalDist: currentGlobalDistance
        });
        return { from: move.from, to: move.to };
      }
      
      console.log('Switching to DFS path search. Global distance:', currentGlobalDistance);
      
      // ========== 阶段2：路径搜索阶段（BFS同层搜索） ==========
      
      // BFS搜索最优路径，使用同层比较进行剪枝
      let bestPath = null;
      let bestTotalDistance = Infinity;
      const maxIterations = 5000; // 限制迭代次数，防止过度计算
      
      // 队列存储搜索状态：{row, col, deep, path, selectedNumbers, totalDistance, visited}
      let queue = [{
        row: 0,
        col: 0,
        deep: 0,
        path: [],
        selectedNumbers: [],
        totalDistance: 0,
        visited: new Set(['0,0'])
      }];
      
      let iterationCount = 0;
      
      // 按深度进行BFS搜索
      while (queue.length > 0 && iterationCount < maxIterations) {
        const currentLevelSize = queue.length;
        const nextQueue = [];
        
        // 处理当前层的所有节点
        for (let i = 0; i < currentLevelSize && iterationCount < maxIterations; i++) {
          iterationCount++;
          const state = queue[i];
          const { row, col, deep, path, selectedNumbers, totalDistance, visited } = state;
          
          // 剪枝：如果当前总距离已经超过最优解，跳过此节点
          if (totalDistance >= bestTotalDistance) continue;
          
          // 计算当前路径位置
          const currentPos = row * this.gridSize + col;
          
          // 到达深度9，记录路径
          if (deep === 9) {
            if (totalDistance < bestTotalDistance) {
              bestTotalDistance = totalDistance;
              bestPath = {
                path: [...path],
                numbers: [...selectedNumbers],
                totalDistance: totalDistance
              };
            }
            continue;
          }
          
          // 获取当前深度应该选择的数字范围
          const range = getNumberRange(deep);
          
          // 利用缓存快速找出在范围内的候选数字
          const candidates = [];
          for (let num = range.min; num <= range.max && num <= this.number; num++) {
            if (!selectedNumbers.includes(num)) {
              const cachedData = numberDeviationCache.get(num);
              if (cachedData) {
                candidates.push({ value: num, pos: cachedData.pos });
              }
            }
          }
          
          // 如果范围内没有候选数字，扩大搜索范围
          if (candidates.length === 0) {
            for (const [num, data] of numberDeviationCache) {
              if (!selectedNumbers.includes(num)) {
                candidates.push({ value: num, pos: data.pos });
              }
            }
          }
          
          // 如果还是没有候选数字，跳过此节点
          if (candidates.length === 0) continue;
          
          // 为每个候选数字计算综合得分并排序
          const candidatesWithDistance = candidates.map(c => {
            const distanceToPath = getManhattanDistance(currentPos, c.pos);
            const cachedData = numberDeviationCache.get(c.value);
            const idealPenalty = cachedData ? cachedData.deviation * 0.2 : 0;
            const score = distanceToPath + idealPenalty;
            
            return {
              ...c,
              distance: distanceToPath,
              score: score
            };
          });
          candidatesWithDistance.sort((a, b) => a.score - b.score);
          
          // 选择距离最小的数字（取前3个，更聚焦最优解）
          const topCandidates = candidatesWithDistance.slice(0, Math.min(3, candidatesWithDistance.length));
          
          for (const candidate of topCandidates) {
            const newTotalDistance = totalDistance + candidate.distance;
            const newSelectedNumbers = [...selectedNumbers, candidate.value];
            
            // 尝试向右移动（如果未越界）
            if (col < this.gridSize - 1) {
              const rightKey = `${row},${col + 1}`;
              const nextPos = row * this.gridSize + (col + 1);
              if (!visited.has(rightKey)) {
                const newVisited = new Set(visited);
                newVisited.add(rightKey);
                const newPath = [...path, nextPos];
                nextQueue.push({
                  row: row,
                  col: col + 1,
                  deep: deep + 1,
                  path: newPath,
                  selectedNumbers: newSelectedNumbers,
                  totalDistance: newTotalDistance,
                  visited: newVisited
                });
              }
            }
            
            // 尝试向下移动（如果未越界）
            if (row < this.gridSize - 1) {
              const downKey = `${row + 1},${col}`;
              const nextPos = (row + 1) * this.gridSize + col;
              if (!visited.has(downKey)) {
                const newVisited = new Set(visited);
                newVisited.add(downKey);
                const newPath = [...path, nextPos];
                nextQueue.push({
                  row: row + 1,
                  col: col,
                  deep: deep + 1,
                  path: newPath,
                  selectedNumbers: newSelectedNumbers,
                  totalDistance: newTotalDistance,
                  visited: newVisited
                });
              }
            }
          }
        }
        
        // 同层剪枝：对下一层队列按totalDistance排序，只保留最优的部分
        if (nextQueue.length > 100) {
          nextQueue.sort((a, b) => a.totalDistance - b.totalDistance);
          queue = nextQueue.slice(0, 100);
        } else {
          queue = nextQueue;
        }
      }
      
      // 检查是否找到有效路径
      if (!bestPath || iterationCount >= maxIterations) {
        if (iterationCount >= maxIterations) {
          console.log('BFS exceeded max iterations:', iterationCount);
        } else {
          console.log('No valid path found in BFS');
        }
        return this.getRandomMove();
      }
      
      console.log('Best path found:', bestPath);
      console.log('Total distance:', bestPath.totalDistance);
      
      // 生成移动方案
      const targetNumbers = bestPath.numbers;
      const targetPositions = bestPath.path;
      
      // 找到所有目标数字及其相邻空位，同时考虑理想位置
      const validMoves = [];
      const numbersAtTarget = new Set(); // 记录已到达目标位置的数字
      
      // 首先，为所有数字计算移动优先级（基于理想位置）
      for (let i = 0; i < targetNumbers.length; i++) {
        const targetNum = targetNumbers[i];
        const targetPos = targetPositions[i];
        const currentPos = findNumberPosition(targetNum);
        
        if (currentPos < 0) continue;
        
        // 如果数字已经在目标位置，记录并跳过
        if (currentPos === targetPos) {
          numbersAtTarget.add(targetNum);
          continue;
        }
        
        const idealDistance = getIdealDistance(targetNum);
        const currentDistanceFromStart = getManhattanDistance(0, currentPos);
        
        // 获取数字当前位置的相邻位置
        const neighbors = this.getNeighbors(currentPos);
        
        for (const neighbor of neighbors) {
          if (this.grid[neighbor] === -1) {
            // 这是一个空位，检查移动是否能减少距离
            const currentDistance = getManhattanDistance(currentPos, targetPos);
            const newDistance = getManhattanDistance(neighbor, targetPos);
            const newDistanceFromStart = getManhattanDistance(0, neighbor);
            
            // 计算这个移动的综合价值
            const pathReduction = currentDistance - newDistance;
            // 额外奖励：如果这个移动让数字更接近其理想距离
            const idealBonus = Math.abs(currentDistanceFromStart - idealDistance) - 
                              Math.abs(newDistanceFromStart - idealDistance);
            
            // 必须减少到目标位置的距离，idealBonus只作为优先级加成
            if (pathReduction > 0) {
              validMoves.push({
                from: currentPos,
                to: neighbor,
                reduction: pathReduction,
                idealBonus: idealBonus,
                priority: pathReduction + idealBonus * 0.3 // 综合优先级
              });
            }
          }
        }
      }
      
      // 按优先级排序移动
      validMoves.sort((a, b) => b.priority - a.priority);
      
      // 如果有有效移动，优先选择优先级高的（带一定随机性）
      if (validMoves.length > 0) {
        // 从前30%的高优先级移动中随机选择，增加多样性同时保持效率
        const topCount = Math.max(1, Math.ceil(validMoves.length * 0.3));
        const randomIndex = Math.floor(Math.random() * topCount);
        const move = validMoves[randomIndex];
        console.log('Selected valid move:', { from: move.from, to: move.to, priority: move.priority.toFixed(2) });
        return { from: move.from, to: move.to };
      }
      
      // 没有有效移动，完全随机移动（排除已到达目标位置的数字）
      console.log('No valid moves, trying random move (excluding numbers at target)');
      return this.getRandomMove(numbersAtTarget);
    },
    
    // 获取随机移动
    getRandomMove(excludeNumbers = new Set()) {
      const movableNumbers = [];
      
      for (let i = 0; i < this.grid.length; i++) {
        const value = this.grid[i];
        if (value > 0 && value < 99 && !excludeNumbers.has(value)) {
          const neighbors = this.getNeighbors(i);
          const hasEmptyNeighbor = neighbors.some(n => this.grid[n] === -1);
          if (hasEmptyNeighbor) {
            movableNumbers.push(i);
          }
        }
      }
      
      if (movableNumbers.length === 0) return null;
      
      // 完全随机选择一个可移动的数字
      const randomNumIndex = Math.floor(Math.random() * movableNumbers.length);
      const fromPos = movableNumbers[randomNumIndex];
      
      // 找到该数字的空位邻居
      const neighbors = this.getNeighbors(fromPos);
      const emptyNeighbors = neighbors.filter(n => this.grid[n] === -1);
      
      if (emptyNeighbors.length === 0) return null;
      
      // 完全随机选择一个空位
      const randomEmptyIndex = Math.floor(Math.random() * emptyNeighbors.length);
      const toPos = emptyNeighbors[randomEmptyIndex];
      
      console.log('Random move:', { from: fromPos, to: toPos, value: this.grid[fromPos] });
      return { from: fromPos, to: toPos };
    },
    
    // 检查是否有潜在的路径可能
    hasPotentialPath(grid, startPos) {
      // 简单的检查：从给定位置开始，看是否能到达终点
      const visited = new Set();
      const queue = [startPos];
      const end = this.gridSize * this.gridSize - 1;
      
      while (queue.length > 0) {
        const current = queue.shift();
        if (current === end) return true;
        
        const neighbors = this.getNeighbors(current);
        for (const neighbor of neighbors) {
          if (visited.has(neighbor)) continue;
          
          const value = grid[neighbor];
          if (value === -1 || value === 99) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
      
      return false;
    },
    
    // 重写stepFn方法，实现自动移动
    async stepFn() {
      await this.gameManager.step(async () => {
        const nextMove = this.getNextAutoMove();
        if (nextMove) {
          await this.moveNumber(nextMove.from, nextMove.to);
          await this.wait();
        } else {
          // 没有有效的自动移动，停止自动模式
          this.gameManager.stopAuto();
        }
      });
    },
    
    // 记录操作
    recordOperation(type, data) {
      console.log('recordOperation called:', type, data);
      console.log('gameManager exists:', !!this.gameManager);
      console.log('gameManager.recordOperation exists:', !!this.gameManager?.recordOperation);
      
      if (this.gameManager && this.gameManager.recordOperation) {
        this.gameManager.recordOperation({
          type: type,
          ...data,
          timestamp: Date.now(),
        });
        console.log('Operation recorded successfully');
      } else {
        console.error('Cannot record operation - gameManager not available');
      }
    },
    
    // 处理撤销操作
    handleUndo(operation) {
      console.log('=== HANDLEUNDO CALLED ===');
      console.log('handleUndo called with operation:', operation);
      console.log('Before undo - grid[5]:', this.grid[5], 'grid[11]:', this.grid[11]);
      switch (operation.type) {
        case "move":
          // 撤销移动操作
          this.grid[operation.from] = operation.number;
          this.grid[operation.to] = -1;
          this.emptyPos = operation.to;
          console.log('Undo completed - moved', operation.number, 'from', operation.to, 'to', operation.from);
          console.log('this.grid after undo:', this.grid[operation.from], this.grid[operation.to]);
          break;
      }
    },
    
    /**
     * 渲染文本视图 - 显示当前游戏状态
     * 用于终端交互式游戏
     */
    renderTextView() {
      console.log('\n╔════════════════════════════════════════════════╗');
      console.log('║              数字迷宫 (Number Maze)           ║');
      console.log('╚════════════════════════════════════════════════╝');
      console.log(`\n步数: ${this.step}\n`);
      
      // 显示6x6网格
      for (let row = 0; row < this.gridSize; row++) {
        let rowStr = '  ';
        for (let col = 0; col < this.gridSize; col++) {
          const pos = row * this.gridSize + col;
          const value = this.grid[pos];
          let cellStr;
          
          if (value === 0) {
            cellStr = '[起]'; // 起点
          } else if (value === 99) {
            cellStr = '[终]'; // 终点
          } else if (value === -1) {
            cellStr = '[  ]'; // 空位
          } else {
            cellStr = `[${value.toString().padStart(2, '0')}]`;
          }
          
          // 标记路径中的位置
          if (this.targetPath.includes(pos)) {
            cellStr = cellStr.replace('[', '*[').replace(']', ']*');
          }
          
          rowStr += cellStr + ' ';
        }
        console.log(rowStr);
      }
      
      console.log(`\n空位位置: ${this.emptyPos + 1}`);
      console.log(`路径状态: ${this.pathFound ? '✓ 找到有效路径' : '✗ 未找到路径'}`);
      
      if (this.pathFound && this.targetPath.length > 0) {
        const pathValues = this.targetPath.map(pos => {
          const value = this.grid[pos];
          return value === 0 ? '起' : value === 99 ? '终' : value;
        });
        console.log(`路径: ${pathValues.join(' → ')}`);
      }
      
      return '渲染完成';
    },
  },
  
  computed: {
    // 计算当前数字数量
    currentNumberCount() {
      let count = 0;
      for (let i = 0; i < this.grid.length; i++) {
        if (this.grid[i] > 0 && this.grid[i] < 99) {
          count++;
        }
      }
      return count;
    },
    
    // 计算网格状态（用于状态检测）
    gridState() {
      return this.grid.join(',');
    }
  }
};

// 使用工厂函数创建增强的NumberMaze组件并导出
export default GameComponentPresets.puzzleGame(NumberMaze, 800);

/**
 * 工厂函数GameComponentPresets.puzzleGame为NumberMaze组件添加的功能：
 * 
 * 基础增强功能（来自createEnhancedGameComponent）：
 * - gameManager属性：提供游戏状态管理、自动模式控制和步骤执行
 * - customButtons属性：存储自定义按钮配置
 * - displayButtons计算属性：决定显示哪些游戏控制按钮
 * - gameControlsConfig计算属性：游戏控制配置
 * - wait()、pass()、goon()等方法：游戏控制方法
 * - created和beforeUnmount生命周期钩子：管理游戏状态和事件监听
 * 
 * puzzleGame特有功能：
 * - step属性：游戏步骤计数器
 * - history属性：操作历史记录数组
 * - 支持撤销重做功能
 * - 提供益智游戏相关的自动操作和状态管理
 * - 支持自动步骤延迟配置（此处设置为800ms）
 */