import { shuffleCards, checkDeadForeach } from "../utils/help.js";
import { GameComponentPresets } from "../utils/gameComponentFactory.js";
import { createCandidate, isBetterCandidate, gameEvaluationMethods } from "./candidateUtils.js";
import { getCardPlaceholderText } from "../utils/cardUtils.js";

/**
 * Sort对象定义了排序游戏的基础组件，将传递给GameComponentPresets.puzzleGame工厂函数
 * 工厂函数会为该组件添加游戏管理、按钮控制、自动操作等功能
 */
const Sort = {
  name: "Sort",
  data() {
    return {
      title: "Sort",
      cards1: [],
      number: 4,
      n: 0,
      sign_index: -1,
      matchMode: 1,  // 1=简单(数值), 2=中等(颜色), 4=困难(花色)
      candidateIntervals: {}, // 存储每个空位的候选卡牌循环定时器
      currentCandidates: {}, // 存储每个空位当前显示的候选卡牌索引
      
      // 以下属性由工厂函数GameComponentPresets.puzzleGame添加：
      // gameManager: 游戏管理器实例，提供游戏状态控制和自动操作功能
      // customButtons: 自定义按钮数组，用于存储游戏控制按钮配置
    };
  },
  methods: {
    init() {
      this.sign_index = -1;
      this.cards1.splice(0);
      let cards = this.cards1;
      for (let i = 0; i < this.number * 4; i++) {
        cards.push(i);
      }
      shuffleCards(cards, this.number * 4);
      for (let i = 0; i < 4; i++) {
        cards.splice(cards.indexOf(this.number * 4 - 1 - i), 1, -1 - i);
      }
      for (let i = 0; i < 4; i++) {
        cards.splice(i * (this.number + 1), 0, this.number * 4 - 4 + i);
      }
      this.autoCalc();
      
      // 初始化候选卡牌循环
      this.$nextTick(() => {
        this.updateAllCandidateCycling();
      });
    },

    // 组件销毁时清理定时器
    beforeDestroy() {
      Object.keys(this.candidateIntervals).forEach(slotIndex => {
        this.stopCandidateCycling(parseInt(slotIndex));
      });
    },

    // 更新所有空位的候选卡牌循环
    updateAllCandidateCycling() {
      // 停止所有现有的循环
      Object.keys(this.candidateIntervals).forEach(slotIndex => {
        this.stopCandidateCycling(parseInt(slotIndex));
      });
      
      // 为所有有空位的位置启动新的循环
      for (let i = 0; i < this.cards1.length; i++) {
        if (this.cards1[i] < 0 && i > 0 && this.cards1[i - 1] >= 4) {
          this.startCandidateCycling(i);
        }
      }
    },

    // 获取指定空位的候选卡牌数组
    getCandidateCardsForSlot(slotIndex) {
      const prevCard = this.cards1[slotIndex - 1];
      if (prevCard < 4) return []; // 如果前一个卡片不是有效卡片，返回空数组
      
      const candidates = this.findAllCardsByRankOffset(prevCard, -1);
      return candidates.map(c => c.card);
    },

    // 开始候选卡牌循环显示
    startCandidateCycling(slotIndex) {
      this.stopCandidateCycling(slotIndex); // 先停止现有的循环
      
      const candidates = this.getCandidateCardsForSlot(slotIndex);
      if (candidates.length === 0) return;
      
      this.currentCandidates[slotIndex] = 0; // 从第一个候选开始
      
      // 设置定时器循环显示候选卡牌
      this.candidateIntervals[slotIndex] = setInterval(() => {
        if (candidates.length > 0) {
          this.currentCandidates[slotIndex] = (this.currentCandidates[slotIndex] + 1) % candidates.length;
        }
      }, this.gameManager.autoStepDelay);
    },

    // 停止候选卡牌循环显示
    stopCandidateCycling(slotIndex) {
      if (this.candidateIntervals[slotIndex]) {
        clearInterval(this.candidateIntervals[slotIndex]);
        delete this.candidateIntervals[slotIndex];
        delete this.currentCandidates[slotIndex];
      }
    },

    // 获取当前显示的候选卡牌
    getCurrentCandidateCard(slotIndex) {
      const candidates = this.getCandidateCardsForSlot(slotIndex);
      if (candidates.length === 0) return '';
      
      const currentIndex = this.currentCandidates[slotIndex] || 0;
      return this.getCardPlaceholderText(candidates[currentIndex]);
    },
    
    // 计算 cards1 的哈希值
    calculateStateHash() {
      return this.cards1.join(',');
    },
    
    // 检查当前状态哈希是否已存在
    isStateHashRepeated(hash) {
      return this.gameManager.history.find((record) => record.stateHash == hash);
    },
    // 记录移动操作
    recordMove(from, to, card, sign) {
      // 计算并记录当前状态的哈希
      const stateHash = this.calculateStateHash();
      
      this.gameManager.recordOperation({
        type: "move",
        from: from,
        to: to,
        card: card,
        sign: sign,
        timestamp: Date.now(),
        stateHash: stateHash,
      });
    },

    // 处理撤销操作
    handleUndo(operation) {
      // 根据操作类型执行相应的撤销逻辑
      switch (operation.type) {
        case "move":
          // 撤销移动操作
          this.cards1.splice(operation.to, 1, operation.sign);
          this.cards1.splice(operation.from, 1, operation.card);
          break;
      }
    },

    // 提取的移动执行函数（供 clickCard 和 stepFn 复用）
    executeMove(cardToMove, targetEmptyIndex) {
      const cardToMoveIndex = this.cards1.indexOf(cardToMove);
      const emptySlot = this.cards1[targetEmptyIndex];
      
      if (this.findNextCard(cardToMove, (idx) => idx == targetEmptyIndex - 1) < 0) {
        return console.warn("❌ 无效的移动");
      }

      this.cards1.splice(cardToMoveIndex, 1, emptySlot);
      this.cards1.splice(targetEmptyIndex, 1, cardToMove);
      this.recordMove(cardToMoveIndex, targetEmptyIndex, cardToMove, emptySlot);
      
      // autoCalc 已经在工厂函数里监听 historyUpdate 事件自动执行，无需手动调用
    },
    
    // 重写clickCard方法，使用GameStateManager记录操作
    clickCard(card) {
      // 查找同颜色的下一张牌，要求其后必须有空位
      let index = this.findNextCard(card, (idx) => this.sign_index >= 0 ? idx == this.sign_index - 1 : this.cards1[idx + 1] < 0);
      
      if (index >= 0) {
        let targetEmptyIndex = index + 1;
        this.executeMove(card, targetEmptyIndex);
      } else {
        console.error(`❌ clickCard: 移动失败 card=${card}, 找不到有效目标位置。Seed:${this.seed}`);
      }
      this.sign_index = -1;
    },

    updateN() {
      this.n = 0;
      for (let i = 0; i < this.number * 4 + 4; i++) {
        if (
          this.cards1[i] >> 2 ==
          this.number - 1 - (i % (this.number + 1))
        ) {
          this.n++;
        }
      }
    },

    // 重写stepFn方法，使用clickSign/clickCard保持行为一致
    async stepFn() {
      // 验证 this.next 是否有效
      if (!this.next || this.next[0] < 0) {
        console.error('❌ stepFn: this.next 无效', this.next);
        
        // 保存故障状态
        const errorState = {
          cards1: [...this.cards1],
          next: this.next,
          sign_index: this.sign_index,
          n: this.n,
        };
        console.error('💾 故障状态已保存:', JSON.stringify(errorState));
        
        // 检查游戏状态：计算已完成的牌数
        this.updateN();
        
        // 如果所有牌都已完成，标记为胜利；否则标记为失败
        if (this.n >= (this.number + 1) * 4) {
          this.gameManager.setWin();
        }
        
        this.gameManager.stopAuto();
        return;
      }
      
      // 根据用户建议：直接使用 this.executeMove(this.next[0], this.next[1])
      // this.next[0] = 要移动的卡片
      // this.next[1] = 目标空位位置
      
      await this.gameManager.step(async () => {
        this.clickSign(this.next[1])
        await this.wait();
        this.executeMove(this.next[0], this.next[1]);
      });
    },
    clickSign(i) {
      let card = this.cards1[i - 1];
      if (card < 4) {
        return;
      }
      // 查找同颜色的前一张牌
      let index = this.findPrevCard(card);
      
      // 滚动到目标卡片位置
      if (index >= 0 && typeof window !== 'undefined' && window.document) {
        const scrollTop = (index % (this.number + 1)) * 150;
        
        // 优先滚动 GameLayout 的 wrapper
        const wrapper = document.querySelector('.game-content-wrapper');
        if (wrapper) {
          wrapper.scrollTop = scrollTop;
        } else {
          // 降级到传统的 document 滚动
          document.documentElement.scrollTop = scrollTop;
          document.body.scrollTop = scrollTop;
        }
      }
      this.sign_index = i;;
    },
    
    // 评估候选牌的优先级得分
    evaluateCandidateScore(candidate) {
      if (!candidate || candidate.idx < 0) return -999999;
      
      let score = 0;
      let idx = candidate.idx;
      
      // 因素1: 后面是否有空位（决定性因素）
      if (this.cards1[idx + 1] < 0) {
        score += 100000;
      }
      
      // 因素2: 位置靠前（列顶）的优先级更高
      let row = idx % (this.number + 1);
      score += (this.number - row) * 10;
      
      // 因素3: 更倾向于选择花色值小的（保持稳定性）
      let suit = candidate.card % 4;
      score += (4 - suit);
      
      return score;
    },
    // 从多个候选中选择最优的
    selectBestCandidate(candidates) {
      if (!candidates || candidates.length === 0) return -1;
      if (candidates.length === 1) return candidates[0].idx;
      
      let bestScore = -999999;
      let bestIdx = -1;
      
      for (let candidate of candidates) {
        let score = this.evaluateCandidateScore(candidate);
        
        if (score > bestScore) {
          bestScore = score;
          bestIdx = candidate.idx;
        }
      }
      
      return bestIdx;
    },
    // 基础辅助函数：查找同颜色的相邻牌的索引
    // offset: +1查找下一张，-1查找前一张
    // condition: 可选的额外条件检查函数
    // returnAll: 返回所有候选（用于多路径搜索）
    findCardByRankOffset(card, offset, condition = null, returnAll = false) {
      let target_rank = (card >> 2) + offset;
      let card_group = card % this.matchMode;  // 按 matchMode 分组
      let candidates = [];
      
      // 收集所有同组的候选牌
      for (let suit = card_group; suit < 4; suit += this.matchMode) {
        let target_card = target_rank * 4 + suit;
        let idx = this.cards1.indexOf(target_card);
        if (idx >= 0) {
          // 如果提供了条件检查函数，必须满足条件
          if (!condition || condition(idx)) {
            candidates.push({ idx, card: target_card });
          }
        }
      }
      
      if (returnAll) return candidates;
      if (candidates.length === 0) return -1;
      if (candidates.length === 1) return candidates[0].idx;
      
      // 有多个候选时，使用评分系统选择最优的
      return this.selectBestCandidate(candidates);
    },
    // 获取所有同颜色的候选牌（用于多路径分析）
    findAllCardsByRankOffset(card, offset, condition = null) {
      return this.findCardByRankOffset(card, offset, condition, true);
    },
    // 便捷方法：查找同颜色的下一张牌（支持条件检查）
    findNextCard(card, condition = null) {
      return this.findCardByRankOffset(card, 1, condition);
    },
    // 便捷方法：查找同颜色的前一张牌
    findPrevCard(card) {
      return this.findCardByRankOffset(card, -1);
    },
    // 判断卡牌是否可移动（用于 shanshuo 闪烁提示）
    canMoveCard(card) {
      if (card < 0) return false;
      // 查找同颜色的下一张牌，检查其后是否有空位
      let nextIdx = this.findNextCard(card, (idx) => this.cards1[idx + 1] < 0);
      return nextIdx >= 0;
    },
    
    ...gameEvaluationMethods,
    autoCalc() {
      let over = true,
        temp = {},
        prior = [],
        slotsToResetPriority = [];  // 记录需要清空 priority 的空位
      for (let id = -4; id < 0; id++) {
        let index = this.cards1.indexOf(id);
        let card = this.cards1[index - 1];
        
        temp[id] = {
          index,
          card: card,
          priority: 0,
          _in: 0,
          able: true,
          bestCard: null,  // 记录深度搜索找到的最优候选牌
        };
      }
      for (let id = -4; id < 0; id++) {
        let index = temp[id].index;
        let card = temp[id].card;
        let dead = [];
        let candidatePriorities = new Map();  // 存储候选牌与优先级的映射
        let candidates = this.findAllCardsByRankOffset(card, -1);
        for (let candidate of candidates) {
          candidatePriorities.set(candidate.card, 0);
        }
        let prevFn = (prev_c, deep, accumulatedPriority = 0) => {
          if (prev_c < 0) {
            // 到达空位，累加 priority
            prior.push([id, prev_c, deep]);
            temp[prev_c].priority = Math.max(temp[prev_c].priority, ++accumulatedPriority);
            temp[prev_c]._in++;
            return accumulatedPriority;
          } else {
            if (prev_c >= 48) {
              return 0;
            }
            if (!checkDeadForeach(dead, [prev_c, 0])) return 0;
            dead.unshift([prev_c, 0]);
            
            // 获取所有同颜色的候选
            let candidates = this.findAllCardsByRankOffset(prev_c, 1);
            
            if (candidates.length === 0) {
              return 0;
            }
            
            // 多候选深度优先搜索：递归评估每个候选的 priority
            let maxPriority = 0;
            
            for (let candidate of candidates) {
              let next_idx = candidate.idx;
              let signCard = this.cards1[next_idx + 1];
              
              let subPriority = prevFn(signCard, deep, accumulatedPriority);
              maxPriority = Math.max(maxPriority, subPriority);
              
              candidatePriorities.has(candidate.card) && candidatePriorities.set(candidate.card, Math.max(candidatePriorities.get(candidate.card), subPriority));
            }
            
            return maxPriority;
          }
        };
        let nextFn = (next_i, next_c, deep, accumulatedPriority = 0) => {
          if (!checkDeadForeach(dead, [next_c, 1])) return 0;
          dead.unshift([next_c, 1]);
          if (deep > 0 && next_c >= 8) {
            let prev_c = this.cards1[next_i + 1];
            prevFn(prev_c, deep, accumulatedPriority);
          }
          next_c = this.cards1[next_i - 1];
          if (next_c < 4) {
            let n = next_i - 2;
            let num = 1;
            while (next_c < 0) {
              next_c = this.cards1[n];
              n--;
              num++;
            }
            if (next_c >= num * 4) {
              prior.push([id, this.cards1[next_i - 1], deep]);
              let emptySlotId = this.cards1[next_i - 1];
              temp[emptySlotId].priority = Math.max(temp[emptySlotId].priority, ++accumulatedPriority);
              temp[emptySlotId]._in++;
              
              return accumulatedPriority;
            }
            next_c += 4;
            // 检查是否形成同颜色递增序列
            while (n % (this.number + 1) > 0) {
              let card_at_n = this.cards1[n];
              if (card_at_n >= 0 && 
                  (card_at_n >> 2) == (next_c >> 2) && 
                  (card_at_n % this.matchMode) == (next_c % this.matchMode)) {
                n--;
                next_c += 4;
                deep++;
              } else {
                break;
              }
            }
            if (n % (this.number + 1) == 0) {
              return 0;
            }
            let prev_c = this.cards1[this.cards1.indexOf(next_c) + 1];
            let priority = prevFn(prev_c, deep, accumulatedPriority);
            
            // 同步候选卡片的优先级
            if (candidatePriorities.has(next_c)) {
              candidatePriorities.set(next_c, Math.max(candidatePriorities.get(next_c), priority));
            }
            
            return priority;
          }
          let prevCandidates = this.findAllCardsByRankOffset(next_c, -1);
          let maxPriority = 0;
          for (let prevCandidate of prevCandidates) {
            let priority = nextFn(prevCandidate.idx, next_c, deep, accumulatedPriority);
            maxPriority = Math.max(maxPriority, priority);
            
            // 同步候选卡片的优先级
            if (candidatePriorities.has(prevCandidate.card)) {
              candidatePriorities.set(prevCandidate.card, Math.max(candidatePriorities.get(prevCandidate.card), priority));
            }
          }
          return maxPriority;
        };
        if (card >= 4) {
          over = false;
        }
        nextFn(index, id, 0);
        
        // 深度搜索完成后，查找比 card 小一号的牌（规则：小的放到大的后面）
        if (card >= 4) {
          let candidates = this.findAllCardsByRankOffset(card, -1);
          if (candidates.length > 0) {
            // 存储所有候选及其优先级
            let candidatesWithPriority = [];
            
            for (let candidate of candidates) {
              // 模拟移动并检查哈希重复
              let cardIdx = this.cards1.indexOf(card);
              if (cardIdx < 0) continue;

              // 创建临时状态来计算哈希
              let tempCards = [...this.cards1];
              tempCards[candidate.idx] = id;
              tempCards[index] = candidate.card;
              
              let simulatedHash = tempCards.join(',');
              
              // 从深度搜索中获取该候选的优先级
              let candidatePriority = candidatePriorities.get(candidate.card) || 0;
              
              // 计算基于新规则的优先级评分
              const ruleBasedScore = this.calculateRuleBasedPriority(
                this,
                id,
                { index: index, card: card },
                candidate.card,
                candidate.idx
              );
              
              candidatesWithPriority.push({
                card: candidate.card,
                idx: candidate.idx,
                priority: candidatePriority,
                ruleBasedScore: ruleBasedScore,  // 新增：基于规则的评分
                stateHash: simulatedHash  // 保存状态哈希用于后续过滤
              });
            }
            
            // 保存所有候选，留到最后统一比较
            if (candidatesWithPriority.length > 0) {
              temp[id].allCandidates = candidatesWithPriority;
            } else if (candidates.length > 0) {
              // 如果所有候选都被哈希过滤，记录这个空位以便后续清空 priority
              slotsToResetPriority.push(id);
            }
          }
        }
      }
      
      // 四次深度搜索结束后，统一清空被哈希过滤的空位的 priority
      for (let slotId of slotsToResetPriority) {
        if (temp[slotId]) {
          temp[slotId].priority = 0;
        }
      }
      
      if (over) {
        this.updateN();
        if (this.n >= (this.number + 1) * 4) {
          this.gameManager.setWin();
        } else {
          this.gameManager.setLose();
        }
        return;
      }
      let signs = [-1, -2, -3, -4];
      while (signs.length > 0) {
        let ind;
        for (ind = 0; ind < signs.length; ind++) {
          if (temp[signs[ind]]._in <= 0) {
            break;
          }
        }
        if (ind < signs.length) {
          let s = signs.splice(ind, 1)[0];
          let j = 0;
          while (j < prior.length) {
            if (prior[j][0] == s) {
              temp[prior[j][1]]._in--;
              temp[prior[j][1]].deep = prior[j][2];
              prior.splice(j, 1);
              temp[s].able = false;
            } else {
              j++;
            }
          }
        } else {
          let road = [signs[0]];
          while (prior.length > 0) {
            let p = prior.findIndex((t) => t[1] == road[0]);
            let index = road.indexOf(prior[p][0]);
            if (index >= 0) {
              temp[prior[p][1]]._in--;
              prior.splice(p, 1);
              for (let i = 0; i < index; i++) {
                for (let j = 0; j < prior.length; j++) {
                  if (prior[j][0] == road[i] && prior[j][1] == road[i + 1]) {
                    temp[prior[j][1]]._in--;
                    prior.splice(j, 1);
                    break;
                  }
                }
              }
              break;
            }
            road.unshift(prior[p][0]);
          }
        }
      }
      this.next = [-1, -1];
      let bestCandidate = null;
      
      // 遍历所有空位的所有候选，选择最优的"空位+候选"组合
      for (let i = -4; i < 0; i++) {
        let t = temp[i];
        
        // 跳过前面不是有效卡片的空位
        if (t.card < 4) {
          continue;
        }
        
        // 获取该空位的所有候选
        let allCandidates = t.allCandidates;
        if (!allCandidates || allCandidates.length === 0) {
          continue;
        }
        
        // 验证：t.index 位置是否是空位
        if (this.cards1[t.index] >= 0) {
          continue;
        }
        
        // 遍历该空位的所有候选
        for (let candidateInfo of allCandidates) {
          let targetCard = candidateInfo.card;
          let candidatePriority = candidateInfo.priority;
          let ruleBasedScore = candidateInfo.ruleBasedScore; // 获取基于规则的评分
          
          // 验证：targetCard 是否存在
          let currentTargetIdx = this.cards1.indexOf(targetCard);
          if (currentTargetIdx < 0) {
            continue;
          }
          
          // 检查状态哈希是否重复，如果重复则跳过
          if (this.isStateHashRepeated(candidateInfo.stateHash)) {
            allCandidates.splice(allCandidates.indexOf(candidateInfo), 1);
            continue;
          }

          // 排除规则1：候选卡的rank等于同匹配组位置号-1的卡的rank-1
          // 找到候选卡所在列的位置号-1的卡
          const prevPosInCandidateCol = currentTargetIdx - 1;
          const prevCardInCandidateCol = this.cards1[prevPosInCandidateCol];
          if (prevCardInCandidateCol >= 0) {
            const prevRankInCandidateCol = prevCardInCandidateCol >> 2;
            const prevSuitInCandidateCol = prevCardInCandidateCol % 4;
            const prevGroupInCandidateCol = prevSuitInCandidateCol % this.matchMode;
            
            // 如果是同匹配组，且候选卡rank = 该卡rank - 1，则排除
            if (targetCard % this.matchMode === prevGroupInCandidateCol && (targetCard >> 2) === prevRankInCandidateCol - 1) {
              continue;
            }
          }
          
          // 使用导入的工具函数创建候选对象，传入rule-based评分
          const currentCandidate = createCandidate(targetCard, t.index, this, candidatePriority, t, currentTargetIdx, ruleBasedScore);
          
          // 判断是否替换最佳候选
          if (!bestCandidate || isBetterCandidate(currentCandidate, bestCandidate)) {
            bestCandidate = currentCandidate;
            // 更新最佳移动
            this.next = [currentCandidate.targetCard, currentCandidate.slotIndex];
          }
        }
      }
      
      // isBetterCandidate函数已从candidateUtils.js导入，此处不再重复定义
      
      
      // 如果没有找到有效移动，检查游戏状态
      if (this.next[0] < 0) {
        
        // 检查四个空位的 priority 是否都为 0（只检查前面是有效卡片且有候选的空位）
        let allPrioritiesZero = true;
        let validSlotCount = 0;
        for (let i = -4; i < 0; i++) {
          if (temp[i] && temp[i].card >= 4) {
            validSlotCount++;
            // 只有既有 priority 又有候选的空位才算有效移动
            const allCandidates = temp[i].allCandidates;
            if (temp[i].priority > 0 && allCandidates && allCandidates.length > 0) {
              allPrioritiesZero = false;
            }
          }
        }
        
        // 计算已完成的牌数
        this.updateN();
        
        // 如果所有牌都已完成，标记为胜利
        if (this.n >= this.number * 4) {
          this.gameManager.setWin();
        } else if (allPrioritiesZero && validSlotCount > 0) {
          // 仅当有有效空位且所有 priority 都为 0 时才设置失败
          this.gameManager.setLose();
        }
      } else {
        this.updateN();
      }
    },
    
    // 设置匹配难度
    setMatchMode(mode) {
      if ([1, 2, 4].includes(mode)) {
        this.matchMode = mode;
        this.init();  // 重新初始化游戏
        console.log(`✅ 难度已设置为: ${mode === 1 ? '简单(数值)' : mode === 2 ? '中等(颜色)' : '困难(花色)'}`);
      } else {
        console.error('❌ 无效的难度模式，请使用 1, 2 或 4');
      }
    },
    
    // 获取当前难度的描述
    getMatchModeDescription() {
      const descriptions = {
        1: '简单(数值匹配) - 任意点数相同即可连接',
        2: '中等(颜色匹配) - 同颜色的牌可以连接',
        4: '困难(花色匹配) - 必须同花色才能连接'
      };
      return descriptions[this.matchMode] || '未知难度';
    },
    
    /**
     * 渲染文本视图 - 显示当前游戏状态
     * 用于终端交互式游戏
     */
    renderTextView() {
      console.log('\n╔════════════════════════════════════════════════╗');
      console.log('║                排序游戏 (Sort)                ║');
      console.log('╚════════════════════════════════════════════════╝');
      console.log(`\n难度: ${this.getMatchModeDescription()}`);
      console.log(`完成度: ${this.n} / ${(this.number + 1) * 4} 张\n`);
      console.log('\n图例: [-n] = 无卡牌可放入  [?X] = 有卡牌可放入  * = 可移动  → = 推荐移动');
      
      // 显示下一步提示
      if (this.next && this.next[0] >= 0) {
        const targetCard = getCardPlaceholderText(this.next[0]);
        const targetSlotCard = this.cards1[this.next[1]];
        const targetSlot = targetSlotCard < 0 ? ['[-1]', '[-2]', '[-3]', '[-4]'][Math.abs(targetSlotCard) - 1] : `[${this.next[1]}]`;
        console.log(`\n💡 建议移动: ${targetCard} → ${targetSlot}`);
      }
      
      // 表格格式显示所有列
      const colWidth = this.number + 1;
      
      // 创建表头（带行号列）
      let header = '┌────┬';
      let headerRow = '│    │';
      let separator = '├────┼';
      let footer = '└────┴';
      
      for (let col = 0; col < 4; col++) {
        header += '───────┬';
        headerRow += `  列${col + 1}  │`;
        separator += '───────┼';
        footer += '───────┴';
      }
      
      header = header.slice(0, -1) + '┐';
      headerRow = headerRow.slice(0, -1) + '│';
      separator = separator.slice(0, -1) + '┤';
      footer = footer.slice(0, -1) + '┘';
      
      console.log(header);
      console.log(headerRow);
      console.log(separator);
      
      // 按行显示卡片（从上到下）
      for (let row = 0; row < colWidth; row++) {
        let rowStr = `│行${(row + 1).toString().padStart(2)}│`;
        
        for (let col = 0; col < 4; col++) {
          const idx = col * colWidth + row;
          const card = this.cards1[idx];
          
          let cellContent = '';
          let highlight = '';
          
          if (card < 0) {
            // 空位 - 检查是否有卡牌可以放入
            const emptySlotIndex = Math.abs(card) - 1; // 0, 1, 2, 3
            const prevCardIndex = idx - 1;
            const prevCard = this.cards1[prevCardIndex];
            // 没有可放入的卡牌，显示负数ID
            const emptyLabel = ['[-1]', '[-2]', '[-3]', '[-4]'][emptySlotIndex];
            cellContent = emptyLabel;
            
            if (prevCard >= 4) { // 前面有有效卡牌
              const candidates = this.findAllCardsByRankOffset(prevCard, -1);
              if (candidates && candidates.length > 0) {
                // 有可放入的卡牌，显示问号格式
                const firstCandidate = candidates[0];
                const candidateText = getCardPlaceholderText(firstCandidate.card);
                cellContent = `[?${candidateText.slice(1)}]`; // 替换第一个字符为问号
              }
            }
          } else {
            // 有效卡片
            const cardText = getCardPlaceholderText(card);
            const canMove = this.canMoveCard(card);
            const isTarget = this.next && this.next[0] === card;
            
            if (isTarget) {
              highlight = '→'; // 下一步建议
              cellContent = `${highlight}${cardText}`;
            } else if (canMove) {
              highlight = '*'; // 可移动
              cellContent = `${highlight}${cardText}`;
            } else {
              cellContent = cardText;
            }
          }
          
          // 居中对齐
          const padding = Math.max(0, 7 - cellContent.length);
          const leftPad = Math.floor(padding / 2);
          const rightPad = padding - leftPad;
          
          rowStr += ' '.repeat(leftPad) + cellContent + ' '.repeat(rightPad) + '│';
        }
        
        console.log(rowStr);
      }
      
      console.log(footer);
      
      return '渲染完成';
    },

    sendCustomButtons() {
      const nextMode = this.matchMode === 1 ? 2 : this.matchMode === 2 ? 4 : 1;
      this.customButtons.push({
        action: 'difficulty',
        label: 'MODE',
        method: 'setMatchMode',
        args: [nextMode],
        description: 'SWITCH DIFFICULTY MODE (EASY → NORMAL → HARD)'
      });
    },
  },
  
  // 以下方法由工厂函数GameComponentPresets.puzzleGame添加：
  // wait(): Promise<void> - 等待指定时间，用于游戏步骤延迟
  // undo(): void - 撤销上一步操作
  // pass(): void - 跳过当前步骤
  // goon(): void - 继续游戏
  // goBack(): void - 返回上一状态
  // step(fn: Function): Promise<void> - 执行游戏步骤
  // executeMethodWithRenderToString(method: string, ...args: any[]): Promise<void> - 执行方法并渲染
  
  /**
   * 组件挂载时注册自定义按钮
   */
  created() {
    this.sendCustomButtons();
  },
  
  /**
   * 当matchMode变化时，更新自定义按钮
   */
  watch: {
    matchMode() {
      this.sendCustomButtons();
    },
    
    // 保留原有的cards1监听
    cards1: {
      handler() {
        this.$nextTick(() => {
          this.updateAllCandidateCycling();
        });
      },
      deep: true
    }
  },
  

};

// 使用工厂函数创建增强的Sort组件并导出
export default GameComponentPresets.puzzleGame(Sort, 500);

/**
 * 工厂函数GameComponentPresets.puzzleGame为Sort组件添加的功能：
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
 * - 提供拼图游戏相关的自动操作和状态管理
 * - 支持自动步骤延迟配置（此处设置为500ms）
 */
