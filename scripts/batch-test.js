// 批量测试工具：测试多个种子的胜率
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const label = args[0] || 'test';
const startSeed = args[1] ? parseInt(args[1]) : 1;
const endSeed = args[2] ? parseInt(args[2]) : 20;

console.log('='.repeat(70));
console.log(`批量测试: ${label}`);
console.log('='.repeat(70));
console.log(`种子范围: ${startSeed} - ${endSeed} (共${endSeed - startSeed + 1}个)\n`);

const results = [];
let winCount = 0;
let totalSteps = 0;

for (let seed = startSeed; seed <= endSeed; seed++) {
  process.stdout.write(`[${seed}/${endSeed}] 测试中... `);
  
  try {
    const output = execSync(
      `npm run test Sort.js pass 0 -- --seed=${seed} 2>&1`,
      {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024
      }
    );
    
    const win = output.includes('"winflag": true');
    const stepsMatch = output.match(/执行了(\d+)步/);
    const steps = stepsMatch ? parseInt(stepsMatch[1]) : 0;
    
    if (win) {
      winCount++;
      console.log(`✅ WIN (${steps}步)`);
    } else {
      console.log(`❌ LOSE (${steps}步)`);
    }
    
    totalSteps += steps;
    
    results.push({
      seed,
      win,
      steps
    });
  } catch (error) {
    console.log(`❌ ERROR`);
    results.push({
      seed,
      win: false,
      steps: 0,
      error: true
    });
  }
}

const winRate = (winCount / results.length * 100).toFixed(1);
const avgSteps = (totalSteps / results.length).toFixed(1);

console.log('\n' + '='.repeat(70));
console.log('测试结果');
console.log('='.repeat(70));
console.log(`胜场: ${winCount}/${results.length} (${winRate}%)`);
console.log(`平均步数: ${avgSteps}`);

const winSeeds = results.filter(r => r.win).map(r => r.seed);
const loseSeeds = results.filter(r => !r.win).map(r => r.seed);

console.log(`\nWIN种子: ${winSeeds.join(', ')}`);
console.log(`LOSE种子: ${loseSeeds.join(', ')}`);

// 保存结果
const outputFile = path.join(__dirname, '..', `batch-test-${label}.json`);
fs.writeFileSync(outputFile, JSON.stringify({
  label,
  startSeed,
  endSeed,
  totalTests: results.length,
  winCount,
  winRate: parseFloat(winRate),
  avgSteps: parseFloat(avgSteps),
  results,
  timestamp: new Date().toISOString()
}, null, 2));

console.log(`\n结果已保存到: ${outputFile}`);
