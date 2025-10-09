#!/usr/bin/env node

/**
 * 项目状态检查工具
 * 全面检查项目完成度和健康状况
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProjectStatusChecker {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.status = {
      overall: 'unknown',
      components: {},
      tools: {},
      documentation: {},
      tests: {},
      performance: {}
    };
  }

  // 检查项目整体状态
  checkProjectStatus() {
    console.log('🔍 检查项目状态...\n');
    
    this.checkComponents();
    this.checkTools();
    this.checkDocumentation();
    this.checkTests();
    this.checkPerformance();
    this.generateStatusReport();
    
    return this.status;
  }

  // 检查组件状态
  checkComponents() {
    console.log('📦 检查组件状态...');
    
    const componentsDir = path.join(this.projectRoot, 'src/components');
    const components = fs.readdirSync(componentsDir)
      .filter(file => file.endsWith('.vue'));
    
    const refactoredComponents = components.filter(comp => 
      comp.includes('Refactored') || comp.includes('Factory')
    );
    
    const originalComponents = [
      'fish.vue', 'month.vue', 'Spider.vue', 
      'Chess.vue', 'Pairs.vue', 'Tortoise.vue'
    ];
    
    const migratedComponents = originalComponents.filter(comp => {
      const filePath = path.join(componentsDir, comp);
      if (!fs.existsSync(filePath)) return false;
      
      const content = fs.readFileSync(filePath, 'utf8');
      return content.includes('GameComponentPresets');
    });
    
    this.status.components = {
      total: components.length,
      refactored: refactoredComponents.length,
      migrated: migratedComponents.length,
      originalComponents,
      migratedComponents,
      migrationComplete: migratedComponents.length === originalComponents.length
    };
    
    console.log(`  总组件数: ${components.length}`);
    console.log(`  重构组件: ${refactoredComponents.length}`);
    console.log(`  已迁移: ${migratedComponents.length}/${originalComponents.length}`);
    console.log(`  迁移完成: ${this.status.components.migrationComplete ? '✅' : '❌'}`);
  }

  // 检查工具状态
  checkTools() {
    console.log('\n🛠️ 检查工具状态...');
    
    const scriptsDir = path.join(this.projectRoot, 'scripts');
    const expectedTools = [
      'migrate-components.js',
      'test-refactored-components.js', 
      'generate-component.js',
      'performance-monitor.js',
      'dependency-analyzer.js',
      'dev-optimizer.js',
      'project-status.js'
    ];
    
    const existingTools = expectedTools.filter(tool => 
      fs.existsSync(path.join(scriptsDir, tool))
    );
    
    // 检查package.json中的脚本
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8')
    );
    
    const scriptCount = Object.keys(packageJson.scripts).length;
    
    this.status.tools = {
      expectedTools: expectedTools.length,
      existingTools: existingTools.length,
      missingTools: expectedTools.filter(tool => !existingTools.includes(tool)),
      scriptCommands: scriptCount,
      toolsComplete: existingTools.length === expectedTools.length
    };
    
    console.log(`  工具脚本: ${existingTools.length}/${expectedTools.length}`);
    console.log(`  NPM命令: ${scriptCount}`);
    console.log(`  工具完整: ${this.status.tools.toolsComplete ? '✅' : '❌'}`);
  }

  // 检查文档状态
  checkDocumentation() {
    console.log('\n📚 检查文档状态...');
    
    const expectedDocs = [
      'README.md',
      'COMPONENT_LIBRARY.md',
      'MIGRATION_GUIDE.md', 
      'PROJECT_COMPLETE.md',
      'REFACTORING_SUMMARY.md'
    ];
    
    const existingDocs = expectedDocs.filter(doc => 
      fs.existsSync(path.join(this.projectRoot, doc))
    );
    
    // 检查文档内容质量
    const docQuality = {};
    existingDocs.forEach(doc => {
      const content = fs.readFileSync(path.join(this.projectRoot, doc), 'utf8');
      docQuality[doc] = {
        length: content.length,
        sections: (content.match(/^#+/gm) || []).length,
        codeBlocks: (content.match(/```/g) || []).length / 2
      };
    });
    
    this.status.documentation = {
      expectedDocs: expectedDocs.length,
      existingDocs: existingDocs.length,
      missingDocs: expectedDocs.filter(doc => !existingDocs.includes(doc)),
      docQuality,
      docsComplete: existingDocs.length === expectedDocs.length
    };
    
    console.log(`  文档文件: ${existingDocs.length}/${expectedDocs.length}`);
    console.log(`  文档完整: ${this.status.documentation.docsComplete ? '✅' : '❌'}`);
  }

  // 检查测试状态
  checkTests() {
    console.log('\n🧪 检查测试状态...');
    
    try {
      // 运行测试
      const testResult = execSync('npm run test:refactored', {
        cwd: this.projectRoot,
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      // 解析测试结果
      const passedMatch = testResult.match(/通过:\s*(\d+)/);
      const failedMatch = testResult.match(/失败:\s*(\d+)/);
      const totalMatch = testResult.match(/总测试数:\s*(\d+)/);
      
      const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
      const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
      const total = totalMatch ? parseInt(totalMatch[1]) : 0;
      
      this.status.tests = {
        total,
        passed,
        failed,
        successRate: total > 0 ? Math.round((passed / total) * 100) : 0,
        testsHealthy: (passed / total) >= 0.9
      };
      
      console.log(`  测试总数: ${total}`);
      console.log(`  通过率: ${this.status.tests.successRate}%`);
      console.log(`  测试健康: ${this.status.tests.testsHealthy ? '✅' : '❌'}`);
      
    } catch (error) {
      this.status.tests = {
        total: 0,
        passed: 0,
        failed: 0,
        successRate: 0,
        testsHealthy: false,
        error: error.message
      };
      
      console.log(`  测试执行: ❌ (${error.message.split('\n')[0]})`);
    }
  }

  // 检查性能状态
  checkPerformance() {
    console.log('\n⚡ 检查性能状态...');
    
    try {
      // 运行复杂度分析
      const complexityResult = execSync('npm run perf:complexity', {
        cwd: this.projectRoot,
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      // 解析复杂度结果
      const lines = complexityResult.split('\n');
      const componentLines = lines.filter(line => line.includes('vue'));
      
      const highComplexity = componentLines.filter(line => line.includes('🔴')).length;
      const mediumComplexity = componentLines.filter(line => line.includes('🟡')).length;
      const lowComplexity = componentLines.filter(line => line.includes('🟢')).length;
      
      this.status.performance = {
        totalComponents: componentLines.length,
        highComplexity,
        mediumComplexity,
        lowComplexity,
        performanceHealthy: highComplexity === 0 && mediumComplexity <= 3
      };
      
      console.log(`  组件总数: ${componentLines.length}`);
      console.log(`  高复杂度: ${highComplexity}`);
      console.log(`  中复杂度: ${mediumComplexity}`);
      console.log(`  低复杂度: ${lowComplexity}`);
      console.log(`  性能健康: ${this.status.performance.performanceHealthy ? '✅' : '⚠️'}`);
      
    } catch (error) {
      this.status.performance = {
        totalComponents: 0,
        highComplexity: 0,
        mediumComplexity: 0,
        lowComplexity: 0,
        performanceHealthy: false,
        error: error.message
      };
      
      console.log(`  性能分析: ❌ (${error.message.split('\n')[0]})`);
    }
  }

  // 生成状态报告
  generateStatusReport() {
    console.log('\n📊 生成状态报告...');
    
    // 计算整体健康度
    const healthChecks = [
      this.status.components.migrationComplete,
      this.status.tools.toolsComplete,
      this.status.documentation.docsComplete,
      this.status.tests.testsHealthy,
      this.status.performance.performanceHealthy
    ];
    
    const healthScore = healthChecks.filter(Boolean).length;
    const totalChecks = healthChecks.length;
    const healthPercentage = Math.round((healthScore / totalChecks) * 100);
    
    if (healthPercentage >= 90) {
      this.status.overall = 'excellent';
    } else if (healthPercentage >= 80) {
      this.status.overall = 'good';
    } else if (healthPercentage >= 70) {
      this.status.overall = 'fair';
    } else {
      this.status.overall = 'poor';
    }
    
    // 保存详细报告
    const report = {
      timestamp: new Date().toISOString(),
      healthScore: `${healthScore}/${totalChecks}`,
      healthPercentage,
      overall: this.status.overall,
      details: this.status
    };
    
    const reportPath = path.join(this.projectRoot, 'project-status-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // 输出摘要
    console.log('\n🎯 项目状态摘要:');
    console.log(`整体健康度: ${healthPercentage}% (${this.getHealthEmoji(this.status.overall)})`);
    console.log(`组件迁移: ${this.status.components.migrationComplete ? '✅' : '❌'}`);
    console.log(`工具完整: ${this.status.tools.toolsComplete ? '✅' : '❌'}`);
    console.log(`文档完整: ${this.status.documentation.docsComplete ? '✅' : '❌'}`);
    console.log(`测试健康: ${this.status.tests.testsHealthy ? '✅' : '❌'}`);
    console.log(`性能健康: ${this.status.performance.performanceHealthy ? '✅' : '⚠️'}`);
    
    if (this.status.overall === 'excellent') {
      console.log('\n🎉 项目状态优秀！所有系统运行正常。');
    } else {
      console.log('\n💡 改进建议:');
      this.generateRecommendations();
    }
    
    console.log(`\n📄 详细报告: ${reportPath}`);
  }

  // 获取健康度表情
  getHealthEmoji(status) {
    const emojis = {
      excellent: '🟢 优秀',
      good: '🟡 良好', 
      fair: '🟠 一般',
      poor: '🔴 较差'
    };
    return emojis[status] || '❓ 未知';
  }

  // 生成改进建议
  generateRecommendations() {
    const recommendations = [];
    
    if (!this.status.components.migrationComplete) {
      const remaining = this.status.components.originalComponents.length - 
                       this.status.components.migrated;
      recommendations.push(`完成剩余 ${remaining} 个组件的迁移`);
    }
    
    if (!this.status.tools.toolsComplete) {
      recommendations.push(`添加缺失的工具: ${this.status.tools.missingTools.join(', ')}`);
    }
    
    if (!this.status.documentation.docsComplete) {
      recommendations.push(`完善缺失的文档: ${this.status.documentation.missingDocs.join(', ')}`);
    }
    
    if (!this.status.tests.testsHealthy) {
      recommendations.push(`提高测试通过率 (当前: ${this.status.tests.successRate}%)`);
    }
    
    if (!this.status.performance.performanceHealthy) {
      recommendations.push(`优化高复杂度组件 (${this.status.performance.highComplexity} 个)`);
    }
    
    recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }

  // 快速健康检查
  quickHealthCheck() {
    console.log('⚡ 快速健康检查...\n');
    
    const checks = [
      {
        name: '开发服务器',
        check: () => {
          try {
            const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
            return packageJson.scripts.serve ? true : false;
          } catch {
            return false;
          }
        }
      },
      {
        name: '工厂函数',
        check: () => fs.existsSync(path.join(this.projectRoot, 'src/utils/gameComponentFactory.js'))
      },
      {
        name: '迁移工具',
        check: () => fs.existsSync(path.join(this.projectRoot, 'scripts/migrate-components.js'))
      },
      {
        name: '测试工具',
        check: () => fs.existsSync(path.join(this.projectRoot, 'scripts/test-refactored-components.js'))
      },
      {
        name: '文档系统',
        check: () => fs.existsSync(path.join(this.projectRoot, 'COMPONENT_LIBRARY.md'))
      }
    ];
    
    checks.forEach(({ name, check }) => {
      const result = check();
      console.log(`${result ? '✅' : '❌'} ${name}`);
    });
    
    const passedChecks = checks.filter(({ check }) => check()).length;
    const healthPercentage = Math.round((passedChecks / checks.length) * 100);
    
    console.log(`\n整体健康度: ${healthPercentage}%`);
    
    return healthPercentage >= 80;
  }
}

// 命令行接口
if (require.main === module) {
  const checker = new ProjectStatusChecker();
  const args = process.argv.slice(2);
  
  switch (args[0]) {
    case 'full':
      checker.checkProjectStatus();
      break;
      
    case 'quick':
      checker.quickHealthCheck();
      break;
      
    case 'components':
      checker.checkComponents();
      break;
      
    case 'tools':
      checker.checkTools();
      break;
      
    case 'docs':
      checker.checkDocumentation();
      break;
      
    case 'tests':
      checker.checkTests();
      break;
      
    case 'performance':
      checker.checkPerformance();
      break;
      
    default:
      console.log(`
🔍 项目状态检查工具

用法:
  node project-status.js full         # 完整状态检查
  node project-status.js quick        # 快速健康检查
  node project-status.js components   # 检查组件状态
  node project-status.js tools        # 检查工具状态
  node project-status.js docs         # 检查文档状态
  node project-status.js tests        # 检查测试状态
  node project-status.js performance  # 检查性能状态
      `);
  }
}

module.exports = ProjectStatusChecker;
