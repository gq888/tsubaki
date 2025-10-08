#!/usr/bin/env node

/**
 * 游戏组件生成器
 * 快速生成基于工厂函数的新游戏组件
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class ComponentGenerator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.componentsDir = path.join(this.projectRoot, 'src/components');
    this.routerFile = path.join(this.projectRoot, 'src/router/index.js');
  }

  // 交互式组件生成
  async generateInteractive() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const ask = (question) => new Promise(resolve => rl.question(question, resolve));

    try {
      console.log('🎮 游戏组件生成器\n');
      
      const name = await ask('组件名称 (如: Snake): ');
      const title = await ask(`游戏标题 (默认: ${name}): `) || name;
      const route = await ask(`路由路径 (默认: /${name.toLowerCase()}): `) || `/${name.toLowerCase()}`;
      
      console.log('\n选择游戏类型:');
      console.log('1. 简单游戏 (无撤销)');
      console.log('2. 卡牌游戏 (支持撤销)');
      console.log('3. 配对游戏 (计时器)');
      console.log('4. 益智游戏 (提示功能)');
      console.log('5. 策略游戏 (难度设置)');
      console.log('6. 动作游戏 (计分系统)');
      console.log('7. 自定义游戏');
      
      const typeChoice = await ask('\n选择类型 (1-7): ');
      const autoDelay = await ask('自动模式延迟 (毫秒, 默认500): ') || '500';
      
      let features = [];
      if (typeChoice === '7') {
        console.log('\n可选功能 (多选，用逗号分隔):');
        console.log('timer - 计时器');
        console.log('score - 计分系统');
        console.log('difficulty - 难度设置');
        const featuresInput = await ask('选择功能: ');
        features = featuresInput.split(',').map(f => f.trim()).filter(Boolean);
      }

      rl.close();

      const config = {
        name,
        title,
        route,
        type: parseInt(typeChoice),
        autoDelay: parseInt(autoDelay),
        features
      };

      await this.generateComponent(config);
      
    } catch (error) {
      console.error('❌ 生成失败:', error.message);
      rl.close();
    }
  }

  // 生成组件
  async generateComponent(config) {
    const { name, title, route, type, autoDelay, features } = config;
    
    console.log(`\n🔨 生成组件: ${name}`);
    
    // 生成 .js 文件
    const jsContent = this.generateJSFile(name, title);
    const jsPath = path.join(this.componentsDir, `${name}.js`);
    fs.writeFileSync(jsPath, jsContent);
    console.log(`✅ 创建: ${name}.js`);
    
    // 生成 .vue 文件
    const vueContent = this.generateVueFile(name, type, autoDelay, features);
    const vuePath = path.join(this.componentsDir, `${name}.vue`);
    fs.writeFileSync(vuePath, vueContent);
    console.log(`✅ 创建: ${name}.vue`);
    
    // 更新路由
    this.updateRouter(name, route);
    console.log(`✅ 更新路由: ${route}`);
    
    console.log(`\n🎉 组件生成完成！`);
    console.log(`访问: http://localhost:8081${route}`);
  }

  // 生成JS文件内容
  generateJSFile(name, title) {
    return `export default {
  name: "${name}",
  data() {
    return {
      title: "${title}",
      // 游戏数据
      gameData: [],
      currentState: 'ready'
    };
  },
  created() {
    this.init();
  },
  methods: {
    // 初始化游戏
    init() {
      console.log('${title} 初始化');
      // TODO: 实现初始化逻辑
    },
    
    // 游戏步骤
    async stepFn() {
      // TODO: 实现游戏步骤逻辑
      console.log('执行游戏步骤');
    },
    
    // 检查胜利条件
    checkWin() {
      // TODO: 实现胜利检查逻辑
      return false;
    },
    
    // 检查失败条件
    checkLose() {
      // TODO: 实现失败检查逻辑
      return false;
    }
  },
  computed: {
    // 游戏状态计算属性
    gameStatus() {
      if (this.checkWin()) return 'win';
      if (this.checkLose()) return 'lose';
      return 'playing';
    }
  }
};`;
  }

  // 生成Vue文件内容
  generateVueFile(name, type, autoDelay, features) {
    const presetMap = {
      1: 'simpleGame',
      2: 'cardGame', 
      3: 'pairGame',
      4: 'puzzleGame',
      5: 'strategyGame',
      6: 'actionGame',
      7: 'customGame'
    };
    
    const preset = presetMap[type];
    let factoryCall;
    
    if (type === 7) {
      // 自定义游戏
      factoryCall = `GameComponentPresets.customGame(${name}, {
  autoStepDelay: ${autoDelay},
  features: [${features.map(f => `'${f}'`).join(', ')}],
  customLogic() {
    // 自定义逻辑
  }
})`;
    } else {
      factoryCall = `GameComponentPresets.${preset}(${name}, ${autoDelay})`;
    }

    return `<template>
  <div class="Sum">
    <h1>{{ title }}</h1>
    
    <GameControls
      v-bind="gameControlsConfig"
      @undo="undo"
      @goon="goon"
      @step="stepFn"
      @auto="pass"
    />
    
    <div class="row">
      <span>STEP: {{ step }}</span>
    </div>
    
    <div class="row">
      <div class="game-area">
        <!-- TODO: 添加游戏内容 -->
        <p>游戏区域 - 请实现游戏界面</p>
      </div>
    </div>
    
    <GameResultModal
      v-if="winflag"
      title="U WIN!"
      :buttons="[{
        text: 'GO ON',
        callback: goon,
        disabled: false
      }]"
    />
    
    <GameResultModal
      v-if="loseflag"
      title="U LOSE"
      :buttons="[{
        text: 'GO ON', 
        callback: goon,
        disabled: false
      }]"
    />
  </div>
</template>

<script>
import ${name} from "./${name}.js";
import { GameComponentPresets } from "../utils/gameComponentFactory.js";

// 使用工厂函数创建增强的${name}组件
export default ${factoryCall};
</script>

<style scoped>
@import url("./sum.css");

.game-area {
  min-height: 300px;
  border: 2px dashed #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 0;
}
</style>`;
  }

  // 更新路由配置
  updateRouter(name, route) {
    let routerContent = fs.readFileSync(this.routerFile, 'utf8');
    
    // 添加导入
    const importLine = `import ${name} from "@/components/${name}.vue";`;
    const importRegex = /(import.*from.*vue.*;\s*)/g;
    const imports = routerContent.match(importRegex);
    if (imports && !routerContent.includes(importLine)) {
      const lastImport = imports[imports.length - 1];
      routerContent = routerContent.replace(lastImport, lastImport + importLine + '\n');
    }
    
    // 添加路由
    const routeConfig = `  {
    path: "${route}",
    component: ${name}
  },`;
    
    const routesEndRegex = /(\];)/;
    if (!routerContent.includes(`path: "${route}"`)) {
      routerContent = routerContent.replace(routesEndRegex, routeConfig + '\n$1');
    }
    
    fs.writeFileSync(this.routerFile, routerContent);
  }

  // 批量生成示例组件
  generateExamples() {
    const examples = [
      {
        name: 'Snake',
        title: 'Snake Game',
        route: '/snake',
        type: 6, // actionGame
        autoDelay: 200,
        features: ['score']
      },
      {
        name: 'Puzzle15',
        title: '15 Puzzle',
        route: '/puzzle15',
        type: 4, // puzzleGame
        autoDelay: 800,
        features: []
      },
      {
        name: 'Memory',
        title: 'Memory Game',
        route: '/memory',
        type: 3, // pairGame
        autoDelay: 1000,
        features: []
      }
    ];

    console.log('🎮 生成示例组件...\n');
    
    examples.forEach(config => {
      try {
        this.generateComponent(config);
      } catch (error) {
        console.error(`❌ 生成 ${config.name} 失败:`, error.message);
      }
    });
  }
}

// 命令行接口
if (require.main === module) {
  const generator = new ComponentGenerator();
  const args = process.argv.slice(2);
  
  switch (args[0]) {
    case 'interactive':
    case 'i':
      generator.generateInteractive();
      break;
      
    case 'examples':
      generator.generateExamples();
      break;
      
    case 'quick':
      const name = args[1];
      const type = parseInt(args[2]) || 1;
      if (name) {
        generator.generateComponent({
          name,
          title: name,
          route: `/${name.toLowerCase()}`,
          type,
          autoDelay: 500,
          features: []
        });
      } else {
        console.log('用法: node generate-component.js quick <ComponentName> [type]');
      }
      break;
      
    default:
      console.log(`
🎮 游戏组件生成器

用法:
  node generate-component.js interactive  # 交互式生成
  node generate-component.js examples     # 生成示例组件
  node generate-component.js quick <Name> [type]  # 快速生成

游戏类型:
  1 - 简单游戏    4 - 益智游戏    7 - 自定义游戏
  2 - 卡牌游戏    5 - 策略游戏
  3 - 配对游戏    6 - 动作游戏
      `);
  }
}

module.exports = ComponentGenerator;
