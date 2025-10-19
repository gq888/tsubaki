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
        // 1. 卡片等级 (d=0.064, ↑)
        () => {
            if (currentCandidate._feature0 === undefined) {
            currentCandidate._feature0 = targetCard >> 2;
            }
            return currentCandidate._feature0;
        },
        // 2. 卡片花色 (d=0.052, ↑)
        () => {
            if (currentCandidate._feature1 === undefined) {
            currentCandidate._feature1 = targetCard % 4;
            }
            return currentCandidate._feature1;
        },
        // 3. 卡片在列中的位置 (d=0.057, ↓)
        () => {
            if (currentCandidate._feature2 === undefined) {
            currentCandidate._feature2 = currentTargetIdx % (context.number + 1);
            }
            return -currentCandidate._feature2;
        },
        // 4. 空位在列中的位置 (d=0.213, ↓)
        () => {
            if (currentCandidate._feature3 === undefined) {
            currentCandidate._feature3 = t.index % (context.number + 1);
            }
            return -currentCandidate._feature3;
        },
        // 5. 空位前牌等级 (d=0.064, ↑)
        () => {
            if (currentCandidate._feature4 === undefined) {
            currentCandidate._feature4 = t.card >> 2;
            }
            return currentCandidate._feature4;
        },
        // 6. 卡片所在列的空位数 (d=0.003, ↑)
        () => {
            if (currentCandidate._feature5 === undefined) {
            currentCandidate._feature5 = context.countEmptyInColumn(context.cards1, Math.floor(currentTargetIdx / (context.number + 1)));
            }
            return currentCandidate._feature5;
        },
        // 7. 卡片上方的空位数 (d=0.160, ↑)
        () => {
            if (currentCandidate._feature6 === undefined) {
            currentCandidate._feature6 = context.countEmptyAbove(context.cards1, currentTargetIdx);
            }
            return currentCandidate._feature6;
        },
        // 8. 卡片下方的空位数 (d=0.098, ↓)
        () => {
            if (currentCandidate._feature7 === undefined) {
            currentCandidate._feature7 = context.countEmptyBelow(context.cards1, currentTargetIdx);
            }
            return -currentCandidate._feature7;
        },
        // 9. 空位所在列的空位数 (d=0.138, ↓)
        () => {
            if (currentCandidate._feature8 === undefined) {
            currentCandidate._feature8 = context.countEmptyInColumn(context.cards1, Math.floor(t.index / (context.number + 1)));
            }
            return -currentCandidate._feature8;
        },
        // 10. 空位上方的空位数 (d=0.043, ↑)
        () => {
            if (currentCandidate._feature9 === undefined) {
            currentCandidate._feature9 = context.countEmptyAbove(context.cards1, t.index);
            }
            return currentCandidate._feature9;
        },
        // 11. 总空位数 (d=0.000, ↓)
        () => {
            if (currentCandidate._feature10 === undefined) {
            currentCandidate._feature10 = context.cards1.filter(c => c < 0).length;
            }
            return -currentCandidate._feature10;
        },
        // 12. 卡片上方的牌数 (d=0.011, ↑)
        () => {
            if (currentCandidate._feature11 === undefined) {
            currentCandidate._feature11 = context.countCardsAbove(context.cards1, currentTargetIdx);
            }
            return currentCandidate._feature11;
        },
        // 13. 空位下方已就位的牌数 (d=0.138, ↑)
        () => {
            if (currentCandidate._feature12 === undefined) {
            currentCandidate._feature12 = context.countCorrectBelow(context.cards1, t.index);
            }
            return currentCandidate._feature12;
        },
        // 14. 同rank的其他候选数 (d=0.021, ↑)
        () => {
            if (currentCandidate._feature13 === undefined) {
            currentCandidate._feature13 = context.countSameRankCandidates(context.cards1, t);
            }
            return currentCandidate._feature13;
        },
        // 15. 移动后可移动数 (d=0.215, ↑)
        () => {
            if (currentCandidate._feature14 === undefined) {
            const simulatedCards = [...context.cards1];
            const slotId = simulatedCards[t.index];
            simulatedCards[currentTargetIdx] = slotId;
            simulatedCards[t.index] = targetCard;
            currentCandidate._feature14 = context.countPossibleMoves(simulatedCards);
            }
            return currentCandidate._feature14;
        },
        // 16. 空位分布熵 (d=0.096, ↓)
        () => {
            if (currentCandidate._feature15 === undefined) {
            const simulatedCards = [...context.cards1];
            const slotId = simulatedCards[t.index];
            simulatedCards[currentTargetIdx] = slotId;
            simulatedCards[t.index] = targetCard;
            currentCandidate._feature15 = context.calculateEmptyEntropy(simulatedCards);
            }
            return -currentCandidate._feature15;
        },
        // 17. 移动后已就位牌数 (d=0.189, ↑)
        () => {
            if (currentCandidate._feature16 === undefined) {
            const simulatedCards = [...context.cards1];
            const slotId = simulatedCards[t.index];
            simulatedCards[currentTargetIdx] = slotId;
            simulatedCards[t.index] = targetCard;
            currentCandidate._feature16 = context.countRestoredCards(simulatedCards);
            }
            return currentCandidate._feature16;
        },
        // 18. 曼哈顿距离 (d=0.074, ↑)
        () => {
            if (currentCandidate._feature17 === undefined) {
            currentCandidate._feature17 = Math.abs((currentTargetIdx % (context.number + 1)) - (context.number - 1 - (targetCard >> 2))) + Math.abs(Math.floor(currentTargetIdx / (context.number + 1)) - ((targetCard % 4) % context.matchMode));
            }
            return currentCandidate._feature17;
        },
        // 19. 是否跨列 (d=0.034, ↑)
        () => {
            if (currentCandidate._feature18 === undefined) {
            currentCandidate._feature18 = (Math.floor(currentTargetIdx / (context.number + 1)) !== Math.floor(t.index / (context.number + 1))) ? 1 : 0;
            }
            return currentCandidate._feature18;
        },
        // 20. slot_score版本2 (d=0.084, ↑)
        () => {
            if (currentCandidate._feature19 === undefined) {
            currentCandidate._feature19 = (t.card >> 2) * 10 - (t.index % (context.number + 1));
            }
            return currentCandidate._feature19;
        },
        // 21. slot_score版本3 (d=0.310, ↓)
        () => {
            if (currentCandidate._feature20 === undefined) {
            currentCandidate._feature20 = (t.card >> 2) * context.countEmptyBelow(context.cards1, t.index);
            }
            return -currentCandidate._feature20;
        },
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

    // === 辅助函数：特征计算 ===

    // 计算列中的空位数
    countEmptyInColumn(cards, colIdx) {
        const colStart = colIdx * (this.number + 1);
        const colEnd = colStart + this.number + 1;
        let count = 0;
        for (let i = colStart; i < colEnd; i++) {
        if (cards[i] < 0) count++;
        }
        return count;
    },

    // 计算位置上方的空位数
    countEmptyAbove(cards, pos) {
        const col = Math.floor(pos / (this.number + 1));
        const colEnd = (col + 1) * (this.number + 1);
        let count = 0;
        for (let i = pos + 1; i < colEnd; i++) {
        if (cards[i] < 0) count++;
        }
        return count;
    },

    // 计算位置下方的空位数
    countEmptyBelow(cards, pos) {
        const col = Math.floor(pos / (this.number + 1));
        const colStart = col * (this.number + 1);
        let count = 0;
        for (let i = colStart; i < pos; i++) {
        if (cards[i] < 0) count++;
        }
        return count;
    },

    // 计算位置上方的牌数
    countCardsAbove(cards, pos) {
        const col = Math.floor(pos / (this.number + 1));
        const colEnd = (col + 1) * (this.number + 1);
        let count = 0;
        for (let i = pos + 1; i < colEnd; i++) {
        if (cards[i] >= 0) count++;
        }
        return count;
    },

    // 计算空位下方已就位的牌数
    countCorrectBelow(cards, slotIdx) {
        const col = Math.floor(slotIdx / (this.number + 1));
        const colStart = col * (this.number + 1);
        let count = 0;
        
        for (let i = colStart; i < slotIdx; i++) {
        const c = cards[i];
        if (c < 0) break;
        
        const cRank = c >> 2;
        const cSuit = c % 4;
        const expectedRank = this.number - 1 - (i % (this.number + 1));
        
        if ((cSuit % this.matchMode) === (col % this.matchMode) && cRank === expectedRank) {
            count++;
        } else {
            break;
        }
        }
        
        return count;
    },

    // 计算同rank的其他候选数
    countSameRankCandidates(cards, slot) {
        let count = 0;
        const prevCard = slot.card;
        const prevRank = prevCard >> 2;
        const targetRank = prevRank - 1;
        
        if (targetRank < 0) return 0;
        
        const cardGroup = prevCard % this.matchMode;
        for (let suit = cardGroup; suit < 4; suit += this.matchMode) {
        const card = targetRank * 4 + suit;
        const idx = cards.indexOf(card);
        if (idx >= 0 && idx + 1 < cards.length && cards[idx + 1] < 0) {
            count++;
        }
        }
        
        return count;
    },

    // 计算空位分布熵
    calculateEmptyEntropy(cards) {
        const emptyPerCol = [0, 0, 0, 0];
        let totalEmpty = 0;
        
        for (let i = 0; i < cards.length; i++) {
        if (cards[i] < 0) {
            totalEmpty++;
            const col = Math.floor(i / (this.number + 1));
            emptyPerCol[col]++;
        }
        }
        
        if (totalEmpty === 0) return 0;
        
        let entropy = 0;
        for (let count of emptyPerCol) {
        if (count > 0) {
            const p = count / totalEmpty;
            entropy -= p * Math.log2(p);
        }
        }
        
        return entropy;
    },
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
  },


    
    // 评估单行的完成度（分治子问题）
    evaluateRowScore(cards1Array, row, colSize, totalCols) {
      let score = 0;
      let maxScore = 0;
      
      // 对于每一行，检查每一列中的对应位置
      for (let col = 0; col < totalCols; col++) {
        const pos = col * colSize + row;
        const cardAtPos = cards1Array[pos];
        
        maxScore += 10;  // 每个位置满分10分
        
        if (cardAtPos < 0) {
          // 空位：检查该rank的所有候选卡片位置
          const emptySlotsAbove = this.countEmptySlotsAbove(cards1Array, pos);
          score += Math.max(0, 10 - emptySlotsAbove * 2);  // 上方空位越多，分数越低
          continue;
        }
        
        const cardRank = cardAtPos >> 2;
        const cardSuit = cardAtPos % 4;
        const cardGroup = cardSuit % this.matchMode;
        
        // 计算该行应该对应的rank
        const expectedRank = this.number - 1 - row;
        
        // 计算该列应该对应的group
        const expectedGroup = col % this.matchMode;
        
        // 检查卡片是否属于正确的组和rank
        if (cardGroup === expectedGroup) {
          // 正确的组
          if (cardRank === expectedRank) {
            // rank完全正确
            score += 10;
            
            // 额外奖励：该组下方行都已正确放置
            if (this.checkRowBelowCorrect(cards1Array, row, col, colSize)) {
              score += 5;
              maxScore += 5;
            }
          } else if (cardRank > expectedRank) {
            // rank太高，轻微扣分（还能移走）
            score += 5;
          } else {
            // rank太低，严重扣分（阻塞）
            score += 2;
          }
        } else {
          // 错误的组，适度扣分
          score += 3;
          
          // 如果rank正确，给予部分分数
          if (cardRank === expectedRank) {
            score += 2;
          }
        }
      }
      
      return { score, maxScore };
    },
    
    // 计算某位置上方的空位数
    countEmptySlotsAbove(cards1Array, pos) {
      let count = 0;
      const col = Math.floor(pos / (this.number + 1));
        const colStart = col * (this.number + 1);
      const colEnd = colStart + this.number + 1;
      
      for (let i = pos + 1; i < colEnd; i++) {
        if (cards1Array[i] < 0) count++;
              }
      
      return count;
    },
    
    // 检查某位置下方的行是否都已正确放置
    checkRowBelowCorrect(cards1Array, row, col, colSize) {
      for (let checkRow = row + 1; checkRow < this.number; checkRow++) {
        const checkPos = col * colSize + checkRow;
        const cardAtPos = cards1Array[checkPos];
        
        if (cardAtPos < 0) return false;
        
        const cardRank = cardAtPos >> 2;
        const expectedRank = this.number - 1 - checkRow;
        
        if (cardRank !== expectedRank) return false;
      }
      
      return true;
    },
    
    // 计算全局阻塞惩罚
    calculateBlockPenalty(cards1Array) {
      let penalty = 0;
      const colSize = this.number + 1;
      
      // 检查每列的阻塞情况
      for (let col = 0; col < 4; col++) {
        const colStart = col * colSize;
        
        // 检查是否存在"死锁"：高rank卡片被低rank卡片压住
        for (let i = colStart; i < colStart + colSize - 1; i++) {
          const card = cards1Array[i];
          if (card < 0) continue;
          
          const cardRank = card >> 2;
          
          // 检查上方的卡片
          for (let j = i + 1; j < colStart + colSize; j++) {
            const upperCard = cards1Array[j];
            if (upperCard < 0) continue;
            
            const upperRank = upperCard >> 2;
            
            // 如果上方卡片rank更低，这是一个阻塞
            if (upperRank < cardRank) {
              penalty += 5;
            }
          }
        }
      }
      
      // 检查可移动性：如果没有任何可移动的牌，增加惩罚
      const possibleMoves = this.countPossibleMoves(cards1Array);
      if (possibleMoves === 0) {
        penalty += 20;
      } else if (possibleMoves === 1) {
        penalty += 10;
      }
      
      return penalty;
    },
};

/**
 * 候选评估工具函数集合
 */
export const candidateUtils = {
  createCandidate,
  isBetterCandidate,
  gameEvaluationMethods
};