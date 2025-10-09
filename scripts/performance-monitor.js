#!/usr/bin/env node

/**
 * 游戏组件性能监控工具
 * 分析组件性能、内存使用和渲染效率
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PerformanceMonitor {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.componentsDir = path.join(this.projectRoot, 'src/components');
    this.reportDir = path.join(this.projectRoot, 'performance-reports');
    
    // 确保报告目录存在
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  // 分析组件复杂度
  analyzeComplexity() {
    console.log('📊 分析组件复杂度...\n');
    
    const components = fs.readdirSync(this.componentsDir)
      .filter(file => file.endsWith('.vue'))
      .map(file => {
        const filePath = path.join(this.componentsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        return {
          name: file,
          ...this.calculateComplexity(content)
        };
      });
    
    // 按复杂度排序
    components.sort((a, b) => b.totalComplexity - a.totalComplexity);
    
    console.log('组件复杂度排名:');
    components.forEach((comp, index) => {
      const status = comp.totalComplexity > 100 ? '🔴' : 
                    comp.totalComplexity > 50 ? '🟡' : '🟢';
      console.log(`${index + 1}. ${status} ${comp.name} (${comp.totalComplexity})`);
    });
    
    return components;
  }

  // 计算代码复杂度
  calculateComplexity(content) {
    const lines = content.split('\n');
    const templateLines = this.extractSection(content, 'template');
    const scriptLines = this.extractSection(content, 'script');
    const styleLines = this.extractSection(content, 'style');
    
    // 模板复杂度
    const templateComplexity = this.calculateTemplateComplexity(templateLines);
    
    // 脚本复杂度
    const scriptComplexity = this.calculateScriptComplexity(scriptLines);
    
    // 样式复杂度
    const styleComplexity = styleLines.length * 0.1;
    
    return {
      totalLines: lines.length,
      templateLines: templateLines.length,
      scriptLines: scriptLines.length,
      styleLines: styleLines.length,
      templateComplexity,
      scriptComplexity,
      styleComplexity,
      totalComplexity: Math.round(templateComplexity + scriptComplexity + styleComplexity)
    };
  }

  // 提取代码段
  extractSection(content, section) {
    const regex = new RegExp(`<${section}[^>]*>([\\s\\S]*?)<\\/${section}>`, 'i');
    const match = content.match(regex);
    return match ? match[1].split('\n') : [];
  }

  // 计算模板复杂度
  calculateTemplateComplexity(lines) {
    let complexity = 0;
    
    lines.forEach(line => {
      // v-for 循环
      if (line.includes('v-for')) complexity += 3;
      
      // v-if 条件
      if (line.includes('v-if') || line.includes('v-else-if')) complexity += 2;
      
      // 事件绑定
      if (line.includes('@') || line.includes('v-on:')) complexity += 1;
      
      // 属性绑定
      if (line.includes(':') || line.includes('v-bind:')) complexity += 0.5;
      
      // 组件使用
      if (line.includes('<') && line.includes('>') && 
          !line.includes('</') && !line.includes('<!--')) {
        complexity += 1;
      }
    });
    
    return Math.round(complexity);
  }

  // 计算脚本复杂度
  calculateScriptComplexity(lines) {
    let complexity = 0;
    
    lines.forEach(line => {
      // 函数定义
      if (line.includes('function') || line.includes('=>')) complexity += 2;
      
      // 循环语句
      if (line.includes('for') || line.includes('while')) complexity += 3;
      
      // 条件语句
      if (line.includes('if') || line.includes('switch')) complexity += 2;
      
      // 异步操作
      if (line.includes('async') || line.includes('await') || 
          line.includes('Promise')) complexity += 2;
      
      // 事件监听
      if (line.includes('addEventListener') || 
          line.includes('$on') || line.includes('$emit')) complexity += 1;
    });
    
    return Math.round(complexity);
  }

  // 分析构建产物
  analyzeBuildOutput() {
    console.log('📦 分析构建产物...\n');
    
    try {
      // 构建项目
      console.log('构建项目...');
      execSync('npm run build', { 
        cwd: this.projectRoot,
        stdio: 'pipe'
      });
      
      const distPath = path.join(this.projectRoot, 'dist');
      if (!fs.existsSync(distPath)) {
        throw new Error('构建目录不存在');
      }
      
      const analysis = this.analyzeBuildSize(distPath);
      
      console.log('📊 构建分析结果:');
      console.log(`总大小: ${analysis.totalSize} KB`);
      console.log(`JS文件: ${analysis.jsSize} KB (${analysis.jsFiles} 个文件)`);
      console.log(`CSS文件: ${analysis.cssSize} KB (${analysis.cssFiles} 个文件)`);
      console.log(`图片资源: ${analysis.imageSize} KB (${analysis.imageFiles} 个文件)`);
      console.log(`其他文件: ${analysis.otherSize} KB`);
      
      // 性能建议
      this.generatePerformanceRecommendations(analysis);
      
      return analysis;
      
    } catch (error) {
      console.error('❌ 构建分析失败:', error.message);
      return null;
    }
  }

  // 分析构建大小
  analyzeBuildSize(distPath) {
    const analysis = {
      totalSize: 0,
      jsSize: 0,
      cssSize: 0,
      imageSize: 0,
      otherSize: 0,
      jsFiles: 0,
      cssFiles: 0,
      imageFiles: 0,
      files: []
    };
    
    const analyzeDir = (dir) => {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          analyzeDir(filePath);
        } else {
          const sizeKB = Math.round(stat.size / 1024);
          const ext = path.extname(file).toLowerCase();
          
          analysis.totalSize += sizeKB;
          analysis.files.push({
            name: file,
            path: path.relative(distPath, filePath),
            size: sizeKB,
            type: ext
          });
          
          if (ext === '.js') {
            analysis.jsSize += sizeKB;
            analysis.jsFiles++;
          } else if (ext === '.css') {
            analysis.cssSize += sizeKB;
            analysis.cssFiles++;
          } else if (['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'].includes(ext)) {
            analysis.imageSize += sizeKB;
            analysis.imageFiles++;
          } else {
            analysis.otherSize += sizeKB;
          }
        }
      });
    };
    
    analyzeDir(distPath);
    
    // 按大小排序文件
    analysis.files.sort((a, b) => b.size - a.size);
    
    return analysis;
  }

  // 生成性能建议
  generatePerformanceRecommendations(analysis) {
    console.log('\n💡 性能优化建议:');
    
    const recommendations = [];
    
    // 检查总体大小
    if (analysis.totalSize > 5000) {
      recommendations.push('🔴 构建产物过大 (>5MB)，考虑代码分割');
    } else if (analysis.totalSize > 2000) {
      recommendations.push('🟡 构建产物较大 (>2MB)，可以进一步优化');
    } else {
      recommendations.push('🟢 构建产物大小合理');
    }
    
    // 检查JS文件
    if (analysis.jsSize > 1000) {
      recommendations.push('🔴 JS文件过大，建议启用代码分割和懒加载');
    }
    
    // 检查大文件
    const largeFiles = analysis.files.filter(f => f.size > 100);
    if (largeFiles.length > 0) {
      recommendations.push(`🟡 发现 ${largeFiles.length} 个大文件 (>100KB)`);
      largeFiles.slice(0, 3).forEach(file => {
        recommendations.push(`   - ${file.name}: ${file.size}KB`);
      });
    }
    
    // 检查图片优化
    if (analysis.imageSize > 500) {
      recommendations.push('🟡 图片资源较大，建议压缩或使用WebP格式');
    }
    
    recommendations.forEach(rec => console.log(rec));
  }

  // 生成性能报告
  generatePerformanceReport() {
    console.log('📋 生成性能报告...\n');
    
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      complexity: this.analyzeComplexity(),
      buildAnalysis: this.analyzeBuildOutput(),
      recommendations: this.generateOptimizationPlan()
    };
    
    // 保存报告
    const reportFile = path.join(this.reportDir, `performance-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    // 生成HTML报告
    const htmlReport = this.generateHTMLReport(report);
    const htmlFile = path.join(this.reportDir, `performance-${Date.now()}.html`);
    fs.writeFileSync(htmlFile, htmlReport);
    
    console.log(`📄 报告已保存:`);
    console.log(`  JSON: ${reportFile}`);
    console.log(`  HTML: ${htmlFile}`);
    
    return report;
  }

  // 生成优化计划
  generateOptimizationPlan() {
    return [
      {
        priority: 'high',
        title: '代码分割',
        description: '将大型组件拆分为更小的模块',
        impact: '减少初始加载时间'
      },
      {
        priority: 'medium',
        title: '懒加载',
        description: '对非关键组件实现懒加载',
        impact: '提升首屏渲染速度'
      },
      {
        priority: 'medium',
        title: '资源优化',
        description: '压缩图片和静态资源',
        impact: '减少网络传输时间'
      },
      {
        priority: 'low',
        title: '缓存策略',
        description: '优化浏览器缓存配置',
        impact: '提升重复访问性能'
      }
    ];
  }

  // 生成HTML报告
  generateHTMLReport(report) {
    return `<!DOCTYPE html>
<html>
<head>
  <title>性能分析报告</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
    .section { margin: 20px 0; }
    .complexity-table { width: 100%; border-collapse: collapse; }
    .complexity-table th, .complexity-table td { 
      border: 1px solid #ddd; padding: 8px; text-align: left; 
    }
    .complexity-table th { background-color: #f2f2f2; }
    .high { color: #d32f2f; }
    .medium { color: #f57c00; }
    .low { color: #388e3c; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🚀 性能分析报告</h1>
    <p>生成时间: ${report.timestamp}</p>
  </div>
  
  <div class="section">
    <h2>📊 组件复杂度分析</h2>
    <table class="complexity-table">
      <tr>
        <th>组件</th>
        <th>总行数</th>
        <th>复杂度</th>
        <th>状态</th>
      </tr>
      ${report.complexity.map(comp => `
        <tr>
          <td>${comp.name}</td>
          <td>${comp.totalLines}</td>
          <td>${comp.totalComplexity}</td>
          <td class="${comp.totalComplexity > 100 ? 'high' : comp.totalComplexity > 50 ? 'medium' : 'low'}">
            ${comp.totalComplexity > 100 ? '🔴 高' : comp.totalComplexity > 50 ? '🟡 中' : '🟢 低'}
          </td>
        </tr>
      `).join('')}
    </table>
  </div>
  
  ${report.buildAnalysis ? `
  <div class="section">
    <h2>📦 构建分析</h2>
    <p>总大小: ${report.buildAnalysis.totalSize} KB</p>
    <p>JS文件: ${report.buildAnalysis.jsSize} KB</p>
    <p>CSS文件: ${report.buildAnalysis.cssSize} KB</p>
  </div>
  ` : ''}
  
  <div class="section">
    <h2>💡 优化建议</h2>
    <ul>
      ${report.recommendations.map(rec => `
        <li class="${rec.priority}">
          <strong>${rec.title}</strong>: ${rec.description}
          <br><small>影响: ${rec.impact}</small>
        </li>
      `).join('')}
    </ul>
  </div>
</body>
</html>`;
  }

  // 实时监控
  startRealTimeMonitoring() {
    console.log('🔄 启动实时性能监控...');
    
    // 监控文件变化
    const watcher = fs.watch(this.componentsDir, { recursive: true }, (eventType, filename) => {
      if (filename && filename.endsWith('.vue')) {
        console.log(`📝 文件变化: ${filename}`);
        // 可以在这里触发增量分析
      }
    });
    
    console.log('监控已启动，按 Ctrl+C 停止');
    
    // 定期生成报告
    const interval = setInterval(() => {
      console.log('\n⏰ 定期性能检查...');
      this.analyzeComplexity();
    }, 30000); // 30秒检查一次
    
    // 优雅退出
    process.on('SIGINT', () => {
      console.log('\n🛑 停止监控...');
      watcher.close();
      clearInterval(interval);
      process.exit(0);
    });
  }
}

// 命令行接口
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new PerformanceMonitor();
  const args = process.argv.slice(2);
  
  switch (args[0]) {
    case 'complexity':
      monitor.analyzeComplexity();
      break;
      
    case 'build':
      monitor.analyzeBuildOutput();
      break;
      
    case 'report':
      monitor.generatePerformanceReport();
      break;
      
    case 'monitor':
      monitor.startRealTimeMonitoring();
      break;
      
    default:
      console.log(`
🚀 性能监控工具

用法:
  node performance-monitor.js complexity  # 分析代码复杂度
  node performance-monitor.js build       # 分析构建产物
  node performance-monitor.js report      # 生成完整报告
  node performance-monitor.js monitor     # 实时监控
      `);
  }
}

export default PerformanceMonitor;
