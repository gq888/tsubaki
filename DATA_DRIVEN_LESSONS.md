# 数据驱动优化的经验教训

## 📊 数据收集结果

### 样本规模
- 测试了20个种子
- 找到11个关键错误案例
- 总计27个候选（11个WIN，16个LOSE）

### 特征相关性（按差异百分比排序）

| 排名 | 特征 | WIN平均 | LOSE平均 | 差异% | 方向 |
|------|------|---------|----------|-------|------|
| 1 | afterMoves | 0.36 | 0.75 | 51.4% | ↓LOSE更高 |
| 2 | cardPosition | 2.36 | 2.94 | 19.5% | ↓LOSE更高 |
| 3 | slotPosition | 2.82 | 2.63 | 7.4% | ↑WIN更高 |
| 4 | slot_score | 24.45 | 26.31 | 7.1% | ↓LOSE更高 |
| 5 | cardRank | 1.64 | 1.56 | 4.7% | ↑WIN更高 |
| 6 | cardSuit | 1.36 | 1.31 | 3.9% | ↑WIN更高 |
| 7 | slotPrevRank | 2.64 | 2.56 | 2.9% | ↑WIN更高 |

## 🧪 尝试的改进方案

### 方案1: 激进调整优先级
**改动**：priority > diff > lookahead↓ > cardPosition↓ > rank
**结果**：胜率从20% → 5% ❌
**结论**：过度激进，破坏了原有逻辑

### 方案2: 保守tie-breaker
**改动**：priority > diff > rank > lookahead↓ > cardPosition↓  
**结果**：胜率从20% → 0% ❌
**结论**：即使保守应用，反转afterMoves仍有害

### 方案B（当前）: 添加空位评分
**改动**：priority > diff > rank > slot_score > lookahead
**结果**：胜率 4/20 (20%)
**状态**：基准方案

## ⚠️ 关键教训

### 1. 相关性 ≠ 因果性

**发现**：afterMoves少的候选WIN率高（51.4%差异）
**直觉推断**：应该优先选择afterMoves少的候选
**实际结果**：胜率降到0%

**原因分析**：
- afterMoves少可能是**结果**而非**原因**
- 某些局面下afterMoves本来就少，这些局面恰好更容易WIN
- 强行选择afterMoves少的可能陷入死局

### 2. 样本量不足的风险

**当前样本**：11个案例，27个候选
**问题**：
- 样本可能不具代表性
- 某些特殊局面被过度采样
- 统计显著性不够

**建议**：
- 需要至少50-100个案例
- 覆盖不同难度和局面类型
- 交叉验证不同数据集

### 3. Priority和Diff已经很重要

从多次实验看：
- priority和diff的优先级不能降低
- 它们可能已经隐含了重要信息
- 过早应用其他指标会破坏原有逻辑

### 4. 特征交互效应

单个特征的相关性可能误导：
- cardPosition和slotPosition可能有交互
- afterMoves可能依赖于priority的值
- 需要考虑特征组合的效果

## 💡 建议的下一步

### 短期（数据收集）

1. **扩大样本量到50+案例**
```bash
node scripts/collect-candidate-features.js 1 2 3 ... 50
```

2. **分层采样**
- 按游戏进度分层（前期/中期/后期）
- 按候选数量分层（2个/3个/4+个）
- 确保样本多样性

3. **交叉验证**
- 用前30个种子训练
- 用后20个种子验证
- 避免过拟合

### 中期（特征工程）

1. **特征组合**
```javascript
const combined_score = 
  priority_weight * priority +
  diff_weight * (1/diff) +
  rank_weight * rank +
  lookahead_weight * lookahead;
```

2. **条件特征**
```javascript
// 只在特定条件下使用某些特征
if (priority > 5) {
  // 高priority时，afterMoves更重要
} else {
  // 低priority时，rank更重要
}
```

3. **非线性关系**
- 可能rank=1最好，而不是越大越好
- 可能slotPosition有最优点

### 长期（机器学习）

如果启发式方法效果有限：

1. **决策树**
```python
# 收集大量数据后
features = ['priority', 'diff', 'rank', 'afterMoves', ...]
labels = ['WIN', 'LOSE']
model = DecisionTreeClassifier()
model.fit(features, labels)
# 查看特征重要性和决策规则
```

2. **随机森林**
- 更鲁棒
- 可以处理特征交互
- 自动特征选择

3. **强化学习**
- 用蒙特卡洛树搜索
- 学习长期策略
- 但计算成本高

## 🎯 当前最佳实践

基于所有实验，**当前建议**：

1. **保持priority和diff的高优先级**
2. **rank作为第三优先级**
3. **slot_score和lookahead作为tie-breaker**
4. **不要反转afterMoves方向**（除非有更多数据支持）

## 📈 成功指标

要判断改进是否有效：
- 胜率提升至少5%（从20%→25%）
- 在不同种子集上稳定
- 不能只在训练集上好

## 🔧 工具链

已创建的工具：
- `collect-candidate-features.js` - 收集数据
- `analyze-feature-correlation.js` - 分析相关性
- `find-critical-step.js` - 找关键错误步骤

使用方式：
```bash
# 1. 收集数据
node scripts/collect-candidate-features.js 1 2 3 ... 50

# 2. 分析相关性
node scripts/analyze-feature-correlation.js

# 3. 查看报告
cat feature-correlation-report.json
```

## 结论

数据驱动优化是正确方向，但需要：
1. ✅ 更大的样本量
2. ✅ 更仔细的因果分析
3. ✅ 渐进式的改进
4. ✅ 严格的交叉验证

**当前状态**：方案B（slot_score）胜率20%，作为基准继续改进。
