// 候选卡片评估工具函数

/**
 * 创建候选对象，延迟计算特征值
 * @param {number} targetCard - 目标卡片
 * @param {number} slotIndex - 空位索引
 * @param {Object} context - 上下文对象，包含必要的方法和属性
 * @param {number} candidatePriority - 候选优先级
 * @param {Object} t - 临时对象信息
 * @param {number} currentTargetIdx - 当前目标索引
 * @returns {Object} 候选对象
 */
export function createCandidate(targetCard, slotIndex, context, candidatePriority, t, currentTargetIdx) {
  const currentCandidate = {
    targetCard,
    slotIndex,
    // 统一使用大于比较，对需要小于比较的特征取反
    _getters: [
      // 优先级 (正常比较)
      () => {
        return candidatePriority;
      },
      // 深度 (正常比较)
      () => {
        if (!currentCandidate._deep) {
          currentCandidate._deep = t.deep;
        }
        return currentCandidate._deep;
      },
      // 前瞻值 (正常比较)
      () => {
        if (!currentCandidate._lookaheadCount) {
          // 只有在需要时才计算前瞻值
          const simulatedCards = [...context.cards1];
          const slotId = simulatedCards[t.index];
          simulatedCards[currentTargetIdx] = slotId;
          simulatedCards[t.index] = targetCard;
          currentCandidate._lookaheadCount = context.countPossibleMoves(simulatedCards);
        }
        return currentCandidate._lookaheadCount;
      },
      // 获胜概率 (分治评估，正常比较)
      () => {
        if (currentCandidate._winProbability === undefined) {
          // 使用分治算法评估移动后的获胜可达性
          const simulatedCards = [...context.cards1];
          const slotId = simulatedCards[t.index];
          simulatedCards[currentTargetIdx] = slotId;
          simulatedCards[t.index] = targetCard;
          currentCandidate._winProbability = context.estimateWinProbability(simulatedCards);
        }
        return currentCandidate._winProbability;
      },
      // 距离 (取反，因为原逻辑是小于比较)
      () => {
        if (!currentCandidate._diff) {
          currentCandidate._diff = Math.abs(
            (targetCard >> 2) - (context.number - 1) + ((t.index % (context.number + 1)))
          );
        }
        return -currentCandidate._diff; // 取反，使小于比较变为大于比较
      },
      // 卡片等级 (正常比较)
      () => {
        if (!currentCandidate._cardRank) {
          currentCandidate._cardRank = targetCard >> 2; // 卡片等级，K=11最大
        }
        return currentCandidate._cardRank;
      },
      // prevRank (正常比较)
      () => {
        if (!currentCandidate._prevRank) {
          const prevRank = t.card >> 2;
          currentCandidate._prevRank = prevRank;
        }
        return currentCandidate._prevRank;
      },
      // slotPosition (取反)
      () => {
        if (!currentCandidate._slotPosition) {
          const slotPosition = t.index % (context.number + 1);
          currentCandidate._slotPosition = slotPosition;
        }
        return -currentCandidate._slotPosition;
      },
      // 已还原卡片数 (正常比较)
      () => {
        if (currentCandidate._restoredCount === undefined) {
          // 计算移动后已还原到正确位置的卡片数量（从高rank开始）
          const simulatedCards = [...context.cards1];
          const slotId = simulatedCards[t.index];
          simulatedCards[currentTargetIdx] = slotId;
          simulatedCards[t.index] = targetCard;
          currentCandidate._restoredCount = context.countRestoredCards(simulatedCards);
        }
        return currentCandidate._restoredCount;
      },
      // 卡片位置 (取反，因为原逻辑是小于比较)
      () => {
        if (!currentCandidate._cardPosition) {
          currentCandidate._cardPosition = currentTargetIdx % (context.number + 1);
        }
        return -currentCandidate._cardPosition; // 取反，使小于比较变为大于比较
      }
    ],
  };
  return currentCandidate;
}

/**
 * 比较两个候选的优先级函数 - 使用循环和统一的大于比较
 * 优先级：priority > deep > lookahead > winProbability(分治) > diff > rank > prevRank > slotPosition > restoredCount(DP) > cardPosition
 * @param {Object} candidateA - 候选A
 * @param {Object} candidateB - 候选B
 * @returns {boolean} 是否候选A更好
 */
export function isBetterCandidate(candidateA, candidateB) {
  // 使用_getters数组进行循环比较，所有特征都统一为大于比较
  for (let i = 0; i < candidateA._getters.length; i++) {
    const valueA = candidateA._getters[i]();
    const valueB = candidateB._getters[i]();
    
    if (valueA > valueB) {
      return true; // A比B好
    } else if (valueA < valueB) {
      return false; // B比A好
    }
    // 相等时继续比较下一个特征
  }
  
  // 所有特征都相等，返回false（A不优于B）
  return false;
}

/**
 * 游戏状态评估工具方法集合
 */
export const gameEvaluationMethods = {
  /**
   * 前瞻1步：计算给定状态下有多少个可能的移动
   * @param {Array} cards1Array - 卡片数组
   * @returns {number} 可能的移动数量
   */
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
    
  /**
   * 动态规划：计算已还原到正确位置的卡片数量（从高rank开始）
   * @param {Array} cards1Array - 卡片数组
   * @returns {number} 已还原的卡片数量
   */
    countRestoredCards(cards1Array) {
      let restoredCount = 0;
      const colSize = this.number + 1;  // 每列的大小
      
      // 从最高rank开始检查（K往下到A=0）
      for (let rank = this.number - 1; rank >= 0; rank--) {
        // 检查每种花色
        for (let suit = 0; suit < 4; suit++) {
          const card = rank * 4 + suit;
          const cardIdx = cards1Array.indexOf(card);
          
          if (cardIdx < 0) continue;  // 卡片不存在
          
          // 计算该卡片的目标列（基于matchMode）
          const targetGroup = suit % this.matchMode;
          
          // 计算该卡片在目标列中应该的位置
          // 目标列从底部开始：colStart + (number - rank)
          const colStart = targetGroup * colSize;
          const expectedPosition = colStart + (this.number - 1 - rank);
          
          // 检查卡片是否在正确位置
          if (cardIdx === expectedPosition) {
            // 还需要检查该位置下方的所有卡片是否都正确
            let allBelowCorrect = true;
            
            // 检查该位置下方的每个位置
            for (let checkRank = rank + 1; checkRank < this.number; checkRank++) {
              const checkPos = colStart + (this.number - 1 - checkRank);
              const cardAtPos = cards1Array[checkPos];
              
              if (cardAtPos < 0) {
                // 下方有空位，不正确
                allBelowCorrect = false;
                break;
              }
              
              const cardAtPosRank = cardAtPos >> 2;
              const cardAtPosSuit = cardAtPos % 4;
              const cardAtPosGroup = cardAtPosSuit % this.matchMode;
              
              // 检查下方卡片是否属于同一列且rank正确
              if (cardAtPosGroup !== targetGroup || cardAtPosRank !== checkRank) {
                allBelowCorrect = false;
                break;
              }
            }
            
            if (allBelowCorrect) {
              restoredCount++;
            }
          }
        }
      }
      
      return restoredCount;
    },
    
  /**
   * 分治算法：评估获胜状态可达性（0-100分，分数越高越可能获胜）
   * @param {Array} cards1Array - 卡片数组
   * @returns {number} 获胜概率分数（0-100）
   */
    estimateWinProbability(cards1Array) {
      const colSize = this.number + 1;
      const totalCols = 4;
      let totalScore = 0;
      let maxScore = 0;
      
      // 分治：评估每一行的完成度
      for (let row = 0; row < colSize; row++) {
        const rowScore = this.evaluateRowScore(cards1Array, row, colSize, totalCols);
        totalScore += rowScore.score;
        maxScore += rowScore.maxScore;
      }
      
      // 计算全局阻塞惩罚
      const blockPenalty = this.calculateBlockPenalty(cards1Array);
      
      // 归一化到0-100
      const baseScore = maxScore > 0 ? (totalScore / maxScore) * 80 : 0;
      const finalScore = Math.max(0, baseScore - blockPenalty);
      
      return finalScore;
  }
};

/**
 * 候选评估工具函数集合
 */
export const candidateUtils = {
  createCandidate,
  isBetterCandidate,
  gameEvaluationMethods
};