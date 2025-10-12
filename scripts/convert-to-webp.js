#!/usr/bin/env node

/**
 * 批量将图片转换为 WebP 格式
 * 使用 sharp 库进行高质量转换
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// 配置
const config = {
  sourceDir: path.join(projectRoot, 'public/static'),
  quality: 85, // WebP 质量 (0-100)
  extensions: ['.jpg', '.jpeg', '.png'],
  keepOriginal: false, // 是否保留原始文件
};

/**
 * 检查是否安装了 sharp
 */
async function checkSharp() {
  try {
    await import('sharp');
    return true;
  } catch {
    return false;
  }
}

/**
 * 安装 sharp
 */
async function installSharp() {
  console.log('📦 正在安装 sharp 库...');
  try {
    await execAsync('npm install --save-dev sharp', { cwd: projectRoot });
    console.log('✅ sharp 安装成功\n');
  } catch (error) {
    console.error('❌ sharp 安装失败:', error.message);
    process.exit(1);
  }
}

/**
 * 使用 sharp 转换图片为 WebP
 */
async function convertWithSharp(inputPath, outputPath) {
  const sharp = (await import('sharp')).default;
  
  await sharp(inputPath)
    .webp({ quality: config.quality })
    .toFile(outputPath);
}

/**
 * 转换单个图片
 */
async function convertImage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  if (!config.extensions.includes(ext)) {
    return null;
  }
  
  const fileName = path.basename(filePath, ext);
  const outputPath = path.join(path.dirname(filePath), `${fileName}.webp`);
  
  // 如果 WebP 文件已存在且较新，跳过
  if (fs.existsSync(outputPath)) {
    const inputStats = fs.statSync(filePath);
    const outputStats = fs.statSync(outputPath);
    if (outputStats.mtime >= inputStats.mtime) {
      return { skipped: true, input: filePath, output: outputPath };
    }
  }
  
  const inputSize = fs.statSync(filePath).size;
  
  try {
    await convertWithSharp(filePath, outputPath);
    
    const outputSize = fs.statSync(outputPath).size;
    const savings = ((1 - outputSize / inputSize) * 100).toFixed(1);
    
    // 如果配置为不保留原始文件，则删除
    if (!config.keepOriginal) {
      fs.unlinkSync(filePath);
    }
    
    return {
      success: true,
      input: filePath,
      output: outputPath,
      inputSize,
      outputSize,
      savings,
      deleted: !config.keepOriginal
    };
  } catch (error) {
    return {
      success: false,
      input: filePath,
      error: error.message
    };
  }
}

/**
 * 递归扫描目录
 */
function* walkSync(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      yield* walkSync(filePath);
    } else {
      yield filePath;
    }
  }
}

/**
 * 格式化文件大小
 */
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

/**
 * 主函数
 */
async function main() {
  console.log('🖼️  图片转换为 WebP 格式\n');
  console.log(`源目录: ${config.sourceDir}`);
  console.log(`质量: ${config.quality}`);
  console.log(`保留原始文件: ${config.keepOriginal ? '是' : '否'}\n`);
  
  // 检查源目录是否存在
  if (!fs.existsSync(config.sourceDir)) {
    console.error(`❌ 源目录不存在: ${config.sourceDir}`);
    process.exit(1);
  }
  
  // 检查并安装 sharp
  if (!(await checkSharp())) {
    await installSharp();
  }
  
  // 获取所有图片文件
  const imageFiles = Array.from(walkSync(config.sourceDir))
    .filter(file => config.extensions.includes(path.extname(file).toLowerCase()));
  
  if (imageFiles.length === 0) {
    console.log('⚠️  没有找到需要转换的图片文件');
    return;
  }
  
  console.log(`找到 ${imageFiles.length} 个图片文件\n`);
  console.log('开始转换...\n');
  
  // 批量转换
  const results = [];
  let totalInputSize = 0;
  let totalOutputSize = 0;
  
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const fileName = path.basename(file);
    
    process.stdout.write(`[${i + 1}/${imageFiles.length}] ${fileName} ... `);
    
    const result = await convertImage(file);
    
    if (result) {
      results.push(result);
      
      if (result.skipped) {
        console.log('⏭️  已存在');
      } else if (result.success) {
        totalInputSize += result.inputSize;
        totalOutputSize += result.outputSize;
        console.log(
          `✅ ${formatSize(result.inputSize)} → ${formatSize(result.outputSize)} ` +
          `(节省 ${result.savings}%)${result.deleted ? ' [已删除原文件]' : ''}`
        );
      } else {
        console.log(`❌ 失败: ${result.error}`);
      }
    }
  }
  
  // 统计信息
  const successCount = results.filter(r => r.success).length;
  const skippedCount = results.filter(r => r.skipped).length;
  const failedCount = results.filter(r => !r.success && !r.skipped).length;
  
  console.log('\n' + '='.repeat(60));
  console.log('转换完成！\n');
  console.log(`✅ 成功: ${successCount} 个`);
  console.log(`⏭️  跳过: ${skippedCount} 个`);
  if (failedCount > 0) {
    console.log(`❌ 失败: ${failedCount} 个`);
  }
  
  if (successCount > 0) {
    const totalSavings = ((1 - totalOutputSize / totalInputSize) * 100).toFixed(1);
    console.log(`\n📊 总计:`);
    console.log(`   原始大小: ${formatSize(totalInputSize)}`);
    console.log(`   转换后: ${formatSize(totalOutputSize)}`);
    console.log(`   节省: ${formatSize(totalInputSize - totalOutputSize)} (${totalSavings}%)`);
  }
  
  console.log('\n💡 下一步: 运行 npm run update:image-refs 更新代码中的图片引用');
}

// 运行
main().catch(error => {
  console.error('❌ 转换失败:', error);
  process.exit(1);
});
