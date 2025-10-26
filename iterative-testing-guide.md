# 迭代式测试指南

## 概述

测试脚本现在支持传入当前状态，实现迭代式测试。你可以通过多次执行测试，逐步推进游戏状态。

## 基本用法

### 方式一：直接传入JSON状态

```bash
# 第一次执行，获取初始状态
npm run test point24.js stepFn

# 从返回结果中提取 after 状态，作为下一次的输入
npm run test point24.js stepFn --state='{"gameManager":{...}}'
```

### 方式二：使用状态文件

```bash
# 第一次执行，将结果保存到文件
npm run test point24.js stepFn > step1.json

# 提取 after 状态到新文件
cat step1.json | jq '.after' > state1.json

# 使用状态文件继续测试
npm run test point24.js stepFn --state-file=state1.json > step2.json
```

## 完整示例：point24游戏三步测试

### 使用 pass 函数（一步到位）

```bash
# pass 函数等价于执行三次 stepFn
npm run test point24.js pass 0
```

### 使用 stepFn 函数（迭代三次）

```bash
# 第一步
npm run test point24.js stepFn > step1.json
cat step1.json | jq '.after' > state1.json

# 第二步
npm run test point24.js stepFn --state-file=state1.json > step2.json
cat step2.json | jq '.after' > state2.json

# 第三步
npm run test point24.js stepFn --state-file=state2.json > step3.json

# 检查最终状态
cat step3.json | jq '.gameFlags'
```

## 输出格式

测试脚本返回的JSON包含以下字段：

```json
{
  "methodName": "stepFn",
  "args": [],
  "result": null,
  "error": null,
  "errorStack": null,
  "before": {
    // 执行前的完整状态
  },
  "after": {
    // 执行后的完整状态
  },
  "gameFlags": {
    "winflag": false,
    "loseflag": false,
    "drawflag": false
  },
  "testSuccess": false
}
```

## 实用技巧

### 快速提取状态

使用 `jq` 提取 `after` 状态：

```bash
npm run test point24.js stepFn | jq '.after' > current-state.json
```

### 检查游戏是否结束

```bash
npm run test point24.js stepFn | jq '.testSuccess'
# true 表示游戏已结束（胜利/失败/平局）
```

### 查看游戏标志

```bash
npm run test point24.js stepFn | jq '.gameFlags'
```

### 循环测试直到游戏结束

```bash
#!/bin/bash
step=1
success=false

while [ "$success" != "true" ]; do
  echo "执行第 $step 步..."
  npm run test point24.js stepFn --state-file=state.json > result.json
  success=$(cat result.json | jq -r '.testSuccess')
  cat result.json | jq '.after' > state.json
  step=$((step + 1))
  
  if [ $step -gt 100 ]; then
    echo "超过最大步数限制"
    break
  fi
done

echo "游戏在第 $step 步结束"
cat result.json | jq '.gameFlags'
```

## 参数说明

- `--state=<json>`: 直接传入JSON格式的状态对象
- `--state-file=<path>`: 从文件读取状态对象
- `--timeout=<ms>`: 设置超时时间（默认30000ms）
- `--seed=<number>`: 设置随机数种子（用于可重现的测试）

## 随机数种子测试

使用种子可以确保测试的可重现性：

```bash
# 使用固定种子进行测试
node scripts/renderToString-method-tester.js point24.js init 0 --seed=12345

# 使用相同种子会得到相同的结果
node scripts/renderToString-method-tester.js point24.js init 0 --seed=12345
```

### 种子使用场景

1. **调试特定场景**：发现问题后，使用种子固定随机状态进行调试
2. **回归测试**：使用固定种子确保修改后行为一致
3. **对比测试**：使用相同种子对比不同版本的差异

### 种子传递

种子会在以下时机设置：
1. 测试脚本在导入组件前设置全局种子
2. 组件的 `data()` 函数中保存种子值
3. 组件的 `created()` 生命周期中再次确认种子

**注意**：必须使用 `node scripts/renderToString-method-tester.js` 而不是 `npm run test`，因为npm会拦截 `--seed` 参数。

## 注意事项

1. **状态格式**：确保传入的状态格式与组件的 `data()` 返回格式一致
2. **JSON转义**：在命令行直接传入JSON时，注意引号转义
3. **文件路径**：使用 `--state-file` 时，路径相对于命令执行目录
4. **状态完整性**：传入的状态会覆盖组件的初始状态，确保包含所有必要字段
5. **种子参数**：使用种子参数时，必须直接运行node命令，不能通过npm run
