// 监控数据收集进度
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logFile = path.join(__dirname, '..', 'collection-log.txt');
const dataFile = path.join(__dirname, '..', 'rich-features-data.json');

console.log('='.repeat(70));
console.log('数据收集进度监控');
console.log('='.repeat(70));

// 读取日志文件
if (fs.existsSync(logFile)) {
  const log = fs.readFileSync(logFile, 'utf8');
  
  // 提取关键信息
  const seedMatches = log.match(/\[(\d+)\]/g);
  const processedSeeds = seedMatches ? new Set(seedMatches.map(m => m.match(/\d+/)[0])) : new Set();
  
  const successCount = (log.match(/✅ 自动成功/g) || []).length;
  const failCount = (log.match(/❌ 自动失败/g) || []).length;
  const criticalCount = (log.match(/🎯/g) || []).length;
  const foundCaseCount = (log.match(/✓ 找到\d+个关键步骤/g) || []).length;
  
  console.log(`\n已处理种子数: ${processedSeeds.size}`);
  console.log(`  自动成功: ${successCount}`);
  console.log(`  自动失败: ${failCount}`);
  console.log(`  找到关键步骤: ${criticalCount}个`);
  console.log(`  有效案例: ${foundCaseCount}个\n`);
  
  // 显示最近几行
  const lines = log.split('\n').filter(l => l.trim());
  const recentLines = lines.slice(-10);
  console.log('最近10行日志:');
  recentLines.forEach(line => console.log(`  ${line}`));
}

// 检查数据文件
if (fs.existsSync(dataFile)) {
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  const totalSteps = data.reduce((sum, d) => sum + d.criticalSteps.length, 0);
  const totalCandidates = data.reduce((sum, d) => 
    sum + d.criticalSteps.reduce((s, step) => s + step.candidates.length, 0), 0
  );
  
  console.log(`\n\n当前数据文件统计:`);
  console.log(`  种子数: ${data.length}`);
  console.log(`  关键步骤: ${totalSteps}个`);
  console.log(`  候选样本: ${totalCandidates}个`);
} else {
  console.log('\n数据文件尚未生成');
}

console.log('\n' + '='.repeat(70));
console.log('提示: 数据收集完成后运行分析脚本');
console.log('  node scripts/analyze-rich-features.js');
console.log('='.repeat(70));
