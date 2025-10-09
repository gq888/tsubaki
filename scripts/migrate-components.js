#!/usr/bin/env node

/**
 * 游戏组件迁移脚本
 * 用于逐步将原组件替换为重构后的组件
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 组件映射配置
const COMPONENT_MAPPING = {
  'fish.vue': 'FishRefactored.vue',
  'month.vue': 'MonthRefactored.vue', 
  'Spider.vue': 'SpiderRefactored.vue',
  'Chess.vue': 'ChessRefactored.vue',
  'Pairs.vue': 'PairsFactory.vue',
  'Tortoise.vue': 'TortoiseRefactored.vue'
};

// 路由映射配置
const ROUTE_MAPPING = {
  '/fish': '/fish-refactored',
  '/month': '/month-refactored',
  '/Spider': '/spider-refactored', 
  '/Chess': '/chess-refactored',
  '/Pairs': '/pairs-factory',
  '/Tortoise': '/tortoise-refactored'
};

class ComponentMigrator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.componentsDir = path.join(this.projectRoot, 'src/components');
    this.routerFile = path.join(this.projectRoot, 'src/router/index.js');
    this.backupDir = path.join(this.projectRoot, 'backup');
  }

  // 创建备份目录
  createBackup() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `backup-${timestamp}`);
    fs.mkdirSync(backupPath, { recursive: true });
    
    console.log(`📦 创建备份目录: ${backupPath}`);
    return backupPath;
  }

  // 备份原组件
  backupComponent(componentName, backupPath) {
    const sourcePath = path.join(this.componentsDir, componentName);
    const targetPath = path.join(backupPath, componentName);
    
    if (fs.existsSync(sourcePath)) {
      fs.copyFileSync(sourcePath, targetPath);
      console.log(`✅ 备份组件: ${componentName}`);
      return true;
    }
    return false;
  }

  // 替换组件
  replaceComponent(oldComponent, newComponent) {
    const oldPath = path.join(this.componentsDir, oldComponent);
    const newPath = path.join(this.componentsDir, newComponent);
    
    if (!fs.existsSync(newPath)) {
      console.error(`❌ 新组件不存在: ${newComponent}`);
      return false;
    }
    
    // 重命名新组件为原组件名
    const tempPath = oldPath + '.temp';
    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, tempPath);
    }
    
    fs.copyFileSync(newPath, oldPath);
    
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
    
    console.log(`🔄 替换组件: ${oldComponent} -> ${newComponent}`);
    return true;
  }

  // 更新路由配置
  updateRoutes() {
    let routerContent = fs.readFileSync(this.routerFile, 'utf8');
    
    // 移除重构后的测试路由
    const testRoutes = [
      '/fish-refactored',
      '/month-refactored', 
      '/spider-refactored',
      '/chess-refactored',
      '/pairs-factory',
      '/tortoise-refactored'
    ];
    
    testRoutes.forEach(route => {
      const routePattern = new RegExp(`\\s*{[^}]*path:\\s*["']${route}["'][^}]*},?\\s*`, 'g');
      routerContent = routerContent.replace(routePattern, '');
    });
    
    // 移除重构后组件的导入
    const refactoredImports = [
      'FishRefactored',
      'MonthRefactored',
      'SpiderRefactored', 
      'ChessRefactored',
      'PairsFactory',
      'TortoiseRefactored'
    ];
    
    refactoredImports.forEach(importName => {
      const importPattern = new RegExp(`import\\s+${importName}\\s+from\\s+["'][^"']*["'];?\\s*`, 'g');
      routerContent = routerContent.replace(importPattern, '');
    });
    
    // 清理多余的空行和注释
    routerContent = routerContent.replace(/\/\/\s*重构后的组件[\s\S]*?(?=\];)/g, '');
    routerContent = routerContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    fs.writeFileSync(this.routerFile, routerContent);
    console.log('🔄 更新路由配置完成');
  }

  // 验证组件功能
  validateComponents() {
    console.log('🧪 开始验证组件功能...');
    
    Object.keys(COMPONENT_MAPPING).forEach(component => {
      const componentPath = path.join(this.componentsDir, component);
      if (fs.existsSync(componentPath)) {
        const content = fs.readFileSync(componentPath, 'utf8');
        
        // 检查是否包含必要的导入
        const hasGameStateManager = content.includes('GameStateManager');
        const hasGameControls = content.includes('GameControls');
        const hasGameResultModal = content.includes('GameResultModal');
        
        if (hasGameStateManager && hasGameControls && hasGameResultModal) {
          console.log(`✅ ${component} - 功能验证通过`);
        } else {
          console.warn(`⚠️  ${component} - 可能缺少必要功能`);
        }
      }
    });
  }

  // 执行完整迁移
  migrate(options = {}) {
    const { dryRun = false, components = null } = options;
    
    console.log('🚀 开始组件迁移...');
    console.log(`模式: ${dryRun ? '预览模式' : '实际执行'}`);
    
    if (dryRun) {
      console.log('\n📋 迁移计划:');
      Object.entries(COMPONENT_MAPPING).forEach(([old, newComp]) => {
        console.log(`  ${old} -> ${newComp}`);
      });
      return;
    }
    
    // 创建备份
    const backupPath = this.createBackup();
    
    // 备份原组件
    let backedUp = 0;
    Object.keys(COMPONENT_MAPPING).forEach(component => {
      if (this.backupComponent(component, backupPath)) {
        backedUp++;
      }
    });
    
    console.log(`📦 备份完成: ${backedUp} 个组件`);
    
    // 替换组件
    let replaced = 0;
    const componentsToMigrate = components || Object.keys(COMPONENT_MAPPING);
    
    componentsToMigrate.forEach(oldComponent => {
      const newComponent = COMPONENT_MAPPING[oldComponent];
      if (newComponent && this.replaceComponent(oldComponent, newComponent)) {
        replaced++;
      }
    });
    
    console.log(`🔄 替换完成: ${replaced} 个组件`);
    
    // 更新路由
    this.updateRoutes();
    
    // 验证组件
    this.validateComponents();
    
    console.log('\n✅ 迁移完成！');
    console.log(`备份位置: ${backupPath}`);
    console.log('如需回滚，请运行: npm run rollback');
  }

  // 回滚迁移
  rollback(backupPath) {
    if (!backupPath || !fs.existsSync(backupPath)) {
      console.error('❌ 备份路径不存在');
      return;
    }
    
    console.log('🔄 开始回滚...');
    
    let restored = 0;
    Object.keys(COMPONENT_MAPPING).forEach(component => {
      const backupFile = path.join(backupPath, component);
      const targetFile = path.join(this.componentsDir, component);
      
      if (fs.existsSync(backupFile)) {
        fs.copyFileSync(backupFile, targetFile);
        restored++;
        console.log(`✅ 恢复组件: ${component}`);
      }
    });
    
    console.log(`✅ 回滚完成: ${restored} 个组件`);
  }

  // 生成迁移报告
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      components: {},
      summary: {
        total: 0,
        migrated: 0,
        codeReduction: 0
      }
    };
    
    Object.entries(COMPONENT_MAPPING).forEach(([old, newComp]) => {
      const oldPath = path.join(this.componentsDir, old);
      const newPath = path.join(this.componentsDir, newComp);
      
      let oldLines = 0, newLines = 0;
      
      if (fs.existsSync(oldPath)) {
        oldLines = fs.readFileSync(oldPath, 'utf8').split('\n').length;
      }
      
      if (fs.existsSync(newPath)) {
        newLines = fs.readFileSync(newPath, 'utf8').split('\n').length;
      }
      
      report.components[old] = {
        original: oldLines,
        refactored: newLines,
        reduction: oldLines - newLines,
        migrated: fs.existsSync(oldPath)
      };
      
      report.summary.total++;
      if (fs.existsSync(oldPath)) {
        report.summary.migrated++;
      }
      report.summary.codeReduction += oldLines - newLines;
    });
    
    const reportPath = path.join(this.projectRoot, 'migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('📊 迁移报告已生成:', reportPath);
    console.log(`总计减少代码: ${report.summary.codeReduction} 行`);
    
    return report;
  }
}

// 命令行接口
if (require.main === module) {
  const migrator = new ComponentMigrator();
  const args = process.argv.slice(2);
  
  switch (args[0]) {
    case 'migrate':
      const dryRun = args.includes('--dry-run');
      migrator.migrate({ dryRun });
      break;
      
    case 'rollback':
      const backupPath = args[1];
      migrator.rollback(backupPath);
      break;
      
    case 'report':
      migrator.generateReport();
      break;
      
    case 'validate':
      migrator.validateComponents();
      break;
      
    default:
      console.log(`
使用方法:
  node migrate-components.js migrate [--dry-run]  # 执行迁移
  node migrate-components.js rollback <backup-path>  # 回滚迁移
  node migrate-components.js report  # 生成迁移报告
  node migrate-components.js validate  # 验证组件功能
      `);
  }
}

module.exports = ComponentMigrator;
