// 大规模收集候选的丰富特征数据
// 包括空位分布、牌堆状态、路径长度等多维特征
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const statePath = path.join(__dirname, '..', '.last-test-state.json');

// 计算丰富的特征集
function extractRichFeatures(state, candidate) {
  const cards1 = state.cards1;
  const matchMode = state.matchMode;
  const number = state.number;
  const slotIdx = candidate.slotIdx;
  const card = candidate.card;
  const cardIdx = cards1.indexOf(card);
  
  // 基础特征
  const cardRank = card >> 2;
  const cardSuit = card % 4;
  const cardPosition = cardIdx % (number + 1);
  const slotPosition = slotIdx % (number + 1);
  const prevCard = slotIdx > 0 ? cards1[slotIdx - 1] : -1;
  const slotPrevRank = prevCard >= 0 ? (prevCard >> 2) : -1;
  
  // === 空位相关特征 ===
  // 1. 卡片列中的空位数量
  const cardCol = Math.floor(cardIdx / (number + 1));
  const cardColStart = cardCol * (number + 1);
  const cardColEnd = cardColStart + number + 1;
  let emptyInCardCol = 0;
  let emptyAboveCard = 0;
  let emptyBelowCard = 0;
  for (let i = cardColStart; i < cardColEnd; i++) {
    if (cards1[i] < 0) {
      emptyInCardCol++;
      if (i < cardIdx) emptyBelowCard++;
      if (i > cardIdx) emptyAboveCard++;
    }
  }
  
  // 2. 目标空位列中的空位数量
  const slotCol = Math.floor(slotIdx / (number + 1));
  const slotColStart = slotCol * (number + 1);
  const slotColEnd = slotColStart + number + 1;
  let emptyInSlotCol = 0;
  let emptyAboveSlot = 0;
  let emptyBelowSlot = 0;
  for (let i = slotColStart; i < slotColEnd; i++) {
    if (cards1[i] < 0) {
      emptyInSlotCol++;
      if (i < slotIdx) emptyBelowSlot++;
      if (i > slotIdx) emptyAboveSlot++;
    }
  }
  
  // 3. 全局空位分布
  let totalEmpty = 0;
  const emptyPerCol = [0, 0, 0, 0];
  for (let i = 0; i < cards1.length; i++) {
    if (cards1[i] < 0) {
      totalEmpty++;
      const col = Math.floor(i / (number + 1));
      emptyPerCol[col]++;
    }
  }
  
  // === 牌堆状态特征 ===
  // 4. 卡片上方的压牌数量
  let cardsAboveTarget = 0;
  for (let i = cardIdx + 1; i < cardColEnd; i++) {
    if (cards1[i] >= 0) cardsAboveTarget++;
  }
  
  // 5. 空位下方的正确牌数量（已经就位的牌）
  let correctBelowSlot = 0;
  for (let i = slotColStart; i < slotIdx; i++) {
    const c = cards1[i];
    if (c < 0) break; // 遇到空位就停止
    const cRank = c >> 2;
    const cSuit = c % 4;
    const expectedRank = number - 1 - (i % (number + 1));
    if ((cSuit % matchMode) === (slotCol % matchMode) && cRank === expectedRank) {
      correctBelowSlot++;
    } else {
      break;
    }
  }
  
  // 6. 该rank的其他候选位置数（同rank其他花色）
  let sameRankCandidates = 0;
  const targetRank = slotPrevRank - 1;
  if (targetRank >= 0) {
    const cardGroup = prevCard % matchMode;
    for (let suit = cardGroup; suit < 4; suit += matchMode) {
      const otherCard = targetRank * 4 + suit;
      if (otherCard === card) continue;
      const otherIdx = cards1.indexOf(otherCard);
      if (otherIdx >= 0 && otherIdx + 1 < cards1.length && cards1[otherIdx + 1] < 0) {
        sameRankCandidates++;
      }
    }
  }
  
  // === 移动后状态特征 ===
  // 7. 模拟移动，计算移动后的特征
  const simCards = [...cards1];
  const nextSlotId = simCards[cardIdx + 1];
  simCards[cardIdx] = nextSlotId;
  simCards[slotIdx] = card;
  
  // 7a. 移动后可移动数
  let afterMoves = 0;
  for (let i = 0; i < simCards.length; i++) {
    if (simCards[i] >= 0) continue;
    const prev = i > 0 ? simCards[i - 1] : null;
    if (prev === null || prev < 0) continue;
    const pRank = prev >> 2;
    const tRank = pRank - 1;
    if (tRank < 0) continue;
    const cg = prev % matchMode;
    for (let s = cg; s < 4; s += matchMode) {
      const tc = tRank * 4 + s;
      const ci = simCards.indexOf(tc);
      if (ci >= 0 && ci + 1 < simCards.length && simCards[ci + 1] < 0) {
        afterMoves++;
      }
    }
  }
  
  // 7b. 移动后的空位分布熵（衡量空位分散程度）
  const afterEmptyPerCol = [0, 0, 0, 0];
  let afterTotalEmpty = 0;
  for (let i = 0; i < simCards.length; i++) {
    if (simCards[i] < 0) {
      afterTotalEmpty++;
      const col = Math.floor(i / (number + 1));
      afterEmptyPerCol[col]++;
    }
  }
  let emptyEntropy = 0;
  for (let count of afterEmptyPerCol) {
    if (count > 0 && afterTotalEmpty > 0) {
      const p = count / afterTotalEmpty;
      emptyEntropy -= p * Math.log2(p);
    }
  }
  
  // 7c. 移动后已就位的牌数量
  let restoredCards = 0;
  for (let rank = number - 1; rank >= 0; rank--) {
    for (let suit = 0; suit < 4; suit++) {
      const c = rank * 4 + suit;
      const idx = simCards.indexOf(c);
      if (idx < 0) continue;
      
      const targetGroup = suit % matchMode;
      const colStart = targetGroup * (number + 1);
      const expectedPos = colStart + (number - 1 - rank);
      
      if (idx === expectedPos) {
        // 检查下方是否都正确
        let allCorrect = true;
        for (let checkRank = rank + 1; checkRank < number; checkRank++) {
          const checkPos = colStart + (number - 1 - checkRank);
          const cardAt = simCards[checkPos];
          if (cardAt < 0 || (cardAt >> 2) !== checkRank) {
            allCorrect = false;
            break;
          }
        }
        if (allCorrect) restoredCards++;
      }
    }
  }
  
  // === 路径和距离特征 ===
  // 8. 卡片到目标位置的"曼哈顿距离"
  const cardRow = cardPosition;
  const cardColNum = cardCol;
  const targetGroup = cardSuit % matchMode;
  const targetRow = number - 1 - cardRank;
  const targetColNum = targetGroup;
  const manhattanDist = Math.abs(cardRow - targetRow) + Math.abs(cardColNum - targetColNum);
  
  // 9. 是否跨列移动
  const isCrossColumn = (cardCol !== slotCol) ? 1 : 0;
  
  // === 组合特征 ===
  // 10. slot_score的几种不同计算方式
  const slot_score_v1 = (number - slotPosition) * 10 + slotPrevRank; // 原版本
  const slot_score_v2 = slotPrevRank * 10 - slotPosition; // 用户的新版本
  const slot_score_v3 = slotPrevRank * emptyBelowSlot; // rank × 下方空位
  
  return {
    // 基础特征
    cardRank,
    cardSuit,
    cardPosition,
    slotPosition,
    slotPrevRank,
    
    // 空位分布特征
    emptyInCardCol,
    emptyAboveCard,
    emptyBelowCard,
    emptyInSlotCol,
    emptyAboveSlot,
    emptyBelowSlot,
    totalEmpty,
    emptyPerCol: emptyPerCol.join(','),
    
    // 牌堆状态特征
    cardsAboveTarget,
    correctBelowSlot,
    sameRankCandidates,
    
    // 移动后状态特征
    afterMoves,
    emptyEntropy,
    restoredCards,
    
    // 距离特征
    manhattanDist,
    isCrossColumn,
    
    // 组合特征
    slot_score_v1,
    slot_score_v2,
    slot_score_v3,
    
    // 元数据
    card,
    slotIdx,
    cardIdx
  };
}

// 获取所有候选及其特征
function getAllCandidatesWithFeatures(state) {
  const cards1 = state.cards1;
  const matchMode = state.matchMode;
  const number = state.number;
  const candidates = [];
  
  for (let slotIdx = 0; slotIdx < cards1.length; slotIdx++) {
    if (cards1[slotIdx] >= 0) continue;
    
    const prevCard = slotIdx > 0 ? cards1[slotIdx - 1] : null;
    if (prevCard === null || prevCard < 0) continue;
    
    const prevRank = prevCard >> 2;
    const targetRank = prevRank - 1;
    if (targetRank < 0) continue;
    
    const cardGroup = prevCard % matchMode;
    for (let suit = cardGroup; suit < 4; suit += matchMode) {
      const targetCard = targetRank * 4 + suit;
      const cardIdx = cards1.indexOf(targetCard);
      
      if (cardIdx >= 0 && cardIdx + 1 < cards1.length && cards1[cardIdx + 1] < 0) {
        const features = extractRichFeatures(state, {
          card: targetCard,
          slotIdx: slotIdx,
          cardIdx: cardIdx
        });
        candidates.push(features);
      }
    }
  }
  
  return candidates;
}

// 测试一个候选是否获胜
function testCandidateWin(seed, upToStep, candidate) {
  execSync(`npm run test Sort.js init -- --seed=${seed} 2>&1 > /dev/null`, {
    cwd: path.join(__dirname, '..')
  });
  
  for (let i = 0; i < upToStep; i++) {
    execSync(`npm run test -- Sort.js stepFn --continue 2>&1 > /dev/null`, {
      cwd: path.join(__dirname, '..')
    });
  }
  
  // 执行这个候选
  execSync(`npm run test -- Sort.js clickSign ${candidate.slotIdx} --continue 2>&1 > /dev/null`, {
    cwd: path.join(__dirname, '..')
  });
  
  execSync(`npm run test -- Sort.js clickCard ${candidate.card} --continue 2>&1 > /dev/null`, {
    cwd: path.join(__dirname, '..')
  });
  
  // 继续自动运行
  const result = execSync(`npm run test -- Sort.js pass --continue 2>&1`, {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024
  });
  
  return result.includes('"winflag": true');
}

// 分析一个种子的关键错误步骤
function analyzeSeed(seed, maxSteps = 20) {
  console.log(`[${seed}] 分析中...`);
  
  // 自动运行
  const autoResult = execSync(`npm run test Sort.js pass 0 -- --seed=${seed} 2>&1`, {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024
  });
  
  const autoWin = autoResult.includes('"winflag": true');
  if (autoWin) {
    console.log(`[${seed}] ✅ 自动成功，跳过`);
    return null;
  }
  
  const autoStepsMatch = autoResult.match(/执行了(\d+)步/);
  const autoSteps = autoStepsMatch ? parseInt(autoStepsMatch[1]) : 0;
  
  console.log(`[${seed}] ❌ 自动失败: ${autoSteps}步，逐步分析...`);
  
  const criticalSteps = [];
  
  // 逐步测试
  for (let step = 0; step < Math.min(maxSteps, autoSteps); step++) {
    execSync(`npm run test Sort.js init -- --seed=${seed} 2>&1 > /dev/null`, {
      cwd: path.join(__dirname, '..')
    });
    
    for (let i = 0; i < step; i++) {
      execSync(`npm run test -- Sort.js stepFn --continue 2>&1 > /dev/null`, {
        cwd: path.join(__dirname, '..')
      });
    }
    
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    const candidates = getAllCandidatesWithFeatures(state);
    
    if (candidates.length <= 1) continue;
    
    // 测试每个候选
    const results = [];
    for (const cand of candidates) {
      const win = testCandidateWin(seed, step, cand);
      results.push({ ...cand, win });
    }
    
    const winCount = results.filter(r => r.win).length;
    const loseCount = results.filter(r => !r.win).length;
    
    if (winCount > 0 && loseCount > 0) {
      console.log(`[${seed}] 🎯 第${step}步: ${winCount}个WIN, ${loseCount}个LOSE`);
      criticalSteps.push({
        step,
        candidates: results,
        winCount,
        loseCount
      });
    }
  }
  
  if (criticalSteps.length === 0) {
    console.log(`[${seed}] 未找到关键错误步骤`);
    return null;
  }
  
  console.log(`[${seed}] ✓ 找到${criticalSteps.length}个关键步骤\n`);
  return {
    seed,
    autoSteps,
    criticalSteps
  };
}

// 主程序
const args = process.argv.slice(2);
const startSeed = args[0] ? parseInt(args[0]) : 1;
const endSeed = args[1] ? parseInt(args[1]) : 50;

console.log(`${'='.repeat(70)}`);
console.log(`收集丰富特征数据`);
console.log(`${'='.repeat(70)}`);
console.log(`种子范围: ${startSeed} - ${endSeed} (共${endSeed - startSeed + 1}个)`);
console.log(`最大分析步数: 20\n`);

const allData = [];
let processedCount = 0;
let foundCount = 0;

for (let seed = startSeed; seed <= endSeed; seed++) {
  const result = analyzeSeed(seed, 20);
  processedCount++;
  
  if (result) {
    foundCount++;
    allData.push(result);
  }
  
  // 每10个种子输出一次进度
  if (processedCount % 10 === 0) {
    console.log(`进度: ${processedCount}/${endSeed - startSeed + 1}, 已找到${foundCount}个有效案例\n`);
  }
}

// 保存数据
const outputFile = path.join(__dirname, '..', 'rich-features-data.json');
fs.writeFileSync(outputFile, JSON.stringify(allData, null, 2));

console.log(`\n${'='.repeat(70)}`);
console.log(`数据收集完成`);
console.log(`${'='.repeat(70)}`);
console.log(`处理种子: ${processedCount}个`);
console.log(`找到关键错误案例: ${foundCount}个`);
console.log(`总关键步骤: ${allData.reduce((sum, d) => sum + d.criticalSteps.length, 0)}个`);
console.log(`数据已保存到: ${outputFile}\n`);
console.log(`下一步:`);
console.log(`  1. 特征分析: node scripts/analyze-rich-features.js`);
console.log(`  2. 降维分析: node scripts/dimensionality-reduction.js`);
