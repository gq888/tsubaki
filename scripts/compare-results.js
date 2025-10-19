// 对比两次测试结果的工具
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('用法: node scripts/compare-results.js <结果文件1> <结果文件2>');
  console.log('示例: node scripts/compare-results.js batch-test-baseline.json batch-test-optimized.json');
  process.exit(1);
}

const file1 = path.join(__dirname, '..', args[0]);
const file2 = path.join(__dirname, '..', args[1]);

if (!fs.existsSync(file1)) {
  console.log(`❌ 文件不存在: ${file1}`);
  process.exit(1);
}

if (!fs.existsSync(file2)) {
  console.log(`❌ 文件不存在: ${file2}`);
  process.exit(1);
}

const result1 = JSON.parse(fs.readFileSync(file1, 'utf8'));
const result2 = JSON.parse(fs.readFileSync(file2, 'utf8'));

console.log('='.repeat(70));
console.log('测试结果对比');
console.log('='.repeat(70));

console.log(`\n【${result1.label}】vs 【${result2.label}】\n`);

console.log('总体统计:');
console.log(`  ${result1.label.padEnd(20)} | 胜率: ${result1.winRate.toFixed(1)}% | 平均步数: ${result1.avgSteps.toFixed(1)}`);
console.log(`  ${result2.label.padEnd(20)} | 胜率: ${result2.winRate.toFixed(1)}% | 平均步数: ${result2.avgSteps.toFixed(1)}`);

const winRateDiff = result2.winRate - result1.winRate;
const stepsDiff = result2.avgSteps - result1.avgSteps;

console.log(`\n差异:`);
console.log(`  胜率: ${winRateDiff > 0 ? '+' : ''}${winRateDiff.toFixed(1)}%`);
console.log(`  平均步数: ${stepsDiff > 0 ? '+' : ''}${stepsDiff.toFixed(1)}`);

// 找出改变的种子
const seedMap1 = new Map(result1.results.map(r => [r.seed, r]));
const seedMap2 = new Map(result2.results.map(r => [r.seed, r]));

const improved = []; // LOSE → WIN
const worsened = []; // WIN → LOSE
const unchanged = [];

for (const [seed, r2] of seedMap2) {
  const r1 = seedMap1.get(seed);
  if (!r1) continue;
  
  if (!r1.win && r2.win) {
    improved.push(seed);
  } else if (r1.win && !r2.win) {
    worsened.push(seed);
  } else {
    unchanged.push(seed);
  }
}

console.log(`\n种子变化:`);
console.log(`  改进 (LOSE→WIN): ${improved.length}个`);
if (improved.length > 0 && improved.length <= 20) {
  console.log(`    ${improved.join(', ')}`);
}
console.log(`  恶化 (WIN→LOSE): ${worsened.length}个`);
if (worsened.length > 0 && worsened.length <= 20) {
  console.log(`    ${worsened.join(', ')}`);
}
console.log(`  不变: ${unchanged.length}个`);

// 净改进
const netImprovement = improved.length - worsened.length;
console.log(`\n净改进: ${netImprovement > 0 ? '+' : ''}${netImprovement}场`);

// 统计显著性（简化版卡方检验）
const n1 = result1.totalTests;
const n2 = result2.totalTests;
const w1 = result1.winCount;
const w2 = result2.winCount;

if (n1 === n2) {
  // McNemar检验（配对数据）
  const b = improved.length; // LOSE → WIN
  const c = worsened.length; // WIN → LOSE
  
  if (b + c > 0) {
    const chi2 = Math.pow(Math.abs(b - c) - 1, 2) / (b + c);
    const pValue = chi2 > 3.841 ? '< 0.05 (显著)' : '≥ 0.05 (不显著)';
    
    console.log(`\nMcNemar检验:`);
    console.log(`  χ² = ${chi2.toFixed(3)}`);
    console.log(`  p-value ${pValue}`);
  }
}

// 步数对比（只对比都完成的种子）
const completedSeeds = [];
for (const [seed, r1] of seedMap1) {
  const r2 = seedMap2.get(seed);
  if (r1 && r2 && r1.steps > 0 && r2.steps > 0) {
    completedSeeds.push({
      seed,
      steps1: r1.steps,
      steps2: r2.steps,
      diff: r2.steps - r1.steps
    });
  }
}

if (completedSeeds.length > 0) {
  const avgDiff = completedSeeds.reduce((sum, s) => sum + s.diff, 0) / completedSeeds.length;
  console.log(`\n步数对比（${completedSeeds.length}个共同完成的种子）:`);
  console.log(`  平均差异: ${avgDiff > 0 ? '+' : ''}${avgDiff.toFixed(1)}步`);
  
  const fasterCount = completedSeeds.filter(s => s.diff < 0).length;
  const slowerCount = completedSeeds.filter(s => s.diff > 0).length;
  console.log(`  更快: ${fasterCount}个, 更慢: ${slowerCount}个`);
}

// 结论
console.log(`\n${'='.repeat(70)}`);
console.log('结论');
console.log('='.repeat(70));

if (winRateDiff > 5) {
  console.log(`✅ 显著改进！胜率提升${winRateDiff.toFixed(1)}%`);
} else if (winRateDiff > 0) {
  console.log(`✓ 轻微改进，胜率提升${winRateDiff.toFixed(1)}%`);
} else if (winRateDiff === 0) {
  console.log(`→ 胜率持平`);
} else if (winRateDiff > -5) {
  console.log(`⚠ 轻微下降，胜率降低${Math.abs(winRateDiff).toFixed(1)}%`);
} else {
  console.log(`❌ 显著下降！胜率降低${Math.abs(winRateDiff).toFixed(1)}%`);
}

// 保存对比报告
const reportFile = path.join(__dirname, '..', `comparison-${result1.label}-vs-${result2.label}.json`);
fs.writeFileSync(reportFile, JSON.stringify({
  baseline: result1.label,
  optimized: result2.label,
  winRateDiff,
  stepsDiff,
  improved,
  worsened,
  netImprovement,
  timestamp: new Date().toISOString()
}, null, 2));

console.log(`\n对比报告已保存到: ${reportFile}`);
