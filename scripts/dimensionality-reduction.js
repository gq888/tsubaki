// 特征降维分析：PCA主成分分析和特征选择
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.join(__dirname, '..', 'rich-features-data.json');
const analysisFile = path.join(__dirname, '..', 'rich-features-analysis.json');

// 读取数据
if (!fs.existsSync(dataFile)) {
  console.log('❌ 数据文件不存在！');
  console.log('请先运行: node scripts/collect-rich-features.js 1 50');
  process.exit(1);
}

if (!fs.existsSync(analysisFile)) {
  console.log('❌ 分析文件不存在！');
  console.log('请先运行: node scripts/analyze-rich-features.js');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
const analysis = JSON.parse(fs.readFileSync(analysisFile, 'utf8'));

console.log('='.repeat(70));
console.log('特征降维分析');
console.log('='.repeat(70));

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

console.log(`样本数: ${allCandidates.length}\n`);

// 数值特征列表
const numericFeatures = [
  'cardRank', 'cardSuit', 'cardPosition', 'slotPosition', 'slotPrevRank',
  'emptyInCardCol', 'emptyAboveCard', 'emptyBelowCard',
  'emptyInSlotCol', 'emptyAboveSlot', 'emptyBelowSlot', 'totalEmpty',
  'cardsAboveTarget', 'correctBelowSlot', 'sameRankCandidates',
  'afterMoves', 'emptyEntropy', 'restoredCards',
  'manhattanDist', 'isCrossColumn',
  'slot_score_v1', 'slot_score_v2', 'slot_score_v3'
];

// 1. 基于相关性的特征选择
console.log('='.repeat(70));
console.log('方法1: 基于相关性的特征选择');
console.log('='.repeat(70));

console.log('\n策略: 移除冗余特征（与其他特征高度相关的特征）\n');

const redundantPairs = analysis.redundantPairs || [];
const redundantFeatures = new Set();

// 对于每对冗余特征，保留效应量更大的那个
for (const pair of redundantPairs) {
  const corr1 = analysis.correlations.find(c => c.feature === pair.feature1);
  const corr2 = analysis.correlations.find(c => c.feature === pair.feature2);
  
  if (corr1 && corr2) {
    const toRemove = corr1.cohensD >= corr2.cohensD ? pair.feature2 : pair.feature1;
    redundantFeatures.add(toRemove);
    console.log(`  移除 ${toRemove} (与 ${corr1.cohensD >= corr2.cohensD ? pair.feature1 : pair.feature2} 冗余, r=${pair.correlation.toFixed(3)})`);
  }
}

const nonRedundantFeatures = numericFeatures.filter(f => !redundantFeatures.has(f));
console.log(`\n降维结果: ${numericFeatures.length} → ${nonRedundantFeatures.length} 特征`);
console.log(`移除了 ${redundantFeatures.size} 个冗余特征\n`);

// 2. 基于效应量的特征选择
console.log('='.repeat(70));
console.log('方法2: 基于效应量的特征选择');
console.log('='.repeat(70));

console.log('\n策略: 只保留效应量显著的特征（Cohen\'s d > 阈值）\n');

const thresholds = [0.2, 0.3, 0.5];
for (const threshold of thresholds) {
  const significantFeatures = analysis.correlations.filter(c => c.cohensD > threshold).map(c => c.feature);
  console.log(`  Cohen's d > ${threshold}: ${significantFeatures.length}个特征`);
  if (significantFeatures.length <= 10) {
    console.log(`    ${significantFeatures.join(', ')}`);
  }
}

const recommendedThreshold = 0.3;
const significantFeatures = analysis.correlations.filter(c => c.cohensD > recommendedThreshold).map(c => c.feature);
console.log(`\n推荐阈值: Cohen's d > ${recommendedThreshold}`);
console.log(`降维结果: ${numericFeatures.length} → ${significantFeatures.length} 特征\n`);

// 3. 组合方法：移除冗余 + 保留显著
console.log('='.repeat(70));
console.log('方法3: 组合方法（推荐）');
console.log('='.repeat(70));

console.log('\n策略: 移除冗余特征 + 只保留效应量显著的特征\n');

const finalFeatures = nonRedundantFeatures.filter(f => {
  const corr = analysis.correlations.find(c => c.feature === f);
  return corr && corr.cohensD > recommendedThreshold;
});

console.log(`降维结果: ${numericFeatures.length} → ${finalFeatures.length} 特征`);
console.log(`\n最终特征集:`);
finalFeatures.forEach((f, idx) => {
  const corr = analysis.correlations.find(c => c.feature === f);
  console.log(`  ${idx + 1}. ${f}: d=${corr.cohensD.toFixed(3)}, ${corr.direction}`);
});

// 4. 简化的PCA分析（计算方差解释比例）
console.log('\n\n' + '='.repeat(70));
console.log('方法4: 简化PCA分析（方差贡献度）');
console.log('='.repeat(70));

console.log('\n计算每个特征的方差贡献度...\n');

// 标准化数据并计算方差
const featureVariances = [];
for (const feature of numericFeatures) {
  const values = allCandidates.map(c => c[feature]).filter(v => v !== undefined && !isNaN(v));
  if (values.length === 0) continue;
  
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  
  featureVariances.push({
    feature,
    variance,
    std: Math.sqrt(variance)
  });
}

featureVariances.sort((a, b) => b.variance - a.variance);

const totalVariance = featureVariances.reduce((sum, fv) => sum + fv.variance, 0);

console.log('特征方差贡献度（前15个）:\n');
console.log('排名 | 特征                | 方差     | 标准差   | 贡献%');
console.log('-'.repeat(70));

let cumulativePercent = 0;
featureVariances.slice(0, 15).forEach((fv, idx) => {
  const percent = (fv.variance / totalVariance * 100);
  cumulativePercent += percent;
  console.log(
    `${(idx + 1).toString().padStart(2)}   | ` +
    `${fv.feature.padEnd(19)} | ` +
    `${fv.variance.toFixed(4).padStart(8)} | ` +
    `${fv.std.toFixed(4).padStart(8)} | ` +
    `${percent.toFixed(2).padStart(6)}% (累计${cumulativePercent.toFixed(1)}%)`
  );
});

console.log(`\n解释: 方差大的特征信息量更丰富，但不一定与目标相关`);

// 5. 综合评分：效应量 × 方差
console.log('\n\n' + '='.repeat(70));
console.log('方法5: 综合评分（推荐用于特征选择）');
console.log('='.repeat(70));

console.log('\n策略: 综合评分 = Cohen\'s d × 归一化方差\n');

const combinedScores = [];
const maxVariance = Math.max(...featureVariances.map(fv => fv.variance));

for (const corr of analysis.correlations) {
  const fv = featureVariances.find(f => f.feature === corr.feature);
  if (!fv) continue;
  
  const normalizedVariance = fv.variance / maxVariance;
  const combinedScore = corr.cohensD * normalizedVariance;
  
  combinedScores.push({
    feature: corr.feature,
    cohensD: corr.cohensD,
    variance: fv.variance,
    normalizedVariance,
    combinedScore,
    direction: corr.direction
  });
}

combinedScores.sort((a, b) => b.combinedScore - a.combinedScore);

console.log('综合评分排名（前15个）:\n');
console.log('排名 | 特征                | Cohen\'s d | 归一化方差 | 综合评分 | 方向');
console.log('-'.repeat(90));

combinedScores.slice(0, 15).forEach((cs, idx) => {
  console.log(
    `${(idx + 1).toString().padStart(2)}   | ` +
    `${cs.feature.padEnd(19)} | ` +
    `${cs.cohensD.toFixed(3).padStart(10)} | ` +
    `${cs.normalizedVariance.toFixed(3).padStart(11)} | ` +
    `${cs.combinedScore.toFixed(3).padStart(9)} | ` +
    `${cs.direction}`
  );
});

// 选择TOP-K特征
const topKOptions = [5, 8, 10];
console.log('\n\n不同K值的特征选择:\n');

for (const k of topKOptions) {
  const topK = combinedScores.slice(0, k).map(cs => cs.feature);
  console.log(`TOP-${k}: ${topK.join(', ')}`);
}

// 生成降维建议
console.log('\n\n' + '='.repeat(70));
console.log('降维建议总结');
console.log('='.repeat(70));

const recommendations = [
  {
    name: '保守方案',
    features: nonRedundantFeatures,
    description: '移除冗余特征，保留所有独立特征'
  },
  {
    name: '激进方案',
    features: significantFeatures,
    description: `只保留效应量显著的特征（Cohen's d > ${recommendedThreshold}）`
  },
  {
    name: '平衡方案（推荐）',
    features: finalFeatures,
    description: '移除冗余 + 只保留显著特征'
  },
  {
    name: '精简方案',
    features: combinedScores.slice(0, 8).map(cs => cs.feature),
    description: '基于综合评分的TOP-8特征'
  },
  {
    name: '极简方案',
    features: combinedScores.slice(0, 5).map(cs => cs.feature),
    description: '基于综合评分的TOP-5特征'
  }
];

console.log('\n');
recommendations.forEach((rec, idx) => {
  console.log(`${idx + 1}. ${rec.name} (${rec.features.length}个特征)`);
  console.log(`   描述: ${rec.description}`);
  console.log(`   特征: ${rec.features.join(', ')}`);
  console.log('');
});

// 保存降维结果
const outputFile = path.join(__dirname, '..', 'dimensionality-reduction-result.json');
fs.writeFileSync(outputFile, JSON.stringify({
  original: numericFeatures,
  recommendations: recommendations,
  combinedScores: combinedScores,
  redundantFeatures: Array.from(redundantFeatures)
}, null, 2));

console.log('='.repeat(70));
console.log(`降维分析完成！结果已保存到: ${outputFile}`);
console.log('='.repeat(70));
console.log('\n建议实施步骤:');
console.log('  1. 先尝试"平衡方案"，观察胜率变化');
console.log('  2. 如果效果好，再尝试"精简方案"');
console.log('  3. 使用 node scripts/generate-optimized-algorithm.js 生成优化代码');
