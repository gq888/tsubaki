// 分析丰富特征与获胜的相关性
// 包括特征重要性排名、相关性矩阵、特征组合分析
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.join(__dirname, '..', 'rich-features-data.json');

// 读取数据
if (!fs.existsSync(dataFile)) {
  console.log('❌ 数据文件不存在！');
  console.log('请先运行: node scripts/collect-rich-features.js 1 50');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

console.log('='.repeat(70));
console.log('丰富特征相关性分析');
console.log('='.repeat(70));
console.log(`加载了 ${data.length} 个种子的数据\n`);

// 收集所有候选
const allCandidates = [];
for (const seedData of data) {
  for (const stepData of seedData.criticalSteps) {
    for (const cand of stepData.candidates) {
      allCandidates.push({
        seed: seedData.seed,
        step: stepData.step,
        ...cand
      });
    }
  }
}

const winCandidates = allCandidates.filter(c => c.win);
const loseCandidates = allCandidates.filter(c => !c.win);

console.log(`总候选数: ${allCandidates.length}`);
console.log(`  WIN: ${winCandidates.length} (${(winCandidates.length/allCandidates.length*100).toFixed(1)}%)`);
console.log(`  LOSE: ${loseCandidates.length} (${(loseCandidates.length/allCandidates.length*100).toFixed(1)}%)`);
console.log(`  WIN/LOSE比率: ${(winCandidates.length/loseCandidates.length).toFixed(2)}\n`);

// 数值特征列表（排除字符串类型的emptyPerCol和元数据）
const numericFeatures = [
  'cardRank', 'cardSuit', 'cardPosition', 'slotPosition', 'slotPrevRank',
  'emptyInCardCol', 'emptyAboveCard', 'emptyBelowCard',
  'emptyInSlotCol', 'emptyAboveSlot', 'emptyBelowSlot', 'totalEmpty',
  'cardsAboveTarget', 'correctBelowSlot', 'sameRankCandidates',
  'afterMoves', 'emptyEntropy', 'restoredCards',
  'manhattanDist', 'isCrossColumn',
  'slot_score_v1', 'slot_score_v2', 'slot_score_v3'
];

// 计算特征统计
function analyzeFeature(featureName, candidates) {
  const values = candidates.map(c => c[featureName]).filter(v => v !== undefined && v !== null);
  if (values.length === 0) return null;
  
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  
  // 计算标准差
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  const std = Math.sqrt(variance);
  
  return { avg, min, max, median, std, count: values.length };
}

// 计算所有特征的相关性
console.log('='.repeat(70));
console.log('特征相关性分析');
console.log('='.repeat(70));

const correlations = [];

for (const feature of numericFeatures) {
  const winStats = analyzeFeature(feature, winCandidates);
  const loseStats = analyzeFeature(feature, loseCandidates);
  
  if (!winStats || !loseStats) continue;
  
  const diff = winStats.avg - loseStats.avg;
  const diffPercent = Math.abs(diff) / (Math.abs(loseStats.avg) + 0.001) * 100;
  
  // 计算效应量（Cohen's d）
  const pooledStd = Math.sqrt((winStats.std ** 2 + loseStats.std ** 2) / 2);
  const cohensD = pooledStd > 0 ? Math.abs(diff) / pooledStd : 0;
  
  correlations.push({
    feature,
    winAvg: winStats.avg,
    loseAvg: loseStats.avg,
    winMedian: winStats.median,
    loseMedian: loseStats.median,
    winStd: winStats.std,
    loseStd: loseStats.std,
    diff: diff,
    diffPercent: diffPercent,
    cohensD: cohensD,
    direction: diff > 0 ? 'WIN更高' : 'LOSE更高'
  });
}

// 按效应量排序（效应量比百分比更可靠）
correlations.sort((a, b) => b.cohensD - a.cohensD);

console.log('\n特征重要性排名（按Cohen\'s d效应量）\n');
console.log('排名 | 特征                | WIN平均 | LOSE平均 | 差异%  | Cohen\'s d | 方向');
console.log('-'.repeat(90));

correlations.forEach((corr, idx) => {
  console.log(
    `${(idx + 1).toString().padStart(2)}   | ` +
    `${corr.feature.padEnd(19)} | ` +
    `${corr.winAvg.toFixed(2).padStart(7)} | ` +
    `${corr.loseAvg.toFixed(2).padStart(8)} | ` +
    `${corr.diffPercent.toFixed(1).padStart(6)}% | ` +
    `${corr.cohensD.toFixed(3).padStart(10)} | ` +
    `${corr.direction}`
  );
});

// 识别高相关性特征（Cohen's d > 0.5 为中等效应，> 0.8 为大效应）
const highCorrelationFeatures = correlations.filter(c => c.cohensD > 0.3);

console.log(`\n\n高相关性特征（Cohen's d > 0.3）：${highCorrelationFeatures.length}个\n`);
highCorrelationFeatures.forEach((corr, idx) => {
  console.log(`  ${idx + 1}. ${corr.feature}: d=${corr.cohensD.toFixed(3)}, ${corr.direction}`);
});

// 特征组合分析
console.log('\n\n' + '='.repeat(70));
console.log('特征组合分析（找出同时满足的模式）');
console.log('='.repeat(70));

// 分析TOP特征的组合
const topFeatures = correlations.slice(0, 5).map(c => c.feature);
console.log(`\n分析TOP5特征的组合: ${topFeatures.join(', ')}\n`);

// 计算各种组合的WIN率
const combinations = [
  { name: '全都高于中位数', check: (c, medians) => topFeatures.every(f => c[f] >= medians[f]) },
  { name: '至少4个高于中位数', check: (c, medians) => topFeatures.filter(f => c[f] >= medians[f]).length >= 4 },
  { name: '至少3个高于中位数', check: (c, medians) => topFeatures.filter(f => c[f] >= medians[f]).length >= 3 },
];

// 计算中位数
const medians = {};
for (const feature of topFeatures) {
  const values = allCandidates.map(c => c[feature]).filter(v => v !== undefined);
  const sorted = [...values].sort((a, b) => a - b);
  medians[feature] = sorted[Math.floor(sorted.length / 2)];
}

console.log('特征中位数:');
for (const feature of topFeatures) {
  console.log(`  ${feature}: ${medians[feature].toFixed(2)}`);
}

console.log('\n组合模式的WIN率:\n');
for (const combo of combinations) {
  const matching = allCandidates.filter(c => combo.check(c, medians));
  const matchingWin = matching.filter(c => c.win).length;
  const winRate = matching.length > 0 ? (matchingWin / matching.length * 100).toFixed(1) : 0;
  console.log(`  ${combo.name}: ${matchingWin}/${matching.length} (${winRate}%)`);
}

// 详细分布分析（只分析TOP10特征）
console.log('\n\n' + '='.repeat(70));
console.log('TOP10特征的详细分布');
console.log('='.repeat(70));

for (const corr of correlations.slice(0, 10)) {
  console.log(`\n${corr.feature}:`);
  console.log(`  效应量: d=${corr.cohensD.toFixed(3)}`);
  console.log(`  WIN:  平均=${corr.winAvg.toFixed(2)}, 中位=${corr.winMedian.toFixed(2)}, 标准差=${corr.winStd.toFixed(2)}`);
  console.log(`  LOSE: 平均=${corr.loseAvg.toFixed(2)}, 中位=${corr.loseMedian.toFixed(2)}, 标准差=${corr.loseStd.toFixed(2)}`);
  
  // 计算值的分布
  const winValues = winCandidates.map(c => c[corr.feature]).filter(v => v !== undefined);
  const loseValues = loseCandidates.map(c => c[corr.feature]).filter(v => v !== undefined);
  
  const winCounts = {};
  const loseCounts = {};
  
  winValues.forEach(v => {
    const bucket = Math.floor(v);
    winCounts[bucket] = (winCounts[bucket] || 0) + 1;
  });
  loseValues.forEach(v => {
    const bucket = Math.floor(v);
    loseCounts[bucket] = (loseCounts[bucket] || 0) + 1;
  });
  
  const allBuckets = [...new Set([...Object.keys(winCounts), ...Object.keys(loseCounts)])].map(Number).sort((a, b) => a - b);
  
  if (allBuckets.length <= 15) {
    console.log(`  值分布:`);
    console.log(`    值   | WIN次数 | LOSE次数 | WIN率`);
    allBuckets.forEach(v => {
      const wc = winCounts[v] || 0;
      const lc = loseCounts[v] || 0;
      const total = wc + lc;
      const winRate = total > 0 ? (wc / total * 100).toFixed(0) : 0;
      console.log(`    ${v.toString().padStart(4)} | ${wc.toString().padStart(7)} | ${lc.toString().padStart(8)} | ${winRate.toString().padStart(4)}%`);
    });
  } else {
    console.log(`  值范围太大（${allBuckets.length}个不同值），跳过分布显示`);
  }
}

// 特征相关性矩阵（TOP10特征之间的相关性）
console.log('\n\n' + '='.repeat(70));
console.log('TOP10特征之间的相关性矩阵（Pearson相关系数）');
console.log('='.repeat(70));

const top10Features = correlations.slice(0, 10).map(c => c.feature);

// 计算Pearson相关系数
function pearsonCorrelation(values1, values2) {
  const n = values1.length;
  if (n === 0) return 0;
  
  const mean1 = values1.reduce((sum, v) => sum + v, 0) / n;
  const mean2 = values2.reduce((sum, v) => sum + v, 0) / n;
  
  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;
  
  for (let i = 0; i < n; i++) {
    const diff1 = values1[i] - mean1;
    const diff2 = values2[i] - mean2;
    numerator += diff1 * diff2;
    denom1 += diff1 * diff1;
    denom2 += diff2 * diff2;
  }
  
  const denominator = Math.sqrt(denom1 * denom2);
  return denominator === 0 ? 0 : numerator / denominator;
}

console.log('\n特征相关性矩阵（绝对值>0.7表示高度相关，可能冗余）:\n');

const correlationMatrix = [];
for (let i = 0; i < top10Features.length; i++) {
  const row = [];
  for (let j = 0; j < top10Features.length; j++) {
    if (i === j) {
      row.push('1.00');
    } else {
      const values1 = allCandidates.map(c => c[top10Features[i]]).filter(v => v !== undefined);
      const values2 = allCandidates.map(c => c[top10Features[j]]).filter(v => v !== undefined);
      const corr = pearsonCorrelation(values1, values2);
      row.push(corr.toFixed(2));
    }
  }
  correlationMatrix.push(row);
}

// 打印矩阵（简化版）
console.log('相关性>0.7的特征对（高度相关，可能冗余）:\n');
const highCorrelationPairs = [];
for (let i = 0; i < top10Features.length; i++) {
  for (let j = i + 1; j < top10Features.length; j++) {
    const corr = parseFloat(correlationMatrix[i][j]);
    if (Math.abs(corr) > 0.7) {
      highCorrelationPairs.push({
        feature1: top10Features[i],
        feature2: top10Features[j],
        correlation: corr
      });
    }
  }
}

if (highCorrelationPairs.length > 0) {
  highCorrelationPairs.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  highCorrelationPairs.forEach(pair => {
    console.log(`  ${pair.feature1} ↔ ${pair.feature2}: r=${pair.correlation.toFixed(3)}`);
  });
} else {
  console.log('  没有发现高度相关的特征对');
}

// 保存分析结果
const outputFile = path.join(__dirname, '..', 'rich-features-analysis.json');
fs.writeFileSync(outputFile, JSON.stringify({
  totalCandidates: allCandidates.length,
  winCount: winCandidates.length,
  loseCount: loseCandidates.length,
  correlations: correlations,
  highCorrelationFeatures: highCorrelationFeatures.map(c => c.feature),
  redundantPairs: highCorrelationPairs,
  topFeatures: top10Features
}, null, 2));

console.log(`\n\n${'='.repeat(70)}`);
console.log(`分析完成！报告已保存到: ${outputFile}`);
console.log('='.repeat(70));
console.log('\n关键发现摘要:');
console.log(`  1. 高相关性特征（d>0.3）: ${highCorrelationFeatures.length}个`);
console.log(`  2. 冗余特征对（r>0.7）: ${highCorrelationPairs.length}对`);
console.log(`  3. TOP5特征: ${topFeatures.join(', ')}`);
console.log('\n建议的下一步:');
console.log('  - 使用高相关性特征优化算法');
console.log('  - 移除冗余特征以降维');
console.log('  - 运行降维分析: node scripts/dimensionality-reduction.js');
