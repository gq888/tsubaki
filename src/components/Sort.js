import { shuffleCards, wait, checkDeadForeach } from "../utils/help.js";
import { GameComponentPresets } from "../utils/gameComponentFactory.js";

const Sort = {
  name: "Sort",
  data() {
    return {
      title: "Sort",
      cards1: [],
      types: ["♥", "♠", "♦", "♣"],
      point: ["A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K"],
      number: 5,
      n: 0,
      sign_index: -1,
      matchMode: 1,  // 1=简单(数值), 2=中等(颜色), 4=困难(花色)
      stateHashHistory: [],
    };
  },
  methods: {
    init() {
      this.sign_index = -1;
      this.cards1.splice(0);
      this.stateHashHistory = [];  // 记录状态哈希历史
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
    },
    
    // 计算 cards1 的哈希值
    calculateStateHash() {
      return this.cards1.join(',');
    },
    
    // 检查当前状态哈希是否已存在
    isStateHashRepeated(hash) {
      if (!this.stateHashHistory) return false;
      return this.stateHashHistory.includes(hash);
    },
    // 记录移动操作
    recordMove(from, to, card, sign) {
      // 计算并记录当前状态的哈希
      const stateHash = this.calculateStateHash();
      if (!this.stateHashHistory) {
        this.stateHashHistory = [];
      }
      this.stateHashHistory.push(stateHash);
      
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
          stateHashHistory: [...(this.stateHashHistory || [])],
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
        await wait(this.gameManager.autoStepDelay);
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
    
    // 前瞻1步：计算给定状态下有多少个可能的移动
    countPossibleMoves(cards1Array) {
      let count = 0;
      
      // 遍历所有空位
      for (let i = 0; i < cards1Array.length; i++) {
        if (cards1Array[i] >= 0) continue;  // 不是空位
        
        const prevCard = i > 0 ? cards1Array[i - 1] : null;
        if (prevCard === null || prevCard < 0) continue;  // 空位前没有有效卡片
        
        const prevRank = prevCard >> 2;
        const targetRank = prevRank - 1;
        if (targetRank < 0) continue;  // 前面是A，无法移动
        
        // 查找所有匹配的候选牌
        const card_group = prevCard % this.matchMode;
        for (let suit = card_group; suit < 4; suit += this.matchMode) {
          const targetCard = targetRank * 4 + suit;
          const cardIdx = cards1Array.indexOf(targetCard);
          
          // 检查候选牌是否存在
          if (cardIdx >= 0) {
            count++;
          }
        }
      }
      
      return count;
    },
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
          let i = index - 1;
          let cardGroup = card % this.matchMode;  // 牌的分组
          // 查找所有同组的前一张牌候选
          let prevCandidates = this.findAllCardsByRankOffset(card, -1);
          
          // 检查是否形成递减序列（点数递减，颜色相同）
          while (i >= 0) {
            let expected_rank = this.number - 1 - (i % (this.number + 1));
            let card_at_i = this.cards1[i];
            if (card_at_i >= 0 && 
                (card_at_i >> 2) == expected_rank && 
                (card_at_i % this.matchMode) == cardGroup) {
              i--;
            } else {
              break;
            }
          }
          
          if (i < 0 || i % (this.number + 1) == this.number) {
            // 快速胜利检测：检查每个候选是否可以立即移动
            for (let prevCandidate of prevCandidates) {
              let next_i = prevCandidate.idx;
              let prevCard = prevCandidate.card;

              if (card >> 2 == this.cards1[next_i - 1] >> 2) continue;
              
              // 查找同颜色的前两个点数的牌（用于检查是否已有连续序列）
              let card_minus_2_idx = this.findCardByRankOffset(card, -2);
              let card_minus_2 = card_minus_2_idx >= 0 ? this.cards1[card_minus_2_idx] : -999;
              
              if (
                card < 8 ||
                next_i % (this.number + 1) == this.number ||
                this.cards1[next_i + 1] == card_minus_2
              ) {
                this.next = [prevCard, index];
                return;
              }
            }
          }
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
              
              candidatesWithPriority.push({
                card: candidate.card,
                idx: candidate.idx,
                priority: candidatePriority,
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
          
          // 创建候选对象，延迟计算特征值
          const currentCandidate = {
            targetCard,
            slotIndex: t.index,
            getPriority: () => candidatePriority,
            getDiff: () => {
              if (!currentCandidate._diff) {
                currentCandidate._diff = t.deep || Math.abs(
                  (targetCard >> 2) - (this.number - 1) + ((t.index % (this.number + 1)))
                );
              }
              return currentCandidate._diff;
            },
            getCardRank: () => {
              if (!currentCandidate._cardRank) {
                currentCandidate._cardRank = targetCard >> 2; // 卡片等级，K=11最大
              }
              return currentCandidate._cardRank;
            },
            getSlotScore: () => {
              if (!currentCandidate._slotScore) {
                const slotPosition = t.index % (this.number + 1);
                const prevRank = t.card >> 2;
                currentCandidate._slotScore = prevRank * 10 - slotPosition;
              }
              return currentCandidate._slotScore;
            },
            getLookaheadCount: () => {
              if (!currentCandidate._lookaheadCount) {
                // 只有在需要时才计算前瞻值
                const simulatedCards = [...this.cards1];
                const slotId = simulatedCards[t.index];
                simulatedCards[currentTargetIdx] = slotId;
                simulatedCards[t.index] = targetCard;
                currentCandidate._lookaheadCount = this.countPossibleMoves(simulatedCards);
              }
              return currentCandidate._lookaheadCount;
            },
            getCardPosition: () => {
              if (!currentCandidate._cardPosition) {
                currentCandidate._cardPosition = currentTargetIdx % (this.number + 1);
              }
              return currentCandidate._cardPosition;
            }
          };
          
          // 判断是否替换最佳候选
          if (!bestCandidate || isBetterCandidate(currentCandidate, bestCandidate)) {
            bestCandidate = currentCandidate;
            // 更新最佳移动
            this.next = [currentCandidate.targetCard, currentCandidate.slotIndex];
          }
        }
      }
      
      // 比较两个候选的优先级函数
      // 优先级：priority > diff > rank > slot_score > lookahead > cardPosition
      function isBetterCandidate(candidateA, candidateB) {
        // 比较优先级
        if (candidateA.getPriority() > candidateB.getPriority()) return true;
        if (candidateA.getPriority() < candidateB.getPriority()) return false;
        
        // 优先级相同，比较距离
        if (candidateA.getDiff() < candidateB.getDiff()) return true;
        if (candidateA.getDiff() > candidateB.getDiff()) return false;
        
        // 距离相同，比较卡片等级
        if (candidateA.getCardRank() > candidateB.getCardRank()) return true;
        if (candidateA.getCardRank() < candidateB.getCardRank()) return false;
        
        // 卡片等级相同，比较空位评分
        if (candidateA.getSlotScore() > candidateB.getSlotScore()) return true;
        if (candidateA.getSlotScore() < candidateB.getSlotScore()) return false;
        
        // 空位评分相同，比较前瞻值
        if (candidateA.getLookaheadCount() > candidateB.getLookaheadCount()) return true;
        if (candidateA.getLookaheadCount() < candidateB.getLookaheadCount()) return false;
        
        // 前瞻值相同，比较卡片位置
        return candidateA.getCardPosition() < candidateB.getCardPosition();
      }
      
      
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
        
        
        // 保存调试状态
        const debugState = {
          cards1: [...this.cards1],
          stateHashHistory: [...(this.stateHashHistory || [])],
          next: this.next,
          sign_index: this.sign_index,
          n: this.n,
          emptySlots: {}
        };
        for (let i = -4; i < 0; i++) {
          debugState.emptySlots[i] = {
            card: temp[i].card,
            priority: temp[i].priority,
            bestCard: temp[i].bestCard,
            index: temp[i].index
          };
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
  },
};

// 使用工厂函数创建增强的Sort组件并导出
export default GameComponentPresets.puzzleGame(Sort, 500);
