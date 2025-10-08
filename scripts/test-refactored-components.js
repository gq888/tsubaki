#!/usr/bin/env node

/**
 * 重构组件自动化测试脚本
 * 验证重构后的组件功能完整性
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ComponentTester {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.componentsDir = path.join(this.projectRoot, 'src/components');
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  // 测试组件文件是否存在
  testComponentExists(componentName) {
    const componentPath = path.join(this.componentsDir, componentName);
    const exists = fs.existsSync(componentPath);
    
    this.recordTest(
      `${componentName} 文件存在性`,
      exists,
      exists ? '组件文件存在' : '组件文件不存在'
    );
    
    return exists;
  }

  // 测试组件语法正确性
  testComponentSyntax(componentName) {
    try {
      const componentPath = path.join(this.componentsDir, componentName);
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // 检查基本Vue组件结构
      const hasTemplate = content.includes('<template>');
      const hasScript = content.includes('<script>');
      const hasStyle = content.includes('<style>');
      
      // 检查必要的导入
      const hasFactoryImport = content.includes('gameComponentFactory') || 
                              content.includes('GameComponentPresets');
      
      // 检查导出
      const hasExport = content.includes('export default');
      
      const syntaxValid = hasTemplate && hasScript && hasExport;
      const factoryUsed = hasFactoryImport;
      
      this.recordTest(
        `${componentName} 语法检查`,
        syntaxValid,
        syntaxValid ? '语法正确' : '语法错误'
      );
      
      this.recordTest(
        `${componentName} 工厂函数使用`,
        factoryUsed,
        factoryUsed ? '使用工厂函数' : '未使用工厂函数'
      );
      
      return { syntaxValid, factoryUsed };
      
    } catch (error) {
      this.recordTest(
        `${componentName} 语法检查`,
        false,
        `读取文件错误: ${error.message}`
      );
      return { syntaxValid: false, factoryUsed: false };
    }
  }

  // 测试组件代码减少情况
  testCodeReduction(originalComponent, refactoredComponent) {
    try {
      const originalPath = path.join(this.componentsDir, originalComponent);
      const refactoredPath = path.join(this.componentsDir, refactoredComponent);
      
      if (!fs.existsSync(originalPath) || !fs.existsSync(refactoredPath)) {
        this.recordTest(
          `${refactoredComponent} 代码减少`,
          false,
          '原组件或重构组件不存在'
        );
        return;
      }
      
      const originalLines = fs.readFileSync(originalPath, 'utf8').split('\n').length;
      const refactoredLines = fs.readFileSync(refactoredPath, 'utf8').split('\n').length;
      const reduction = originalLines - refactoredLines;
      const reductionPercent = ((reduction / originalLines) * 100).toFixed(1);
      
      const significantReduction = reduction > 20; // 至少减少20行
      
      this.recordTest(
        `${refactoredComponent} 代码减少`,
        significantReduction,
        `减少 ${reduction} 行 (${reductionPercent}%)`
      );
      
      return { originalLines, refactoredLines, reduction, reductionPercent };
      
    } catch (error) {
      this.recordTest(
        `${refactoredComponent} 代码减少`,
        false,
        `测试错误: ${error.message}`
      );
    }
  }

  // 测试组件功能完整性
  testComponentFunctionality(componentName) {
    try {
      const componentPath = path.join(this.componentsDir, componentName);
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // 检查必要的功能
      const checks = {
        hasGameControls: content.includes('GameControls') || content.includes('gameControlsConfig'),
        hasGameResultModal: content.includes('GameResultModal'),
        hasGameStateManager: content.includes('GameStateManager') || content.includes('gameManager'),
        hasEventHandlers: content.includes('@step') || content.includes('@auto') || content.includes('@goon'),
        hasComputedProperties: content.includes('computed') || content.includes('gameControlsConfig'),
        hasProperExport: content.includes('GameComponentPresets') && content.includes('export default')
      };
      
      const functionalityScore = Object.values(checks).filter(Boolean).length;
      const totalChecks = Object.keys(checks).length;
      const functionalityPercent = ((functionalityScore / totalChecks) * 100).toFixed(1);
      
      const functionalityComplete = functionalityScore >= totalChecks * 0.8; // 80%以上通过
      
      this.recordTest(
        `${componentName} 功能完整性`,
        functionalityComplete,
        `${functionalityScore}/${totalChecks} 项通过 (${functionalityPercent}%)`
      );
      
      // 详细检查结果
      Object.entries(checks).forEach(([check, passed]) => {
        this.recordTest(
          `${componentName} - ${check}`,
          passed,
          passed ? '✓' : '✗'
        );
      });
      
      return { checks, functionalityScore, functionalityPercent };
      
    } catch (error) {
      this.recordTest(
        `${componentName} 功能完整性`,
        false,
        `测试错误: ${error.message}`
      );
    }
  }

  // 测试模板一致性
  testTemplateConsistency(componentName) {
    try {
      const componentPath = path.join(this.componentsDir, componentName);
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // 提取template部分
      const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
      if (!templateMatch) {
        this.recordTest(
          `${componentName} 模板一致性`,
          false,
          '未找到template标签'
        );
        return;
      }
      
      const template = templateMatch[1];
      
      // 检查模板一致性
      const consistencyChecks = {
        hasTitle: template.includes('{{ title }}'),
        hasGameControls: template.includes('<GameControls') || template.includes('v-bind="gameControlsConfig"'),
        hasGameResultModal: template.includes('<GameResultModal'),
        hasProperEventBinding: template.includes('@step') || template.includes('@auto'),
        hasConditionalRendering: template.includes('v-if') || template.includes('v-show'),
        hasProperStyling: template.includes('class=') || template.includes(':class=')
      };
      
      const consistencyScore = Object.values(consistencyChecks).filter(Boolean).length;
      const totalChecks = Object.keys(consistencyChecks).length;
      const consistencyPercent = ((consistencyScore / totalChecks) * 100).toFixed(1);
      
      const templateConsistent = consistencyScore >= totalChecks * 0.7; // 70%以上通过
      
      this.recordTest(
        `${componentName} 模板一致性`,
        templateConsistent,
        `${consistencyScore}/${totalChecks} 项通过 (${consistencyPercent}%)`
      );
      
      return { consistencyChecks, consistencyScore, consistencyPercent };
      
    } catch (error) {
      this.recordTest(
        `${componentName} 模板一致性`,
        false,
        `测试错误: ${error.message}`
      );
    }
  }

  // 记录测试结果
  recordTest(testName, passed, details) {
    this.testResults.total++;
    if (passed) {
      this.testResults.passed++;
    } else {
      this.testResults.failed++;
    }
    
    this.testResults.details.push({
      test: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
    
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}: ${details}`);
  }

  // 运行所有测试
  runAllTests() {
    console.log('🧪 开始重构组件测试...\n');
    
    const refactoredComponents = [
      'FishRefactored.vue',
      'MonthRefactored.vue',
      'SpiderRefactored.vue', 
      'ChessRefactored.vue',
      'PairsFactory.vue',
      'TortoiseRefactored.vue'
    ];
    
    const originalComponents = [
      'fish.vue',
      'month.vue',
      'Spider.vue',
      'Chess.vue',
      'Pairs.vue',
      'Tortoise.vue'
    ];
    
    // 测试重构组件
    refactoredComponents.forEach((component, index) => {
      console.log(`\n📋 测试组件: ${component}`);
      
      // 基础测试
      if (this.testComponentExists(component)) {
        this.testComponentSyntax(component);
        this.testComponentFunctionality(component);
        this.testTemplateConsistency(component);
        
        // 代码减少测试
        const originalComponent = originalComponents[index];
        if (originalComponent) {
          this.testCodeReduction(originalComponent, component);
        }
      }
    });
    
    // 生成测试报告
    this.generateTestReport();
  }

  // 生成测试报告
  generateTestReport() {
    console.log('\n📊 测试报告生成中...');
    
    const report = {
      summary: {
        total: this.testResults.total,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        successRate: ((this.testResults.passed / this.testResults.total) * 100).toFixed(1)
      },
      timestamp: new Date().toISOString(),
      details: this.testResults.details
    };
    
    // 保存报告
    const reportPath = path.join(this.projectRoot, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // 控制台输出摘要
    console.log('\n📈 测试摘要:');
    console.log(`总测试数: ${report.summary.total}`);
    console.log(`通过: ${report.summary.passed}`);
    console.log(`失败: ${report.summary.failed}`);
    console.log(`成功率: ${report.summary.successRate}%`);
    
    if (report.summary.failed > 0) {
      console.log('\n❌ 失败的测试:');
      this.testResults.details
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  - ${test.test}: ${test.details}`);
        });
    }
    
    console.log(`\n📄 详细报告已保存到: ${reportPath}`);
    
    return report;
  }

  // 性能基准测试
  runPerformanceTests() {
    console.log('\n⚡ 开始性能测试...');
    
    try {
      // 构建项目进行性能测试
      console.log('构建项目...');
      execSync('npm run build', { 
        cwd: this.projectRoot,
        stdio: 'pipe'
      });
      
      // 分析构建产物大小
      const distPath = path.join(this.projectRoot, 'dist');
      if (fs.existsSync(distPath)) {
        const stats = this.analyzeBuildSize(distPath);
        console.log('📦 构建产物分析:');
        console.log(`  总大小: ${stats.totalSize} KB`);
        console.log(`  JS文件: ${stats.jsSize} KB`);
        console.log(`  CSS文件: ${stats.cssSize} KB`);
        
        this.recordTest(
          '构建产物大小',
          stats.totalSize < 5000, // 小于5MB
          `总大小: ${stats.totalSize} KB`
        );
      }
      
    } catch (error) {
      this.recordTest(
        '性能测试',
        false,
        `构建失败: ${error.message}`
      );
    }
  }

  // 分析构建产物大小
  analyzeBuildSize(distPath) {
    const stats = { totalSize: 0, jsSize: 0, cssSize: 0 };
    
    const analyzeDir = (dir) => {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          analyzeDir(filePath);
        } else {
          const sizeKB = Math.round(stat.size / 1024);
          stats.totalSize += sizeKB;
          
          if (file.endsWith('.js')) {
            stats.jsSize += sizeKB;
          } else if (file.endsWith('.css')) {
            stats.cssSize += sizeKB;
          }
        }
      });
    };
    
    analyzeDir(distPath);
    return stats;
  }
}

// 命令行接口
if (require.main === module) {
  const tester = new ComponentTester();
  const args = process.argv.slice(2);
  
  switch (args[0]) {
    case 'all':
      tester.runAllTests();
      if (args.includes('--performance')) {
        tester.runPerformanceTests();
      }
      break;
      
    case 'performance':
      tester.runPerformanceTests();
      break;
      
    case 'component':
      const componentName = args[1];
      if (componentName) {
        tester.testComponentExists(componentName);
        tester.testComponentSyntax(componentName);
        tester.testComponentFunctionality(componentName);
        tester.testTemplateConsistency(componentName);
        tester.generateTestReport();
      } else {
        console.log('请指定组件名称');
      }
      break;
      
    default:
      console.log(`
使用方法:
  node test-refactored-components.js all [--performance]  # 运行所有测试
  node test-refactored-components.js performance  # 运行性能测试
  node test-refactored-components.js component <name>  # 测试特定组件
      `);
  }
}

module.exports = ComponentTester;
