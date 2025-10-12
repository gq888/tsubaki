#!/usr/bin/env node

/**
 * 更新项目中所有图片引用从 .jpg 到 .webp
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// 配置
const config = {
  patterns: [
    'src/**/*.vue',
    'src/**/*.js',
    'src/**/*.ts',
  ],
  replacements: [
    {
      // 匹配 .jpg' 或 .jpg"
      pattern: /\.jpg(['"])/g,
      replacement: '.webp$1',
      description: '字符串中的 .jpg'
    },
    {
      // 匹配 .jpeg' 或 .jpeg"
      pattern: /\.jpeg(['"])/g,
      replacement: '.webp$1',
      description: '字符串中的 .jpeg'
    },
    {
      // 匹配 .png' 或 .png"
      pattern: /\.png(['"])/g,
      replacement: '.webp$1',
      description: '字符串中的 .png'
    }
  ],
  dryRun: false, // 设为 true 进行预览，不实际修改文件
};

/**
 * 处理单个文件
 */
function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  const changes = [];
  
  // 应用所有替换规则
  for (const { pattern, replacement, description } of config.replacements) {
    const matches = content.match(pattern);
    if (matches) {
      content = content.replace(pattern, replacement);
      modified = true;
      changes.push({
        description,
        count: matches.length
      });
    }
  }
  
  if (modified && !config.dryRun) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
  
  return { modified, changes };
}

/**
 * 获取所有需要处理的文件
 */
async function getFiles() {
  const allFiles = [];
  
  for (const pattern of config.patterns) {
    const files = await glob(pattern, {
      cwd: projectRoot,
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**']
    });
    allFiles.push(...files);
  }
  
  // 去重
  return [...new Set(allFiles)];
}

/**
 * 主函数
 */
async function main() {
  console.log('🔄 更新图片引用\n');
  
  if (config.dryRun) {
    console.log('⚠️  预览模式（不会修改文件）\n');
  }
  
  console.log('搜索模式:');
  config.patterns.forEach(p => console.log(`  - ${p}`));
  console.log('\n替换规则:');
  config.replacements.forEach(r => console.log(`  - ${r.description}`));
  console.log('');
  
  // 获取所有文件
  const files = await getFiles();
  
  if (files.length === 0) {
    console.log('⚠️  没有找到匹配的文件');
    return;
  }
  
  console.log(`找到 ${files.length} 个文件\n`);
  console.log('开始处理...\n');
  
  // 处理文件
  const results = [];
  let totalChanges = 0;
  
  for (const file of files) {
    const relativePath = path.relative(projectRoot, file);
    const result = processFile(file);
    
    if (result.modified) {
      results.push({ file: relativePath, ...result });
      const changeCount = result.changes.reduce((sum, c) => sum + c.count, 0);
      totalChanges += changeCount;
      
      console.log(`✅ ${relativePath}`);
      result.changes.forEach(change => {
        console.log(`   - ${change.description}: ${change.count} 处`);
      });
    }
  }
  
  // 统计信息
  console.log('\n' + '='.repeat(60));
  console.log('更新完成！\n');
  console.log(`📝 修改了 ${results.length} 个文件`);
  console.log(`🔄 共 ${totalChanges} 处更改`);
  
  if (config.dryRun) {
    console.log('\n💡 预览模式已完成，设置 dryRun: false 以实际修改文件');
  } else {
    console.log('\n✨ 所有图片引用已更新为 WebP 格式');
  }
  
  // 详细列表
  if (results.length > 0) {
    console.log('\n修改的文件列表:');
    results.forEach(r => {
      const total = r.changes.reduce((sum, c) => sum + c.count, 0);
      console.log(`  - ${r.file} (${total} 处)`);
    });
  }
}

// 运行
main().catch(error => {
  console.error('❌ 更新失败:', error);
  process.exit(1);
});
