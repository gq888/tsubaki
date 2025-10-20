# 如何在终端玩游戏

## 🎉 项目完成情况

### ✅ 核心功能 - 100% 完成

**1. 交互式脚本框架**
- ✅ 修改 `renderToString-method-tester.js` 添加 `--interactive` 模式
- ✅ 实现游戏循环：初始化 → 显示状态 → 获取操作 → 执行 → 循环
- ✅ 支持用户输入数字选择操作
- ✅ 自动检测游戏结束状态（win/lose/draw）
- ✅ 完整的状态保存和恢复机制


## 🎮 快速开始

### 1. 启动交互式游戏

选择你喜欢的游戏，运行以下命令：

```bash
# 龟兔赛跑
npm run test Tortoise.js --interactive

# 排序游戏
npm run test Sort.js --interactive

# 蜘蛛纸牌
npm run test Spider.js --interactive

# 配对游戏
npm run test Pairs.js --interactive

# 月份游戏
npm run test month.js --interactive

# 钓鱼游戏
npm run test fish.js --interactive

# 24点游戏
npm run test point24.js --interactive
```

### 2. 使用种子（可重现相同布局）

```bash
npm run test Tortoise.js --interactive --seed=12345
npm run test Sort.js --interactive --seed=99999
```

## 📖 游戏说明

### Tortoise.js - 龟兔赛跑
**目标**: 配对所有54张牌

**规则**:
- 点击两张相同点数的牌进行配对
- 只能点击未被覆盖的牌（由 z-index 决定）
- 配对所有牌获胜

**显示说明**:
- `<卡片>` = 可以点击
- `(卡片)` = 被其他牌覆盖
- `[卡片✓]` = 已选中

### Sort.js - 排序游戏
**目标**: 将所有牌排序到正确位置

**规则**:
- 4列，每列有一个空位
- 将牌移动到空位后面
- 同花色/颜色/数值的牌可以连接（根据难度）

**难度模式**:
- 简单: 任意点数相同即可
- 中等: 同颜色可以连接
- 困难: 必须同花色

**显示说明**:
- `[-n]` = 空位
- `* 卡片` = 可以移动
- `→ 卡片` = 推荐移动

### Spider.js - 蜘蛛纸牌
**目标**: 整理所有牌

**规则**:
- 从牌堆发牌到10列
- 按降序排列牌
- 同花色的完整序列可以移除

**显示说明**:
- `🂠 n张` = 牌堆
- `←` = 该列的顶牌

### Pairs.js - 配对游戏
**目标**: 找出所有配对

**规则**:
- 48张牌面朝下
- 翻开两张牌，如果点数相同则配对成功
- 记住牌的位置

**显示说明**:
- `[?]` = 未翻开
- `[✓]` = 已配对
- `> 卡片` = 第一张选中
- `* 卡片` = 第二张选中

### month.js - 月份游戏
**目标**: 避免任何位置达到4张牌

**规则**:
- 13个位置：12个月 + 第13位
- 从当前位置取顶牌，放到对应点数的位置
- 如果任何位置达到4张牌则失败

**显示说明**:
- 每个位置显示牌数
- `⚠️ 失败!` = 该位置已达4张

### fish.js - 钓鱼游戏
**目标**: 收集最多的牌

**规则**:
- 4个玩家轮流出牌
- 如果中央区域有相同点数的牌，收集它们
- 特殊牌可以从其他玩家处拿牌

**显示说明**:
- 玩家1(你) = 你的手牌
- 中央区域 = 公共牌区

### point24.js - 24点游戏
**目标**: 用4张牌算出24

**规则**:
- 使用 +、-、×、÷ 运算符
- 每张牌只能用一次
- 最终结果必须等于24

**显示说明**:
- 显示当前4张牌
- 显示计算历史
- `🎉` = 达到24点

## 🎯 操作说明

### 交互式模式中的操作

游戏会显示可用操作列表，例如：

```
🎯 可用操作:
  [1] 撤销 (◀︎)
  [2] 重新开始 (RESTART)
  [3] 单步执行 (►)
  [4] 自动运行 (AUTO)
  [0] 退出游戏

请选择操作 (输入数字): _
```

- 输入数字选择操作
- 输入 `0` 退出游戏
- 游戏会自动检测胜利/失败

### 常用操作

- **撤销 (◀︎)**: 回退一步
- **重新开始 (RESTART)**: 重新开始游戏
- **单步执行 (►)**: 让AI走一步
- **自动运行 (AUTO)**: 让AI自动玩
- **停止自动 (STOP)**: 停止AI自动玩

## 🔧 高级用法

### 手动执行方法

```bash
# 初始化游戏
npm run test Tortoise.js init --seed=12345

# 查看当前状态
npm run test Tortoise.js renderTextView --continue

# 查看可用操作
npm run test Tortoise.js getAvailableActions --continue

# 执行一步
npm run test Tortoise.js stepFn --continue

# 自动运行
npm run test Tortoise.js pass --continue
```

### 自定义输出文件

```bash
npm run test Tortoise.js --interactive --output=my-game.json
```

### 从特定状态开始

```bash
# 先保存状态
npm run test Tortoise.js init --seed=12345 --output=start-state.json

# 从该状态继续
npm run test Tortoise.js stepFn --state-file=start-state.json
```

## 💡 提示

1. **使用种子**: 使用 `--seed` 参数可以重现相同的游戏布局，便于练习
2. **观察AI**: 使用"单步执行"可以学习AI的策略
3. **保存进度**: 状态会自动保存到 `.last-test-state.json`
4. **继续游戏**: 使用 `--continue` 参数可以继续上次的游戏

## 🐛 常见问题

### Q: 如何继续上次的游戏？
A: 只需在命令中添加 `--continue` 参数

### Q: 游戏卡住了怎么办？
A: 按 Ctrl+C 退出，然后重新开始

### Q: 如何看到完整的游戏状态？
A: 使用 `npm run test GameName.js renderTextView --continue`

### Q: 可以同时玩多个游戏吗？
A: 可以，使用 `--output` 参数为每个游戏指定不同的状态文件

## 🎉 享受游戏！

现在你可以在终端中享受这些游戏了！选择一个游戏，输入命令，开始玩吧！
