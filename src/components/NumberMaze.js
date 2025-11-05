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
      number: 30
      
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
      
      // 清除强制移动任务和震荡检测状态
      this._forcedMoveTask = null;
      this._severeOscillationCount = 0;
      this._globalDistHistory = [];
      
      // 生成数字方块
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

    setDifficuty(difficulty) {
      this.number = difficulty;
      this.init();
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
      
      if (this.grid[pos] == 0 || this.grid[pos] === 99) {
        return; // 不能移动起点、终点
      }
      
      if (this.grid[pos] < 0) {
        this.emptyPos = pos;
        return;
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
      
      // 根据深度计算数字区间（使用优化后的分配规则）
      const getNumberRange = (deep) => {
        return this.numberRanges[deep];
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
        for (const cache of numberDeviationCache) {
          totalDistance += cache[1].deviation;
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
                improvement: improvement,
              });
            }
          }
        }
      }

      const round = this.number * 0.5;
      
      // 震荡检测：记录最近的全局距离
      if (!this._globalDistHistory) {
        this._globalDistHistory = [];
      }
      this._globalDistHistory.push(currentGlobalDistance);
      if (this._globalDistHistory.length > round) {
        this._globalDistHistory.shift();
      }
      
      // 检测是否在震荡：计算方差
      let isOscillating = false;
      if (this._globalDistHistory.length === round) {
        const avg = this._globalDistHistory.reduce((a, b) => a + b) / round;
        const variance = this._globalDistHistory.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / round;
        // 震荡检测：方差小说明在小范围徘徊，无论距离高低都应识别
        // 1. 低距离震荡（接近目标）：variance < 3 且 avg < number*2
        // 2. 高距离震荡（困在高位）：variance < 8 且 avg >= number*2
        const isLowDistanceOscillation = variance < 3 && avg < this.number * 2;
        const isHighDistanceOscillation = variance < 6 && avg >= this.number * 2;
        
        if (isLowDistanceOscillation || isHighDistanceOscillation) {
          isOscillating = true;
          console.log('Oscillation detected! Type:', isLowDistanceOscillation ? 'Low' : 'High', 
                      'Variance:', variance.toFixed(2), 'Avg:', avg.toFixed(2));
          
          // 如果方差极小且距离很近目标，说明陷入严重死锁
          if (variance < 1 && avg < this.number * 1.5) {
            // 完全清空历史，强制突破
            this._globalDistHistory = [];
            // 记录严重震荡次数
            if (!this._severeOscillationCount) this._severeOscillationCount = 0;
            this._severeOscillationCount++;
          } else {
            // 普通震荡，删除部分历史
            this._globalDistHistory.splice(0, Math.floor(round * 0.3));
          }
        }
      }
      
      // 动态调整两阶段切换策略：根据全局距离和步数调整
      const currentStep = this.step || 0;
      
      let globalOptRatio = 0.1;
      
      // 步数调整：初期更多全局优化
      if (currentStep > this.number * 10) {
        globalOptRatio += 0;
      } else if (currentStep > this.number * 6) {
        globalOptRatio += 0.1;
      } else if (currentStep > this.number * 2) {
        globalOptRatio += 0.2;
      }
      
      // 全局距离调整：距离越大越需要全局优化
      if (currentGlobalDistance > this.number * 2) {
        globalOptRatio += 0.5;
      } else if (currentGlobalDistance > this.number * 1.5) {
        globalOptRatio += 0.4;
      } else if (currentGlobalDistance > this.number) {
        globalOptRatio += 0.3;
      } else if (currentGlobalDistance > this.number * 0.5) {
        globalOptRatio += 0.2;
      } else {
        globalOptRatio += 0.1;
      }
      
      const shouldDoGlobalOpt = (currentStep % round) < (globalOptRatio * round);
      
      // ========== 严重震荡强制突破机制 ==========
      // 检查是否有正在进行的强制移动任务
      if (this._forcedMoveTask) {
        const task = this._forcedMoveTask;
        const currentPos = findNumberPosition(task.number);
        const currentDistFromStart = getManhattanDistance(0, currentPos);
        
        // 检查是否已到达理想距离
        if (Math.abs(currentDistFromStart - task.idealDist) <= 0.5) {
          console.log('Forced move task completed:', {
            number: task.number,
            currentDist: currentDistFromStart,
            idealDist: task.idealDist
          });
          this._forcedMoveTask = null;
          this._severeOscillationCount = 0;
        } else {
          // 继续执行强制移动
          const move = this.calculateForcedMove(currentPos, task.idealDist, this._forcedMoveTask.number);
          if (move) {
            console.log('Continuing forced move:', {
              number: task.number,
              from: move.from,
              to: move.to,
              currentDist: currentDistFromStart,
              targetDist: task.idealDist
            });
            return move;
          } else {
            // 无法继续移动，取消任务
            console.log('Cannot continue forced move, canceling task');
            this._forcedMoveTask = null;
            this._severeOscillationCount = 0;
          }
        }
      }
      
      // 检查是否需要启动新的强制移动任务
      const shouldForceBreakthrough = this._severeOscillationCount > 0;
      
      if (shouldForceBreakthrough && !this._forcedMoveTask) {
        console.log('Severe oscillation detected! Count:', this._severeOscillationCount);
        
        // 找到距离理想位置最远的数字
        let maxDeviation = -1;
        let worstNumber = null;
        let worstNumberPos = null;
        let worstNumberIdealDist = null;
        
        for (const [num, data] of numberDeviationCache) {
          if (data.deviation > maxDeviation) {
            maxDeviation = data.deviation;
            worstNumber = num;
            worstNumberPos = data.pos;
            worstNumberIdealDist = data.idealDist;
          }
        }
        
        if (worstNumber && worstNumberPos !== null && worstNumberIdealDist !== null) {
          // 启动强制移动任务
          this._forcedMoveTask = {
            number: worstNumber,
            idealDist: worstNumberIdealDist
          };
          
          const currentDistFromStart = getManhattanDistance(0, worstNumberPos);
          
          console.log('Starting forced move task:', {
            number: worstNumber,
            currentPos: worstNumberPos,
            currentDist: currentDistFromStart,
            idealDist: worstNumberIdealDist,
            deviation: maxDeviation
          });
          
          // 计算第一步移动
          const move = this.calculateForcedMove(worstNumberPos, worstNumberIdealDist, this._forcedMoveTask.number);
          if (move) {
            return move;
          } else {
            // 无法移动，取消任务
            this._forcedMoveTask = null;
            this._severeOscillationCount = 0;
          }
        }
      }
      
      // 如果检测到震荡，强制切换到BFS
      if (globalOptimizationMoves.length > 0 && shouldDoGlobalOpt && !isOscillating) {
        const randomIndex = Math.floor(Math.random() * globalOptimizationMoves.length);
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
      // 根据number规模动态调整迭代次数，增加搜索深度
      const maxIterations = this.number >= 28 ? 20000 : (this.number >= 25 ? 16000 : 12000);
      
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
          
          // 动态调整候选数量：深度越大，候选越多，增加搜索空间
          // 提高上限到10，给困难布局更多选择
          const candidateCount = Math.min(3 + Math.floor(deep / 3), 10, candidatesWithDistance.length);
          const topCandidates = candidatesWithDistance.slice(0, candidateCount);
          
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
        // 根据number规模动态调整队列容量，扩大搜索空间
        const queueCapacity = this.number >= 28 ? 300 : (this.number >= 25 ? 250 : 150);
        if (nextQueue.length > queueCapacity) {
          nextQueue.sort((a, b) => a.totalDistance - b.totalDistance);
          queue = nextQueue.slice(0, queueCapacity);
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
      
      // ========== 阶段3：选择最优移动 ==========
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
    
    /**
     * 计算强制移动的下一步
     * @param {number} currentPos - 当前位置
     * @param {number} currentDist - 当前距离起点的曼哈顿距离
     * @param {number} idealDist - 理想距离
     * @returns {Object|null} 返回移动{from, to}或null
     */
    calculateForcedMove(currentPos, idealDist, targetNumber) {
      const getManhattanDistance = (pos1, pos2) => {
        const row1 = Math.floor(pos1 / this.gridSize);
        const col1 = pos1 % this.gridSize;
        const row2 = Math.floor(pos2 / this.gridSize);
        const col2 = pos2 % this.gridSize;
        return Math.abs(row1 - row2) + Math.abs(col1 - col2);
      };
      
      // 获取当前位置的所有邻居
      const neighbors = this.getNeighborPositions(currentPos);
      
      if (neighbors.length === 0) {
        return null;
      }
      
      // 计算每个空位邻居移动后的距离偏差
      const moves = neighbors.map(neighborPos => {
        const newDist = getManhattanDistance(0, neighborPos);
        const deviation = Math.abs(newDist - idealDist);
        return {
          to: neighborPos,
          newDist: newDist,
          deviation: deviation
        };
      });
      
      // 选择能让距离最接近idealDist的移动
      moves.sort((a, b) => a.deviation - b.deviation);

      // 计算空位需要移动到的位置（数字路径的下一步）
      const requiredEmptyPos = moves[0].to;
      
      for (let i = 0; i < this.grid.length; i++) {
        if (this.grid[i] === -1) {
          let emptyPos = i;

          // 如果空位已经在所需位置，直接移动数字
          if (emptyPos === requiredEmptyPos) {
            return { from: currentPos, to: requiredEmptyPos };
          }

          // 计算空位到所需位置的路径，避开目标数字
          const emptyPath = this.findShortestPathForNumber(emptyPos, requiredEmptyPos, targetNumber);
          if (!emptyPath || emptyPath.length === 0) continue;

          // 返回空位移动的下一步
          return { to: emptyPos, from: emptyPath[0] };
        }
      }
      return null;
    },
    
    /**
     * 使用BFS算法找到数字从当前位置到目标位置的最短移动路径
     * @param {number} fromPos - 起始位置（一维索引）
     * @param {number} toPos - 目标位置（一维索引）
     * @returns {Array} 返回移动路径（位置数组），不包含起始位置
     */
    findShortestPathForNumber(fromPos, toPos, excludeNumber = -1) {
      if (fromPos === toPos) {
        return [];
      }
      
      // BFS队列：存储{pos, path}
      const queue = [{ pos: fromPos, path: [] }];
      const visited = new Set([fromPos]);
      
      while (queue.length > 0) {
        const { pos, path } = queue.shift();
        
        // 获取当前位置的四个方向邻居
        const neighbors = this.getNeighborPositions(pos);
        
        for (const neighborPos of neighbors) {
          if (visited.has(neighborPos)) continue;
          
          const neighborValue = this.grid[neighborPos];

          // 检查是否是需要避开的数字（起点、终点、空位、目标数字），防止无效移动
          if ([0, -1, 99, excludeNumber].includes(neighborValue)) {
            continue;
          }
          
          const newPath = [...path, neighborPos];
          
          // 检查是否到达目标位置
          if (neighborPos === toPos) {
            return newPath;
          }
          
          visited.add(neighborPos);
          queue.push({ pos: neighborPos, path: newPath });
        }
      }
      
      return null; // 如果没有找到路径
    },
    
    /**
     * 获取指定位置的所有有效邻居位置
     */
    getNeighborPositions(pos) {
      const row = Math.floor(pos / this.gridSize);
      const col = pos % this.gridSize;
      const neighbors = [];
      
      // 上
      if (row > 0) {
        neighbors.push((row - 1) * this.gridSize + col);
      }
      // 下
      if (row < this.gridSize - 1) {
        neighbors.push((row + 1) * this.gridSize + col);
      }
      // 左
      if (col > 0) {
        neighbors.push(row * this.gridSize + (col - 1));
      }
      // 右
      if (col < this.gridSize - 1) {
        neighbors.push(row * this.gridSize + (col + 1));
      }
      
      return neighbors;
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
    },

    // 根据深度计算数字区间（优化分配规则）
    numberRanges() {
      // 固定分配规则：0层和8层各2个，1层和7层各3个，2层和6层各4个
      const fixedAllocation = {
        0: 2,  // 第0层：2个数字
        1: 3,  // 第1层：3个数字
        2: 4,  // 第2层：4个数字
        6: 4,  // 第6层：4个数字
        7: 3,  // 第7层：3个数字
        8: 2   // 第8层：2个数字
      };
      
      // 计算固定分配的总数量
      const fixedTotal = Object.values(fixedAllocation).reduce((sum, count) => sum + count, 0);
      
      // 剩余的数字数量分配给中间3层（3,4,5层）
      const remainingNumbers = this.number - fixedTotal;
      const middleLayersCount = 3; // 3,4,5层
      const middleLayerAverage = Math.max(1, Math.floor(remainingNumbers / middleLayersCount));
      
      // 构建完整的分配映射
      const allocationMap = {
        0: fixedAllocation[0],
        1: fixedAllocation[1],
        2: fixedAllocation[2],
        3: middleLayerAverage,
        4: middleLayerAverage,
        5: middleLayerAverage,
        6: fixedAllocation[6],
        7: fixedAllocation[7],
        8: fixedAllocation[8]
      };
      
      // 处理剩余数字的分配（如果有余数）
      let remaining = remainingNumbers - (middleLayerAverage * middleLayersCount);
      if (remaining > 0) {
        // 从中间层开始，依次每层多分配1个，直到分配完
        for (let layer = 3; layer <= 5 && remaining > 0; layer++) {
          allocationMap[layer]++;
          remaining--;
        }
      }
      
      // 计算累积分配，确定每层的起始和结束数字
      let cumulativeStart = 1;
      const ranges = {};
      
      for (let layer = 0; layer < 9; layer++) {
        const count = allocationMap[layer];
        ranges[layer] = {
          min: cumulativeStart,
          max: cumulativeStart + count - 1
        };
        cumulativeStart += count;
      }
      
      return ranges;
    },
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