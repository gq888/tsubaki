#!/usr/bin/env node

/**
 * 自动化测试脚本：为所有游戏找到最佳种子
 * 目标：找到能获胜且stepFn次数最少但不少于3次的种子
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 所有游戏组件
const GAMES = [
  // 'Chess.js',
  // 'sum.js',÷\
  // 'point24.js',
  // 'fish.js',
  'Spider.js',
  // 'Tortoise.js',
  // 'Sort.js',
  // 'Pairs.js',
  // 'month.js'
];

// 游戏显示名称映射
const GAME_NAMES = {
  'Chess.js': 'GridBattle (棋盘)',
  'sum.js': 'Sum (和数)',
  'point24.js': 'Point24 (24点)',
  'fish.js': 'Fish (钓鱼)',
  'Spider.js': 'Spider (蜘蛛纸牌)',
  'Tortoise.js': 'Tortoise (龟兔赛跑)',
  'Sort.js': 'Sort (排序)',
  'Pairs.js': 'Pairs (配对)',
  'month.js': 'Month (月份)'
};

// 测试配置
const DDFAULT_START_SEED = 100; // 默认起始种子
const DEFAULT_MAX_SEEDS = 200; // 默认最大种子数量
const EXTENDED_MAX_SEEDS = 500; // 扩展搜索时的最大种子数量
const FIND_MIN_STEPS = 3; // 找到的种子必须执行的最小步数
const IS_FIND_MIN = true; // 是否找最小步数

/**
 * 执行测试命令并解析结果
 * @returns {{testResult: object, steps: number}|null}
 */
function runTest(game, seed) {
  try {
    // 使用pass方法运行游戏直到结束（pass内部调用startAuto）
    const cmd = `npm run test ${game} pass -- --seed=${seed} 2>&1`;
    const output = execSync(cmd, {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024 // 50MB buffer
    });
    
    // 提取步数：查找 "自动模式结束，总共执行了X步"
    const stepMatch = output.match(/自动模式结束，总共执行了(\d+)步/);
    const steps = stepMatch ? parseInt(stepMatch[1], 10) : 0;
    
    // 查找JSON输出（最后一个大括号结束的部分）
    const lines = output.split('\n');
    let jsonStart = -1;
    let braceCount = 0;
    let inJson = false;
    
    // 从后往前找JSON
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line === '}' && !inJson) {
        inJson = true;
        braceCount = 1;
        jsonStart = i;
      } else if (inJson) {
        for (const char of line) {
          if (char === '{') braceCount--;
          else if (char === '}') braceCount++;
        }
        if (braceCount === 0) {
          // 找到完整的JSON
          const jsonStr = lines.slice(i, jsonStart + 1).join('\n');
          try {
            const testResult = JSON.parse(jsonStr);
            return { testResult, steps };
          } catch (e) {
            // JSON解析失败，继续向前查找
            inJson = false;
            braceCount = 0;
            jsonStart = -1;
          }
        }
      }
    }
    
    console.error(`  ⚠️  无法解析种子 ${seed} 的输出`);
    return null;
  } catch (error) {
    console.error(`  ❌ 种子 ${seed} 执行出错: ${error.message}`);
    return null;
  }
}

const find_max_steps = (a, b) => b.steps - a.steps;
const find_min_steps = (a, b) => a.steps - b.steps;

/**
 * 为单个游戏查找最佳种子
 */
function findBestSeed(game, maxSeeds = DEFAULT_MAX_SEEDS, startSeed = DDFAULT_START_SEED) {
  console.log(`\n🎮 测试游戏: ${GAME_NAMES[game]}`);
  console.log(`   搜索范围: 1-${maxSeeds}`);
  
  const results = {
    win: [],
    lose: [],
    draw: []
  };
  
  // 测试所有种子
  for (let seed = startSeed; seed <= maxSeeds; seed++) {
    if (seed % 10 === 0) {
      process.stdout.write(`\r   进度: ${seed}/${maxSeeds}`);
    }
    
    const result = runTest(game, seed);
    if (!result) continue;
    
    const { testResult, steps: extractedSteps } = result;
    if (!testResult || !testResult.after) continue;
    
    // 从gameManager中获取标志位
    const gameManager = testResult.after.gameManager;
    if (!gameManager) continue;
    
    const { winflag, loseflag, drawflag } = gameManager;
    
    // 使用从console输出提取的步数
    const steps = extractedSteps;
    
    // 确定游戏结果
    let gameResult = '';
    if (winflag) gameResult = 'win';
    else if (loseflag) gameResult = 'lose';
    else if (drawflag) gameResult = 'draw';
    
    // 只关心步数>=3且游戏已结束的结果
    if (steps < FIND_MIN_STEPS || !gameResult) continue;
    
    const resultData = {
      seed,
      steps: steps,
      result: gameResult
    };
    
    if (gameResult === 'win') {
      results.win.push(resultData);
    } else if (gameResult === 'lose') {
      results.lose.push(resultData);
    } else if (gameResult === 'draw') {
      results.draw.push(resultData);
    }
  }
  
  console.log('\r   进度: 完成' + ' '.repeat(20));
  
  // 选择最佳种子：优先win，其次lose，最后draw
  let bestSeed = null;
  
  if (results.win.length > 0) {
    // 找步数最少的win种子
    results.win.sort(IS_FIND_MIN ? find_min_steps : find_max_steps);
    bestSeed = results.win[0];
    console.log(`   ✅ 找到 ${results.win.length} 个获胜种子，最佳: 种子=${bestSeed.seed}, 步数=${bestSeed.steps}`);
  } else if (results.lose.length > 0) {
    // 找步数最少的lose种子
    results.lose.sort(IS_FIND_MIN ? find_min_steps : find_max_steps);
    bestSeed = results.lose[0];
    console.log(`   ⚠️  无获胜种子，找到 ${results.lose.length} 个失败种子，最佳: 种子=${bestSeed.seed}, 步数=${bestSeed.steps}`);
  } else if (results.draw.length > 0) {
    // 找步数最少的draw种子
    results.draw.sort(IS_FIND_MIN ? find_min_steps : find_max_steps);
    bestSeed = results.draw[0];
    console.log(`   ⚠️  无获胜/失败种子，找到 ${results.draw.length} 个平局种子，最佳: 种子=${bestSeed.seed}, 步数=${bestSeed.steps}`);
  } else {
    console.log(`   ❌ 未找到任何有效种子（步数>=3）`);
  }
  
  return bestSeed;
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始为所有游戏查找最佳种子...\n');
  console.log('='  .repeat(60));
  
  const allResults = [];
  const failedGames = [];
  
  // 第一轮：默认种子数量测试
  for (const game of GAMES) {
    const bestSeed = findBestSeed(game, DEFAULT_MAX_SEEDS);
    
    if (bestSeed) {
      allResults.push({
        game,
        name: GAME_NAMES[game],
        ...bestSeed
      });
    } else {
      failedGames.push(game);
    }
  }
  
  // 第二轮：扩展搜索失败的游戏
  if (failedGames.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log(`\n🔍 扩展搜索 ${failedGames.length} 个未找到种子的游戏...`);
    
    for (const game of failedGames) {
      const bestSeed = findBestSeed(game, EXTENDED_MAX_SEEDS);
      
      if (bestSeed) {
        allResults.push({
          game,
          name: GAME_NAMES[game],
          ...bestSeed
        });
      }
    }
  }
  
  // 按步数排序
  allResults.sort((a, b) => a.steps - b.steps);
  
  // 输出最终结果
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 最终结果（按步数排序）:\n');
  
  if (allResults.length === 0) {
    console.log('❌ 未找到任何游戏的有效种子');
    return;
  }
  
  console.log('排名 | 游戏名称              | 种子   | 步数 | 结果');
  console.log('-----|----------------------|--------|------|------');
  
  allResults.forEach((result, index) => {
    const rank = String(index + 1).padStart(4);
    const name = result.name.padEnd(20);
    const seed = String(result.seed).padStart(6);
    const steps = String(result.steps).padStart(4);
    const resultIcon = result.result === 'win' ? '✅' : result.result === 'lose' ? '⚠️' : '➖';
    
    console.log(`${rank} | ${name} | ${seed} | ${steps} | ${resultIcon} ${result.result}`);
  });
  
  // 统计信息
  const winCount = allResults.filter(r => r.result === 'win').length;
  const loseCount = allResults.filter(r => r.result === 'lose').length;
  const drawCount = allResults.filter(r => r.result === 'draw').length;
  const excludedCount = GAMES.length - allResults.length;
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n📈 统计:`);
  console.log(`   总游戏数: ${GAMES.length}`);
  console.log(`   找到种子: ${allResults.length}`);
  console.log(`   - 获胜: ${winCount}`);
  console.log(`   - 失败: ${loseCount}`);
  console.log(`   - 平局: ${drawCount}`);
  if (excludedCount > 0) {
    console.log(`   - 排除: ${excludedCount}`);
  }
  
  console.log('\n✅ 测试完成！');
}

main().catch(console.error);
