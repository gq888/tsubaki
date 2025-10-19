// 根据降维分析结果，生成优化后的算法代码
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const reductionFile = path.join(__dirname, '..', 'dimensionality-reduction-result.json');
const analysisFile = path.join(__dirname, '..', 'rich-features-analysis.json');

// 读取数据
if (!fs.existsSync(reductionFile)) {
  console.log('❌ 降维结果文件不存在！');
  console.log('请先运行: node scripts/dimensionality-reduction.js');
  process.exit(1);
}

if (!fs.existsSync(analysisFile)) {
  console.log('❌ 分析文件不存在！');
  console.log('请先运行: node scripts/analyze-rich-features.js');
  process.exit(1);
}

const reduction = JSON.parse(fs.readFileSync(reductionFile, 'utf8'));
const analysis = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));

console.log('='.repeat(70));
console.log('生成优化后的算法代码');
console.log('='.repeat(70));

// 特征计算代码映射
const featureCodeMap = {
  'cardRank': {
    code: 'targetCard >> 2',
    comment: '卡片等级'
  },
  'cardSuit': {
    code: 'targetCard % 4',
    comment: '卡片花色'
  },
  'cardPosition': {
    code: 'currentTargetIdx % (this.number + 1)',
    comment: '卡片在列中的位置'
  },
  'slotPosition': {
    code: 't.index % (this.number + 1)',
    comment: '空位在列中的位置'
  },
  'slotPrevRank': {
    code: 't.card >> 2',
    comment: '空位前牌等级'
  },
  'emptyInCardCol': {
    code: 'this.countEmptyInColumn(this.cards1, Math.floor(currentTargetIdx / (this.number + 1)))',
    comment: '卡片所在列的空位数',
    needsHelper: true
  },
  'emptyAboveCard': {
    code: 'this.countEmptyAbove(this.cards1, currentTargetIdx)',
    comment: '卡片上方的空位数',
    needsHelper: true
  },
  'emptyBelowCard': {
    code: 'this.countEmptyBelow(this.cards1, currentTargetIdx)',
    comment: '卡片下方的空位数',
    needsHelper: true
  },
  'emptyInSlotCol': {
    code: 'this.countEmptyInColumn(this.cards1, Math.floor(t.index / (this.number + 1)))',
    comment: '空位所在列的空位数',
    needsHelper: true
  },
  'emptyAboveSlot': {
    code: 'this.countEmptyAbove(this.cards1, t.index)',
    comment: '空位上方的空位数',
    needsHelper: true
  },
  'emptyBelowSlot': {
    code: 'this.countEmptyBelow(this.cards1, t.index)',
    comment: '空位下方的空位数',
    needsHelper: true
  },
  'totalEmpty': {
    code: 'this.cards1.filter(c => c < 0).length',
    comment: '总空位数'
  },
  'cardsAboveTarget': {
    code: 'this.countCardsAbove(this.cards1, currentTargetIdx)',
    comment: '卡片上方的牌数',
    needsHelper: true
  },
  'correctBelowSlot': {
    code: 'this.countCorrectBelow(this.cards1, t.index)',
    comment: '空位下方已就位的牌数',
    needsHelper: true
  },
  'sameRankCandidates': {
    code: 'this.countSameRankCandidates(this.cards1, t)',
    comment: '同rank的其他候选数',
    needsHelper: true
  },
  'afterMoves': {
    code: 'this.countPossibleMoves(simulatedCards)',
    comment: '移动后可移动数',
    needsSimulation: true
  },
  'emptyEntropy': {
    code: 'this.calculateEmptyEntropy(simulatedCards)',
    comment: '空位分布熵',
    needsSimulation: true,
    needsHelper: true
  },
  'restoredCards': {
    code: 'this.countRestoredCards(simulatedCards)',
    comment: '移动后已就位牌数',
    needsSimulation: true
  },
  'manhattanDist': {
    code: 'Math.abs((currentTargetIdx % (this.number + 1)) - (this.number - 1 - (targetCard >> 2))) + Math.abs(Math.floor(currentTargetIdx / (this.number + 1)) - ((targetCard % 4) % this.matchMode))',
    comment: '曼哈顿距离'
  },
  'isCrossColumn': {
    code: '(Math.floor(currentTargetIdx / (this.number + 1)) !== Math.floor(t.index / (this.number + 1))) ? 1 : 0',
    comment: '是否跨列'
  },
  'slot_score_v1': {
    code: '(this.number - (t.index % (this.number + 1))) * 10 + (t.card >> 2)',
    comment: 'slot_score版本1'
  },
  'slot_score_v2': {
    code: '(t.card >> 2) * 10 - (t.index % (this.number + 1))',
    comment: 'slot_score版本2'
  },
  'slot_score_v3': {
    code: '(t.card >> 2) * this.countEmptyBelow(this.cards1, t.index)',
    comment: 'slot_score版本3',
    needsHelper: true
  }
};

// 生成辅助函数代码
const helperFunctions = `
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
`;

// 为每个方案生成代码
function generateAlgorithmCode(plan) {
  const features = plan.features;
  
  // 找出每个特征的方向和归一化
  const featureInfos = features.map(fname => {
    const corr = analysis.correlations.find(c => c.feature === fname);
    const featureMap = featureCodeMap[fname];
    
    if (!corr || !featureMap) return null;
    
    return {
      name: fname,
      direction: corr.diff > 0 ? 1 : -1, // 1表示越大越好，-1表示越小越好
      code: featureMap.code,
      comment: featureMap.comment,
      needsSimulation: featureMap.needsSimulation || false,
      needsHelper: featureMap.needsHelper || false,
      cohensD: corr.cohensD
    };
  }).filter(f => f !== null);
  
  // 检查是否需要模拟和辅助函数
  const needsSimulation = featureInfos.some(f => f.needsSimulation);
  const needsHelpers = featureInfos.some(f => f.needsHelper);
  
  // 生成getter数组
  const getters = featureInfos.map((f, idx) => {
    const sign = f.direction > 0 ? '' : '-'; // 负方向取反
    const computation = f.needsSimulation ? f.code : f.code;
    
    return `              // ${idx + 1}. ${f.comment} (d=${f.cohensD.toFixed(3)}, ${f.direction > 0 ? '↑' : '↓'})
              () => {
                if (currentCandidate._feature${idx} === undefined) {
                  ${f.needsSimulation ? `const simulatedCards = [...this.cards1];
                  const slotId = simulatedCards[t.index];
                  simulatedCards[currentTargetIdx] = slotId;
                  simulatedCards[t.index] = targetCard;
                  currentCandidate._feature${idx} = ${computation};` : `currentCandidate._feature${idx} = ${computation};`}
                }
                return ${sign}currentCandidate._feature${idx};
              }`;
  }).join(',\n');
  
  return {
    getters,
    needsHelpers,
    featureCount: features.length,
    featureNames: features
  };
}

// 为每个方案生成代码
console.log('\n为每个降维方案生成优化代码...\n');

const generatedCodes = {};

for (const rec of reduction.recommendations) {
  console.log(`生成 ${rec.name} 的代码...`);
  const code = generateAlgorithmCode(rec);
  generatedCodes[rec.name] = code;
  console.log(`  特征数: ${code.featureCount}`);
  console.log(`  需要辅助函数: ${code.needsHelpers ? '是' : '否'}\n`);
}

// 生成完整的算法文件
const outputDir = path.join(__dirname, '..', 'generated-algorithms');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

for (const [planName, code] of Object.entries(generatedCodes)) {
  const fileName = planName.replace(/[()（）]/g, '').replace(/\s+/g, '-').toLowerCase();
  const filePath = path.join(outputDir, `algorithm-${fileName}.txt`);
  
  const fullCode = `// 优化算法代码片段 - ${planName}
// 特征数: ${code.featureCount}
// 特征列表: ${code.featureNames.join(', ')}

${code.needsHelpers ? helperFunctions : '// 无需辅助函数'}

    // === 候选评估核心代码 ===
    
    // 在autoCalc方法中，创建候选对象时使用以下代码：
    
          const currentCandidate = {
            targetCard,
            slotIndex: t.index,
            _getters: [
${code.getters}
            ],
          };
          
          // 判断是否替换最佳候选
          if (!bestCandidate || isBetterCandidate(currentCandidate, bestCandidate)) {
            bestCandidate = currentCandidate;
            this.next = [currentCandidate.targetCard, currentCandidate.slotIndex];
          }

      // 比较函数（所有方案通用）
      function isBetterCandidate(candidateA, candidateB) {
        for (let i = 0; i < candidateA._getters.length; i++) {
          const valueA = candidateA._getters[i]();
          const valueB = candidateB._getters[i]();
          
          if (valueA > valueB) return true;
          else if (valueA < valueB) return false;
        }
        return false;
      }
`;
  
  fs.writeFileSync(filePath, fullCode);
  console.log(`✓ 已生成: ${filePath}`);
}

// 生成对比报告
const reportPath = path.join(outputDir, 'README.md');
const report = `# 优化算法方案

生成时间: ${new Date().toLocaleString('zh-CN')}

## 数据来源

- 总样本数: ${analysis.totalCandidates}
- WIN样本: ${analysis.winCount} (${(analysis.winCount/analysis.totalCandidates*100).toFixed(1)}%)
- LOSE样本: ${analysis.loseCount} (${(analysis.loseCount/analysis.totalCandidates*100).toFixed(1)}%)

## 方案对比

| 方案名称 | 特征数 | 需要辅助函数 | 描述 |
|---------|--------|-------------|------|
${reduction.recommendations.map(rec => {
  const code = generatedCodes[rec.name];
  return `| ${rec.name} | ${code.featureCount} | ${code.needsHelpers ? '是' : '否'} | ${rec.description} |`;
}).join('\n')}

## 使用建议

### 1. 测试顺序
建议按以下顺序测试各方案的效果：

1. **平衡方案**：先尝试此方案，观察胜率变化
2. **精简方案**：如果平衡方案效果好，可尝试更简化的版本
3. **极简方案**：最小特征集，性能最优

### 2. 实施步骤

1. 打开 \`src/components/Sort.js\`
2. 找到 \`autoCalc\` 方法中的候选评估代码
3. 替换为选定方案的代码
4. 如果方案需要辅助函数，在 \`methods\` 中添加辅助函数
5. 运行测试：\`npm run test Sort.js pass 0 -- --seed=1\`
6. 批量测试：使用测试脚本验证胜率

### 3. A/B 测试

\`\`\`bash
# 测试当前算法
node scripts/batch-test.js current 1 50

# 替换为新算法后测试
node scripts/batch-test.js optimized 1 50

# 对比结果
node scripts/compare-results.js current.json optimized.json
\`\`\`

## 特征说明

### 各方案的特征组成

${reduction.recommendations.map(rec => {
  const code = generatedCodes[rec.name];
  return `#### ${rec.name}

特征数: ${code.featureCount}

\`\`\`
${code.featureNames.join('\n')}
\`\`\`
`;
}).join('\n')}

## 注意事项

1. **备份原代码**：修改前务必备份当前的 Sort.js
2. **逐步测试**：不要一次性改动太大，先测试一个方案
3. **性能监控**：关注算法执行时间，特别是需要模拟的特征
4. **交叉验证**：在不同种子集上测试，避免过拟合

## 预期效果

根据数据分析，使用高相关性特征应该能够：
- 提高关键步骤的决策准确率
- 减少计算量（特征数减少）
- 提升整体胜率

具体提升幅度需要通过实际测试确定。
`;

fs.writeFileSync(reportPath, report);
console.log(`\n✓ 已生成对比报告: ${reportPath}`);

console.log('\n' + '='.repeat(70));
console.log('代码生成完成！');
console.log('='.repeat(70));
console.log(`\n生成的文件位于: ${outputDir}`);
console.log('\n包括:');
console.log(`  - ${reduction.recommendations.length} 个优化方案的代码`);
console.log(`  - 1 个对比报告 (README.md)`);
console.log('\n下一步:');
console.log('  1. 查看 generated-algorithms/README.md 了解各方案');
console.log('  2. 选择一个方案替换 Sort.js 中的代码');
console.log('  3. 运行 npm run test Sort.js pass 0 -- --seed=1 测试');
console.log('  4. 批量测试并对比结果');
