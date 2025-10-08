#!/usr/bin/env node

/**
 * 组件依赖关系分析器
 * 生成组件依赖关系图和分析报告
 */

const fs = require('fs');
const path = require('path');

class DependencyAnalyzer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.componentsDir = path.join(this.projectRoot, 'src/components');
    this.utilsDir = path.join(this.projectRoot, 'src/utils');
    this.dependencies = new Map();
    this.reverseDependencies = new Map();
  }

  // 分析所有组件依赖
  analyzeAllDependencies() {
    console.log('🔍 分析组件依赖关系...\n');
    
    // 分析组件目录
    this.analyzeDirectory(this.componentsDir, 'components');
    
    // 分析工具目录
    this.analyzeDirectory(this.utilsDir, 'utils');
    
    // 构建反向依赖关系
    this.buildReverseDependencies();
    
    return this.generateDependencyReport();
  }

  // 分析目录
  analyzeDirectory(dir, type) {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir)
      .filter(file => file.endsWith('.vue') || file.endsWith('.js'));
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const deps = this.extractDependencies(filePath);
      
      this.dependencies.set(file, {
        type,
        path: filePath,
        dependencies: deps,
        size: this.getFileSize(filePath),
        complexity: this.calculateFileComplexity(filePath)
      });
    });
  }

  // 提取文件依赖
  extractDependencies(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const dependencies = [];
    
    // 匹配import语句
    const importRegex = /import\s+(?:(?:\{[^}]*\}|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      
      // 过滤本地依赖
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        const resolvedPath = this.resolvePath(filePath, importPath);
        const fileName = path.basename(resolvedPath);
        
        dependencies.push({
          path: importPath,
          resolved: resolvedPath,
          file: fileName,
          type: this.getDependencyType(importPath)
        });
      } else if (!importPath.startsWith('@') && !this.isNodeModule(importPath)) {
        // 相对路径依赖
        dependencies.push({
          path: importPath,
          file: importPath,
          type: 'external'
        });
      }
    }
    
    // 匹配Vue组件注册
    const componentRegex = /components:\s*\{([^}]+)\}/g;
    const componentMatch = componentRegex.exec(content);
    if (componentMatch) {
      const componentNames = componentMatch[1]
        .split(',')
        .map(name => name.trim().split(':')[0].trim())
        .filter(name => name && !name.includes('...'));
      
      componentNames.forEach(name => {
        dependencies.push({
          path: `./${name}.vue`,
          file: `${name}.vue`,
          type: 'component'
        });
      });
    }
    
    return dependencies;
  }

  // 解析路径
  resolvePath(fromPath, importPath) {
    const dir = path.dirname(fromPath);
    let resolved = path.resolve(dir, importPath);
    
    // 尝试添加扩展名
    if (!fs.existsSync(resolved)) {
      for (const ext of ['.vue', '.js', '.ts']) {
        const withExt = resolved + ext;
        if (fs.existsSync(withExt)) {
          resolved = withExt;
          break;
        }
      }
    }
    
    return resolved;
  }

  // 获取依赖类型
  getDependencyType(importPath) {
    if (importPath.includes('utils')) return 'utility';
    if (importPath.includes('components')) return 'component';
    if (importPath.endsWith('.vue')) return 'component';
    if (importPath.endsWith('.js')) return 'module';
    return 'unknown';
  }

  // 检查是否为node模块
  isNodeModule(path) {
    return !path.startsWith('.') && !path.startsWith('/');
  }

  // 获取文件大小
  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return Math.round(stats.size / 1024); // KB
    } catch {
      return 0;
    }
  }

  // 计算文件复杂度
  calculateFileComplexity(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').length;
      const imports = (content.match(/import/g) || []).length;
      const functions = (content.match(/function|=>/g) || []).length;
      const conditions = (content.match(/if|switch|for|while/g) || []).length;
      
      return Math.round(lines * 0.1 + imports * 2 + functions * 3 + conditions * 2);
    } catch {
      return 0;
    }
  }

  // 构建反向依赖关系
  buildReverseDependencies() {
    this.dependencies.forEach((info, file) => {
      info.dependencies.forEach(dep => {
        if (!this.reverseDependencies.has(dep.file)) {
          this.reverseDependencies.set(dep.file, []);
        }
        this.reverseDependencies.get(dep.file).push(file);
      });
    });
  }

  // 生成依赖报告
  generateDependencyReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(),
      components: this.generateComponentAnalysis(),
      dependencyTree: this.generateDependencyTree(),
      circularDependencies: this.findCircularDependencies(),
      recommendations: this.generateRecommendations()
    };
    
    // 保存报告
    const reportPath = path.join(this.projectRoot, 'dependency-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📊 依赖分析报告:');
    console.log(`总文件数: ${report.summary.totalFiles}`);
    console.log(`组件数: ${report.summary.componentCount}`);
    console.log(`工具模块数: ${report.summary.utilityCount}`);
    console.log(`平均依赖数: ${report.summary.avgDependencies}`);
    console.log(`循环依赖: ${report.circularDependencies.length} 个`);
    
    if (report.circularDependencies.length > 0) {
      console.log('\n⚠️ 发现循环依赖:');
      report.circularDependencies.forEach(cycle => {
        console.log(`  ${cycle.join(' -> ')}`);
      });
    }
    
    console.log(`\n📄 详细报告: ${reportPath}`);
    
    return report;
  }

  // 生成摘要
  generateSummary() {
    const totalFiles = this.dependencies.size;
    const componentCount = Array.from(this.dependencies.values())
      .filter(info => info.type === 'components').length;
    const utilityCount = Array.from(this.dependencies.values())
      .filter(info => info.type === 'utils').length;
    
    const totalDeps = Array.from(this.dependencies.values())
      .reduce((sum, info) => sum + info.dependencies.length, 0);
    const avgDependencies = totalFiles > 0 ? Math.round(totalDeps / totalFiles * 10) / 10 : 0;
    
    return {
      totalFiles,
      componentCount,
      utilityCount,
      totalDependencies: totalDeps,
      avgDependencies
    };
  }

  // 生成组件分析
  generateComponentAnalysis() {
    const analysis = [];
    
    this.dependencies.forEach((info, file) => {
      const dependents = this.reverseDependencies.get(file) || [];
      
      analysis.push({
        file,
        type: info.type,
        size: info.size,
        complexity: info.complexity,
        dependencies: info.dependencies.length,
        dependents: dependents.length,
        dependencyFiles: info.dependencies.map(d => d.file),
        dependentFiles: dependents
      });
    });
    
    // 按依赖数排序
    analysis.sort((a, b) => b.dependencies - a.dependencies);
    
    return analysis;
  }

  // 生成依赖树
  generateDependencyTree() {
    const tree = {};
    
    this.dependencies.forEach((info, file) => {
      tree[file] = {
        dependencies: info.dependencies.map(d => d.file),
        level: this.calculateDependencyLevel(file, new Set())
      };
    });
    
    return tree;
  }

  // 计算依赖层级
  calculateDependencyLevel(file, visited) {
    if (visited.has(file)) return 0; // 避免循环
    
    visited.add(file);
    const info = this.dependencies.get(file);
    if (!info || info.dependencies.length === 0) return 0;
    
    const maxLevel = Math.max(
      ...info.dependencies.map(dep => 
        this.calculateDependencyLevel(dep.file, new Set(visited))
      )
    );
    
    return maxLevel + 1;
  }

  // 查找循环依赖
  findCircularDependencies() {
    const cycles = [];
    const visited = new Set();
    const recursionStack = new Set();
    
    this.dependencies.forEach((_, file) => {
      if (!visited.has(file)) {
        this.dfsForCycles(file, visited, recursionStack, [], cycles);
      }
    });
    
    return cycles;
  }

  // DFS查找循环
  dfsForCycles(file, visited, recursionStack, path, cycles) {
    visited.add(file);
    recursionStack.add(file);
    path.push(file);
    
    const info = this.dependencies.get(file);
    if (info) {
      for (const dep of info.dependencies) {
        if (!visited.has(dep.file)) {
          this.dfsForCycles(dep.file, visited, recursionStack, path, cycles);
        } else if (recursionStack.has(dep.file)) {
          // 找到循环
          const cycleStart = path.indexOf(dep.file);
          const cycle = path.slice(cycleStart).concat([dep.file]);
          cycles.push(cycle);
        }
      }
    }
    
    recursionStack.delete(file);
    path.pop();
  }

  // 生成建议
  generateRecommendations() {
    const recommendations = [];
    
    // 检查高依赖组件
    const highDependencyComponents = Array.from(this.dependencies.entries())
      .filter(([_, info]) => info.dependencies.length > 5)
      .map(([file]) => file);
    
    if (highDependencyComponents.length > 0) {
      recommendations.push({
        type: 'high_dependency',
        severity: 'warning',
        message: `${highDependencyComponents.length} 个组件依赖过多 (>5)`,
        files: highDependencyComponents,
        suggestion: '考虑拆分组件或使用依赖注入'
      });
    }
    
    // 检查孤立组件
    const orphanComponents = Array.from(this.dependencies.keys())
      .filter(file => !this.reverseDependencies.has(file) || 
                     this.reverseDependencies.get(file).length === 0);
    
    if (orphanComponents.length > 0) {
      recommendations.push({
        type: 'orphan_components',
        severity: 'info',
        message: `${orphanComponents.length} 个组件未被使用`,
        files: orphanComponents,
        suggestion: '考虑删除未使用的组件'
      });
    }
    
    // 检查循环依赖
    const cycles = this.findCircularDependencies();
    if (cycles.length > 0) {
      recommendations.push({
        type: 'circular_dependency',
        severity: 'error',
        message: `发现 ${cycles.length} 个循环依赖`,
        cycles,
        suggestion: '重构代码以消除循环依赖'
      });
    }
    
    return recommendations;
  }

  // 生成Mermaid图表
  generateMermaidDiagram() {
    let mermaid = 'graph TD\n';
    
    // 添加节点
    this.dependencies.forEach((info, file) => {
      const nodeId = file.replace(/[^a-zA-Z0-9]/g, '_');
      const label = file.replace('.vue', '').replace('.js', '');
      const color = info.type === 'components' ? '#e1f5fe' : '#f3e5f5';
      
      mermaid += `  ${nodeId}["${label}"]:::${info.type}\n`;
    });
    
    // 添加边
    this.dependencies.forEach((info, file) => {
      const fromId = file.replace(/[^a-zA-Z0-9]/g, '_');
      
      info.dependencies.forEach(dep => {
        const toId = dep.file.replace(/[^a-zA-Z0-9]/g, '_');
        if (this.dependencies.has(dep.file)) {
          mermaid += `  ${fromId} --> ${toId}\n`;
        }
      });
    });
    
    // 添加样式
    mermaid += '\n  classDef components fill:#e1f5fe,stroke:#01579b\n';
    mermaid += '  classDef utils fill:#f3e5f5,stroke:#4a148c\n';
    
    return mermaid;
  }

  // 生成HTML可视化
  generateHTMLVisualization() {
    const mermaidDiagram = this.generateMermaidDiagram();
    
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>组件依赖关系图</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
    .diagram { text-align: center; }
    .stats { display: flex; justify-content: space-around; margin: 20px 0; }
    .stat-card { background: white; padding: 15px; border-radius: 5px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔗 组件依赖关系图</h1>
    <p>生成时间: ${new Date().toLocaleString()}</p>
  </div>
  
  <div class="stats">
    <div class="stat-card">
      <h3>总文件数</h3>
      <p>${this.dependencies.size}</p>
    </div>
    <div class="stat-card">
      <h3>组件数</h3>
      <p>${Array.from(this.dependencies.values()).filter(i => i.type === 'components').length}</p>
    </div>
    <div class="stat-card">
      <h3>工具模块数</h3>
      <p>${Array.from(this.dependencies.values()).filter(i => i.type === 'utils').length}</p>
    </div>
  </div>
  
  <div class="diagram">
    <div class="mermaid">
${mermaidDiagram}
    </div>
  </div>
  
  <script>
    mermaid.initialize({ startOnLoad: true });
  </script>
</body>
</html>`;
    
    const htmlPath = path.join(this.projectRoot, 'dependency-graph.html');
    fs.writeFileSync(htmlPath, html);
    
    console.log(`🎨 可视化图表已生成: ${htmlPath}`);
    
    return htmlPath;
  }
}

// 命令行接口
if (require.main === module) {
  const analyzer = new DependencyAnalyzer();
  const args = process.argv.slice(2);
  
  switch (args[0]) {
    case 'analyze':
      analyzer.analyzeAllDependencies();
      break;
      
    case 'visualize':
      analyzer.analyzeAllDependencies();
      analyzer.generateHTMLVisualization();
      break;
      
    case 'mermaid':
      analyzer.analyzeAllDependencies();
      const diagram = analyzer.generateMermaidDiagram();
      console.log(diagram);
      break;
      
    default:
      console.log(`
🔗 依赖关系分析器

用法:
  node dependency-analyzer.js analyze    # 分析依赖关系
  node dependency-analyzer.js visualize  # 生成可视化图表
  node dependency-analyzer.js mermaid    # 输出Mermaid图表代码
      `);
  }
}

module.exports = DependencyAnalyzer;
