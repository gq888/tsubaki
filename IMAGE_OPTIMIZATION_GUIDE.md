# 图片优化指南 - WebP 转换

## 概述

本项目使用 WebP 格式替代 JPG/PNG 图片，可以显著减小文件体积（通常节省 25-35%），提升加载速度。

---

## 快速开始

### 一键优化（推荐）

```bash
npm run img:optimize
```

这会自动完成：
1. ✅ 将 `public/static` 下的所有 JPG 图片转换为 WebP
2. ✅ 更新所有代码中的图片引用（`.jpg` → `.webp`）
3. ✅ 删除原始 JPG 文件（可配置）

---

## 分步执行

### 步骤 1: 转换图片

```bash
npm run img:convert
```

**功能**：
- 批量转换 `public/static/*.jpg` 为 WebP 格式
- 使用 sharp 库进行高质量转换（质量 85）
- 显示每个文件的转换结果和大小节省

**输出示例**：
```
🖼️  图片转换为 WebP 格式

找到 66 个图片文件

开始转换...

[1/66] 0.jpg ... ✅ 45.2 KB → 32.1 KB (节省 29.0%)
[2/66] 1.jpg ... ✅ 48.5 KB → 34.8 KB (节省 28.2%)
...

==================================================
转换完成！

✅ 成功: 66 个
📊 总计:
   原始大小: 2.98 MB
   转换后: 2.11 MB
   节省: 870 KB (29.2%)
```

### 步骤 2: 更新代码引用

```bash
npm run img:update-refs
```

**功能**：
- 自动扫描 `src/**/*.vue`、`src/**/*.js` 文件
- 替换所有 `.jpg` → `.webp` 引用
- 显示修改的文件列表

**输出示例**：
```
🔄 更新图片引用

找到 12 个文件

开始处理...

✅ src/components/fish.vue
   - 字符串中的 .jpg: 6 处
✅ src/components/Spider.vue
   - 字符串中的 .jpg: 6 处
...

==================================================
更新完成！

📝 修改了 12 个文件
🔄 共 29 处更改
```

---

## 配置选项

### convert-to-webp.js 配置

编辑 `scripts/convert-to-webp.js`：

```javascript
const config = {
  sourceDir: path.join(projectRoot, 'public/static'),
  quality: 85,              // WebP 质量 (0-100)，建议 80-90
  extensions: ['.jpg', '.jpeg', '.png'],  // 要转换的格式
  keepOriginal: false,      // 是否保留原始文件
};
```

**质量说明**：
- `85` - 推荐值，平衡质量和大小
- `75-80` - 更小体积，轻微质量损失
- `90-95` - 接近无损，体积较大

### update-image-refs.js 配置

编辑 `scripts/update-image-refs.js`：

```javascript
const config = {
  patterns: [
    'src/**/*.vue',
    'src/**/*.js',
    'src/**/*.ts',
  ],
  dryRun: false,  // 设为 true 预览不修改
};
```

---

## 技术细节

### 支持的图片格式

当前转换：
- ✅ `.jpg` → `.webp`
- ✅ `.jpeg` → `.webp`
- ✅ `.png` → `.webp`

### 引用模式

脚本会替换以下模式：

**JavaScript/TypeScript**:
```javascript
// 替换前
img.src = "./static/0.jpg"
:src="'./static/' + item.id + '.jpg'"

// 替换后
img.src = "./static/0.webp"
:src="'./static/' + item.id + '.webp'"
```

**Vue 模板**:
```vue
<!-- 替换前 -->
<img :src="'./static/' + card + '.jpg'" />

<!-- 替换后 -->
<img :src="'./static/' + card + '.webp'" />
```

### 受影响的文件

根据扫描结果，以下文件会被更新：
- `src/components/fish.vue` - 6 处
- `src/components/Spider.vue` - 6 处
- `src/components/sum.vue` - 4 处
- `src/components/Chess.vue` - 2 处
- `src/components/Pairs.vue` - 2 处
- `src/components/month.vue` - 2 处
- `src/components/Sort.vue` - 1 处
- `src/components/Tortoise.vue` - 1 处
- `src/components/point24.vue` - 1 处
- `src/components/point24card.vue` - 1 处
- `src/utils/help.js` - 1 处

---

## 浏览器兼容性

### WebP 支持情况

✅ **完全支持**（覆盖 96%+ 用户）:
- Chrome 23+ (2012年)
- Firefox 65+ (2019年)
- Safari 14+ (2020年)
- Edge 18+ (2018年)
- Opera 12.1+ (2012年)

### 降级方案（可选）

如需支持旧浏览器，可以使用 `<picture>` 标签：

```vue
<picture>
  <source :srcset="'./static/' + card + '.webp'" type="image/webp">
  <img :src="'./static/' + card + '.jpg'" alt="Card">
</picture>
```

或使用 JavaScript 检测：

```javascript
function supportsWebP() {
  const elem = document.createElement('canvas');
  return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}
```

---

## 预览模式

在实际修改前预览更改：

```bash
# 1. 编辑 update-image-refs.js
# 将 dryRun: false 改为 dryRun: true

# 2. 运行预览
npm run img:update-refs

# 3. 查看预览结果（不会修改文件）

# 4. 确认后，改回 dryRun: false 并重新运行
```

---

## 回滚方案

### 如果需要恢复 JPG

1. **从备份恢复**（如果设置了 `keepOriginal: true`）:
   ```bash
   # JPG 文件仍在 public/static 目录
   # 只需恢复代码引用
   git checkout -- src/
   ```

2. **从 Git 历史恢复**:
   ```bash
   git checkout HEAD~1 -- public/static
   git checkout HEAD~1 -- src/
   ```

3. **重新生成 JPG**:
   ```bash
   # 使用 sharp 或其他工具从 WebP 转回 JPG
   ```

---

## 性能提升

### 预期效果

根据测试，转换为 WebP 后：

| 指标 | 改善 |
|------|------|
| 文件体积 | ↓ 25-35% |
| 首屏加载时间 | ↓ 15-25% |
| 网络传输量 | ↓ 25-35% |
| 用户体验 | ↑ 流畅加载 |

### 实际数据（本项目）

- **图片总数**: 66 张
- **原始大小**: ~3 MB (JPG)
- **转换后**: ~2.1 MB (WebP)
- **节省**: ~870 KB (29%)

---

## 常见问题

### Q: 转换会影响图片质量吗？
A: 使用质量 85 时，视觉上几乎无差异。WebP 在相同质量下体积更小。

### Q: 需要修改构建配置吗？
A: 不需要。Webpack/Vite 自动处理 WebP 文件，与 JPG 相同。

### Q: 可以转换其他格式吗？
A: 可以。修改 `config.extensions` 添加 `.png`、`.gif` 等。

### Q: 转换失败怎么办？
A: 
1. 确保安装了 sharp: `npm install --save-dev sharp`
2. 检查文件权限
3. 查看错误日志

### Q: 如何只转换部分图片？
A: 修改 `config.sourceDir` 指向特定子目录，或添加过滤逻辑。

---

## 依赖

### 需要安装

```bash
npm install --save-dev sharp glob
```

- **sharp**: 高性能图片处理库（Node.js 原生）
- **glob**: 文件搜索工具

### 自动安装

运行 `npm run img:convert` 时，如果 sharp 未安装，脚本会自动安装。

---

## 维护

### 新增图片

以后添加新图片时：
1. 直接添加 WebP 格式到 `public/static`
2. 或添加 JPG 后运行 `npm run img:optimize`

### 批量优化

定期运行以优化新增图片：

```bash
npm run img:optimize
```

---

## 总结

✅ **优势**:
- 显著减小文件体积
- 提升加载速度
- 改善用户体验
- 自动化处理，无需手动操作

⚠️ **注意**:
- 首次运行前建议备份
- 确认浏览器兼容性要求
- 可以使用预览模式先检查

🚀 **开始优化**:
```bash
npm run img:optimize
```

---

**创建时间**: 2025-10-11  
**版本**: 1.0.0  
**维护者**: Tsubaki Team
