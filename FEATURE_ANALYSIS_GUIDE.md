# Sort游戏特征分析与优化指南

## 📋 概述

本指南记录了Sort游戏AI算法的大规模数据驱动优化流程，包括丰富特征收集、相关性分析、降维优化等完整方法论。

## 🎯 目标

1. **扩大样本规模**：从11个案例扩展到50+个案例
2. **丰富特征维度**：从7个特征扩展到23个特征
3. **分析特征相关性**：使用Cohen's d效应量和Pearson相关系数
4. **特征降维**：识别并移除冗余特征
5. **生成优化算法**：基于数据驱动的特征选择

## 📊 完整工作流程

### 阶段1: 大规模数据收集

#### 工具: `collect-rich-features.js`

```bash
# 收集50个种子的数据（推荐）
node scripts/collect-rich-features.js 1 50

# 自定义范围
node scripts/collect-rich-features.js <起始种子> <结束种子>
```

#### 收集的23个丰富特征

**基础特征 (5个)**
- `cardRank`: 卡片等级
- `cardSuit`: 卡片花色
- `cardPosition`: 卡片在列中的位置
- `slotPosition`: 空位在列中的位置
- `slotPrevRank`: 空位前牌等级

**空位分布特征 (8个)**
- `emptyInCardCol`: 卡片所在列的空位数
- `emptyAboveCard`: 卡片上方的空位数
- `emptyBelowCard`: 卡片下方的空位数
- `emptyInSlotCol`: 空位所在列的空位数
- `emptyAboveSlot`: 空位上方的空位数
- `emptyBelowSlot`: 空位下方的空位数
- `totalEmpty`: 总空位数
- `emptyEntropy`: 空位分布熵（衡量分散程度）

**牌堆状态特征 (3个)**
- `cardsAboveTarget`: 卡片上方的压牌数
- `correctBelowSlot`: 空位下方已就位的牌数
- `sameRankCandidates`: 同rank的其他候选数

**移动后状态特征 (3个)**
- `afterMoves`: 移动后可移动数
- `restoredCards`: 移动后已就位的牌数（DP算法）
- `emptyEntropy`: 移动后空位分布熵

**距离特征 (2个)**
- `manhattanDist`: 卡片到目标位置的曼哈顿距离
- `isCrossColumn`: 是否跨列移动

**组合特征 (3个)**
- `slot_score_v1`: 原版本评分公式
- `slot_score_v2`: 用户改进的评分公式
- `slot_score_v3`: rank × 下方空位数

#### 输出

- `rich-features-data.json`: 原始数据文件
- 包含每个关键步骤的所有候选及其特征值
- 标记每个候选是否能导致WIN

### 阶段2: 特征相关性分析

#### 工具: `analyze-rich-features.js`

```bash
node scripts/analyze-rich-features.js
```

#### 分析内容

**1. 特征重要性排名**
- 使用Cohen's d效应量（比百分比更可靠）
- d > 0.8: 大效应
- d > 0.5: 中效应  
- d > 0.3: 小效应
- d > 0.2: 微小效应

**2. 特征分布分析**
- WIN和LOSE样本的均值、中位数、标准差对比
- 值分布直方图
- 识别非线性关系

**3. 特征组合分析**
- TOP特征的组合模式
- 同时满足多个条件的WIN率

**4. 特征相关性矩阵**
- Pearson相关系数
- 识别高度相关（冗余）的特征对
- r > 0.7 表示高度相关

#### 输出

- `rich-features-analysis.json`: 分析结果文件
- 包含所有特征的效应量、相关性、冗余特征对

### 阶段3: 特征降维

#### 工具: `dimensionality-reduction.js`

```bash
node scripts/dimensionality-reduction.js
```

#### 降维方法

**方法1: 基于相关性的特征选择**
- 对于高度相关的特征对（r > 0.7）
- 保留效应量更大的那个
- 移除冗余特征

**方法2: 基于效应量的特征选择**
- 只保留Cohen's d > 阈值的特征
- 推荐阈值: 0.3（小效应以上）

**方法3: 组合方法（推荐）**
- 先移除冗余特征
- 再只保留显著特征
- 平衡准确率和复杂度

**方法4: PCA方差分析**
- 计算每个特征的方差贡献度
- 方差大的特征信息量丰富

**方法5: 综合评分（最推荐）**
- 综合评分 = Cohen's d × 归一化方差
- 同时考虑相关性和信息量
- 用于最终特征选择

#### 生成的方案

1. **保守方案**: 移除冗余，保留所有独立特征
2. **激进方案**: 只保留效应量显著的特征
3. **平衡方案（推荐）**: 移除冗余 + 只保留显著
4. **精简方案**: TOP-8特征（基于综合评分）
5. **极简方案**: TOP-5特征（最小集）

#### 输出

- `dimensionality-reduction-result.json`: 降维结果文件
- 包含所有方案的特征列表

### 阶段4: 生成优化算法

#### 工具: `generate-optimized-algorithm.js`

```bash
node scripts/generate-optimized-algorithm.js
```

#### 生成内容

为每个降维方案生成：

1. **完整的候选评估代码**
   - 使用`_getters`数组的延迟计算模式
   - 特征按重要性排序
   - 统一的大于比较（需要小于的特征取反）

2. **必要的辅助函数**
   - `countEmptyInColumn`: 计算列中空位数
   - `countEmptyAbove`: 计算上方空位数
   - `countCorrectBelow`: 计算下方已就位牌数
   - 等等

3. **特征计算代码**
   - 每个特征的计算逻辑
   - 需要模拟的特征会创建simulatedCards
   - 缓存计算结果避免重复

#### 输出

- `generated-algorithms/` 目录
- 每个方案一个文件：`algorithm-<方案名>.txt`
- `README.md`: 方案对比和使用指南

### 阶段5: 测试和对比

#### 5.1 基准测试

```bash
# 测试当前算法作为基准
node scripts/batch-test.js baseline 1 50
```

#### 5.2 实施优化方案

1. 打开 `src/components/Sort.js`
2. 备份原代码
3. 找到 `autoCalc` 方法中的候选评估部分
4. 替换为生成的优化代码
5. 如果需要，添加辅助函数到 `methods`

#### 5.3 测试优化算法

```bash
# 测试优化后的算法
node scripts/batch-test.js optimized 1 50
```

#### 5.4 对比结果

```bash
# 对比两次测试结果
node scripts/compare-results.js batch-test-baseline.json batch-test-optimized.json
```

#### 输出

- 胜率差异
- 步数差异
- 改进的种子列表（LOSE→WIN）
- 恶化的种子列表（WIN→LOSE）
- 净改进数量
- McNemar检验（统计显著性）

## 📈 监控工具

### 监控数据收集进度

```bash
node scripts/monitor-progress.js
```

显示：
- 已处理种子数
- 自动成功/失败数量
- 找到的关键步骤数量
- 当前数据文件统计

## 🔍 关键概念

### Cohen's d 效应量

效应量衡量WIN和LOSE两组样本均值的差异大小（标准化）：

```
Cohen's d = (μ_WIN - μ_LOSE) / σ_pooled
```

- 不受样本量影响（比百分比差异更可靠）
- d > 0.8: 大效应（非常重要）
- d > 0.5: 中效应（重要）
- d > 0.3: 小效应（有一定作用）
- d > 0.2: 微小效应（作用很小）

### Pearson相关系数

衡量两个特征之间的线性相关性：

```
r = Cov(X, Y) / (σ_X × σ_Y)
```

- r > 0.7: 高度正相关（可能冗余）
- r < -0.7: 高度负相关（可能冗余）
- |r| < 0.3: 弱相关

### 特征冗余

如果两个特征高度相关（|r| > 0.7），保留效应量更大的那个，移除另一个。这样可以：
- 减少计算量
- 避免过拟合
- 提高模型鲁棒性

## 🎓 数据驱动的经验教训

### 1. 相关性 ≠ 因果性

前期发现`afterMoves`少的候选WIN率高（51.4%差异），但强行选择`afterMoves`少的反而导致胜率归零。

**原因**：`afterMoves`少可能是结果而非原因。某些必胜局面本来就`afterMoves`少。

**教训**：不能直接根据相关性反转特征方向，需要理解因果关系。

### 2. 样本量的重要性

- 11个案例：结果不稳定，容易误导
- 50+案例：更可靠，能发现真实模式

### 3. Priority和Diff是核心

多次实验证明，`priority`和`diff`是最重要的特征，不能降低它们的优先级。

### 4. 特征交互效应

单个特征的相关性可能误导，需要考虑特征组合的效果。

## 💡 最佳实践

### 实施新算法的建议步骤

1. **先测试基准**
   ```bash
   node scripts/batch-test.js baseline 1 50
   ```

2. **选择保守方案**
   - 先尝试"平衡方案"
   - 观察胜率是否提升

3. **渐进优化**
   - 如果平衡方案有效，再尝试"精简方案"
   - 每次只改一个方案，便于定位问题

4. **A/B测试**
   - 在不同种子集上交叉验证
   - 避免过拟合到特定种子

5. **性能监控**
   - 关注算法执行时间
   - 特别是需要模拟的特征（`afterMoves`, `restoredCards`）

### 特征选择建议

**优先保留的特征类型**：
1. 高效应量（d > 0.5）
2. 低计算成本（不需要模拟）
3. 与其他特征低相关（独立信息）

**可以移除的特征**：
1. 低效应量（d < 0.2）
2. 高度相关（冗余）
3. 高计算成本且效果一般

## 📁 文件结构

```
tsubaki/
├── scripts/
│   ├── collect-rich-features.js      # 数据收集
│   ├── analyze-rich-features.js      # 特征分析
│   ├── dimensionality-reduction.js   # 降维分析
│   ├── generate-optimized-algorithm.js # 生成代码
│   ├── batch-test.js                 # 批量测试
│   ├── compare-results.js            # 结果对比
│   └── monitor-progress.js           # 进度监控
├── generated-algorithms/             # 生成的优化代码
│   ├── algorithm-平衡方案.txt
│   ├── algorithm-精简方案.txt
│   └── README.md                     # 方案说明
├── rich-features-data.json          # 原始数据
├── rich-features-analysis.json      # 分析结果
├── dimensionality-reduction-result.json # 降维结果
├── batch-test-baseline.json         # 基准测试结果
├── batch-test-optimized.json        # 优化测试结果
└── comparison-*.json                # 对比报告
```

## 🚀 快速开始

### 完整流程（一键运行）

```bash
# 1. 收集数据（需要较长时间）
node scripts/collect-rich-features.js 1 50

# 2. 分析特征
node scripts/analyze-rich-features.js

# 3. 降维分析
node scripts/dimensionality-reduction.js

# 4. 生成优化代码
node scripts/generate-optimized-algorithm.js

# 5. 测试基准
node scripts/batch-test.js baseline 1 20

# 6. 实施优化（手动修改Sort.js）

# 7. 测试优化
node scripts/batch-test.js optimized 1 20

# 8. 对比结果
node scripts/compare-results.js batch-test-baseline.json batch-test-optimized.json
```

### 快速测试（小样本）

```bash
# 只测试前10个种子（快速验证）
node scripts/collect-rich-features.js 1 10
node scripts/analyze-rich-features.js
node scripts/dimensionality-reduction.js
node scripts/generate-optimized-algorithm.js
```

## 📊 预期结果

基于数据分析，使用高相关性特征应该能够：

- ✅ 提高关键步骤的决策准确率
- ✅ 减少计算量（特征数从23个降到5-10个）
- ✅ 提升整体胜率（目标：从20%提升到30%+）
- ✅ 降低平均步数（更高效的路径）

具体提升幅度需要通过实际测试确定。

## 🔬 未来改进方向

### 短期
1. 收集100+种子的数据
2. 分层采样（前期/中期/后期）
3. 条件特征（不同局面使用不同特征）

### 中期
1. 特征工程（非线性变换）
2. 加权评分（学习最优权重）
3. 多目标优化（胜率 + 步数）

### 长期
1. 决策树/随机森林
2. 强化学习（蒙特卡洛树搜索）
3. 神经网络（深度Q学习）

## 📝 更新日志

- **2024-10-18**: 初始版本，完成大规模数据收集和分析框架
- 扩展特征从7个到23个
- 实现降维分析和代码生成
- 创建完整的测试和对比工具链

## 🤝 贡献

如果发现问题或有改进建议：
1. 检查 `collection-log.txt` 了解数据收集详情
2. 查看分析结果文件了解特征重要性
3. 在不同种子集上验证结果
4. 记录改进效果

## 📚 参考资料

- Cohen's d效应量: https://en.wikipedia.org/wiki/Effect_size#Cohen's_d
- Pearson相关系数: https://en.wikipedia.org/wiki/Pearson_correlation_coefficient
- 特征选择方法: https://en.wikipedia.org/wiki/Feature_selection
- McNemar检验: https://en.wikipedia.org/wiki/McNemar%27s_test
