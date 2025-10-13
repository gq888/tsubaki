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
      number: 12,
      n: 0,
      sign_index: -1,
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
        cards.splice(i * 13, 0, this.number * 4 - 4 + i);
      }
      this.autoCalc();
    },
    // 记录移动操作
    recordMove(from, to, card, sign) {
      this.gameManager.recordOperation({
        type: "move",
        from: from,
        to: to,
        card: card,
        sign: sign,
        timestamp: Date.now(),
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

    // 重写clickCard方法，使用GameStateManager记录操作
    clickCard(card) {
      let i = this.cards1.indexOf(card);
      // 查找同颜色的下一张牌，要求其后必须有空位
      let index = this.findNextCard(card, (idx) => this.sign_index >= 0 ? idx == this.sign_index - 1 : this.cards1[idx + 1] < 0);
      if (index >= 0) {
        let sign = this.cards1[index + 1];
        this.cards1.splice(i, 1, sign);
        this.cards1.splice(index + 1, 1, card);
        this.recordMove(i, index + 1, card, sign); // 使用GameStateManager记录操作
      }
      this.sign_index = -1;
    },

    // 重写stepFn方法
    async stepFn() {
      await this.gameManager.step(async () => {
        this.clickSign(this.next[1]);
        await wait(this.gameManager.autoStepDelay);
        
        const cardBefore = this.next[0];
        const indexBefore = this.cards1.indexOf(cardBefore);
        console.log(`🎯 准备移动卡片: card=${cardBefore}, index=${indexBefore}`);
        
        this.clickCard(this.next[0]);
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
        const scrollTop = (index % 13) * 150;
        
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
      let row = idx % 13;
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
      let card_color = card % 2;  // 0=红色(♥♦), 1=黑色(♠♣)
      let candidates = [];
      
      // 收集所有同颜色的候选牌
      for (let suit = card_color; suit < 4; suit += 2) {
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
      if (card < 4) return false;
      // 查找同颜色的下一张牌，检查其后是否有空位
      let nextIdx = this.findNextCard(card, (idx) => this.cards1[idx + 1] < 0);
      return nextIdx >= 0;
    },
    autoCalc() {
      let over = true,
        temp = {},
        prior = [];
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
        let prevFn = (prev_c, deep, accumulatedPriority = 0) => {
          if (prev_c < 0) {
            // 到达空位，累加 priority
            prior.push([id, prev_c, deep, accumulatedPriority]);
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
            }
            
            return maxPriority;
          }
        };
        let nextFn = (next_i, next_c, deep) => {
          if (!checkDeadForeach(dead, [next_c, 1])) return;
          dead.unshift([next_c, 1]);
          if (deep > 0 && next_c >= 8) {
            let prev_c = this.cards1[next_i + 1];
            prevFn(prev_c, deep);
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
              temp[this.cards1[next_i - 1]].priority++;
              temp[this.cards1[next_i - 1]]._in++;
              return;
            }
            next_c += 4;
            // 检查是否形成同颜色递增序列
            while (n % 13 > 0) {
              let card_at_n = this.cards1[n];
              if (card_at_n >= 0 && 
                  (card_at_n >> 2) == (next_c >> 2) && 
                  (card_at_n % 2) == (next_c % 2)) {
                n--;
                next_c += 4;
                deep++;
              } else {
                break;
              }
            }
            if (n % 13 == 0) {
              return;
            }
            let idx = this.cards1.indexOf(next_c);
            if (idx >= 0) {
              let prev_c = this.cards1[idx + 1];
              prevFn(prev_c, deep);
            }
            return;
          }
          // 获取所有同颜色的前一张牌候选
          let prevCandidates = this.findAllCardsByRankOffset(next_c, -1);
          for (let prevCandidate of prevCandidates) {
            nextFn(prevCandidate.idx, next_c, deep);
          }
        };
        if (card >= 4) {
          let i = index - 1;
          let color = card % 2;  // 牌的颜色
          // 查找所有同颜色的前一张牌候选
          let prevCandidates = this.findAllCardsByRankOffset(card, -1);
          
          // 检查是否形成递减序列（点数递减，颜色相同）
          while (i >= 0) {
            let expected_rank = this.number - 1 - (i % 13);
            let card_at_i = this.cards1[i];
            if (card_at_i >= 0 && 
                (card_at_i >> 2) == expected_rank && 
                (card_at_i % 2) == color) {
              i--;
            } else {
              break;
            }
          }
          
          if (i < 0 || i % 13 == this.number) {
            // 快速胜利检测：检查每个候选是否可以立即移动
            for (let prevCandidate of prevCandidates) {
              let next_i = prevCandidate.idx;
              let prevCard = prevCandidate.card;
              
              // 查找同颜色的前两个点数的牌（用于检查是否已有连续序列）
              let card_minus_2_idx = this.findCardByRankOffset(card, -2);
              let card_minus_2 = card_minus_2_idx >= 0 ? this.cards1[card_minus_2_idx] : -999;
              
              if (
                card < 8 ||
                next_i % 13 == this.number ||
                this.cards1[next_i + 1] == card_minus_2
              ) {
                this.next = [prevCard, index, id];
                return;
              }
            }
          }
          over = false;
        }
        nextFn(index, id, 0);
        
        // 深度搜索完成后，比较 card 的下一张牌的所有候选，记录最优的
        if (card >= 4) {
          let candidates = this.findAllCardsByRankOffset(card, 1);
          if (candidates.length > 1) {
            // 有多个候选，比较它们各自后面的空位的 priority
            let maxPriority = -1;
            let bestCandidate = null;
            
            for (let candidate of candidates) {
              let signCard = this.cards1[candidate.idx + 1];
              if (signCard < 0 && temp[signCard]) {
                if (temp[signCard].priority > maxPriority) {
                  maxPriority = temp[signCard].priority;
                  bestCandidate = candidate.card;
                }
              }
            }
            
            // 记录最优候选到当前空位
            if (bestCandidate !== null) {
              temp[id].bestCard = bestCandidate;
            }
          }
        }
      }
      if (over) {
        this.n = 0;
        for (let i = 0; i < this.number * 4 + 4; i++) {
          if (
            this.cards1[i] >> 2 ==
            this.number - 1 - (i % 13)
          ) {
            this.n++;
          }
        }
        if (this.n >= this.number * 4) {
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
      this.next = [-1, -1, -1];
      let min = 999999,
        max = -1;
      let best_card_rank = -1;
      for (let i = -4; i < 0; i++) {
        let t = temp[i];
        if (t.card < 4) {
          continue;
        }
        if (!t.able) {
          continue;
        }
        
        // 使用深度搜索找到的最优候选牌，如果没有则回退到严格花色匹配
        let targetCard = (t.bestCard !== null && t.bestCard !== undefined) ? t.bestCard : (t.card - 4);
        
        let diff =
          t.deep ||
          Math.abs(
            (targetCard >> 2) -
              (this.number - 1) +
              ((t.index % 13)),
          );
        let card_rank = targetCard >> 2;  // 卡片等级，K=11最大
        // 优先级 > 距离 > 卡片等级（大牌优先）
        if (t.priority > max || 
            (t.priority == max && diff < min) ||
            (t.priority == max && diff == min && card_rank > best_card_rank)) {
          this.next = [targetCard, t.index, i];
          min = diff;
          max = t.priority;
          best_card_rank = card_rank;
        }
      }
    },
  },
};

// 使用工厂函数创建增强的Sort组件并导出
export default GameComponentPresets.puzzleGame(Sort, 500);
