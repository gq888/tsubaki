#!/usr/bin/env node

/**
 * 基于renderToString的方法测试器
 * 通过覆盖created生命周期来执行测试方法
 * 支持动态按文件路径导入组件
 */

import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import path from 'path';
import { fileURLToPath } from 'url';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 默认状态文件路径
const DEFAULT_STATE_FILE = path.join(__dirname, '..', '.last-test-state.json');

// 模拟浏览器环境
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { href: 'http://localhost' }
};

global.document = {
  createElement: () => ({ style: {} }),
  addEventListener: () => {},
  removeEventListener: () => {}
};

// 模拟 localStorage
const localStorageMock = {
  _data: {
    "game-global-delay": "100"
  },
  getItem(key) {
    return this._data[key] || null;
  },
  setItem(key, value) {
    this._data[key] = String(value);
  },
  removeItem(key) {
    delete this._data[key];
  },
  clear() {
    this._data = {};
  }
};

global.localStorage = localStorageMock;

/**
 * 保存状态到JSON文件
 * @param {object} state - 要保存的状态对象
 * @param {string} filePath - 文件路径
 */
function saveStateToFile(state, filePath) {
  try {
    // 使用replacer处理循环引用和特殊对象
    const seen = new WeakMap(); // 使用WeakMap记录路径
    const pathStack = []; // 记录当前路径
    let hasCircular = false;
    
    const replacer = function(key, value) {
      // 跳过以_开头的属性
      if (typeof key === 'string' && key.startsWith('_')) {
        return undefined;
      }
      
      // 处理对象循环引用
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          const circularPath = seen.get(value);
          const currentPath = pathStack.join('.') + (key ? '.' + key : '');
          console.warn(`\n⚠️  检测到循环引用:`);
          console.warn(`   字段: ${currentPath}`);
          console.warn(`   引用回: ${circularPath}`);
          hasCircular = true;
          return undefined; // 跳过循环引用
        }
        
        const currentPath = pathStack.join('.') + (key ? '.' + key : '');
        seen.set(value, currentPath);
        pathStack.push(key);
      }
      
      return value;
    };
    
    const result = JSON.stringify(state, replacer, 2);
    
    if (hasCircular) {
      console.log(`\n⚠️  由于存在循环引用，部分字段已被跳过`);
    }
    
    writeFileSync(filePath, result, 'utf-8');
    console.log(`\n✓ 状态已保存到: ${filePath}`);
  } catch (error) {
    console.error(`\n✗ 保存状态失败: ${error.message}`);
  }
}

/**
 * 深度覆盖对象属性
 * 将源对象的所有属性深度复制到目标对象上，保持目标对象的引用
 * @param {any} target - 目标对象（已初始化的游戏对象）
 * @param {any} source - 源对象（保存的状态）
 * @param {string} path - 当前路径（用于调试）
 * @param {Set} visited - 已访问的对象（避免循环引用）
 */
function deepOverwrite(target, source, path = 'root', visited = new Set()) {
  // 避免循环引用
  if (visited.has(source)) {
    return;
  }
  
  // null 或 undefined 直接返回
  if (source === null || source === undefined) {
    return;
  }
  
  // 基本类型直接返回（不能覆盖，因为target是对象）
  if (typeof source !== 'object') {
    return;
  }
  
  visited.add(source);
  
  // 处理数组
  if (Array.isArray(source) && Array.isArray(target)) {
    console.log(`  深度覆盖数组: ${path}, source长度=${source.length}, target长度=${target.length}`);
    
    // 处理source范围内的元素（递归更新）
    const minLength = Math.min(source.length, target.length);
    for (let i = 0; i < minLength; i++) {
      const sourceItem = source[i];
      const targetItem = target[i];
      
      if (sourceItem && typeof sourceItem === 'object') {
        if (targetItem && typeof targetItem === 'object') {
          // 都是对象/数组，递归更新（保持target的引用和自定义类）
          deepOverwrite(targetItem, sourceItem, `${path}[${i}]`, visited);
        } else {
          // target不是对象，直接赋值（会丢失自定义类，但无法避免）
          console.log(`  ${path}[${i}] target不是对象，直接赋值`);
          target[i] = sourceItem;
        }
      } else {
        // source是基本类型，直接赋值
        target[i] = sourceItem;
      }
    }

    const diff = source.length - target.length;
    if (diff > 0) {
      // source更长：添加元素
      console.log(`  ${path} source更长，直接添加多余的${diff}个元素`);
      target.splice(target.length, 0, ...source.slice(target.length));
    } else if (diff < 0) {
      // target更长：删除元素  
      console.log(`  ${path} target更长，直接删除多余的${-diff}个元素`);
      target.splice(source.length, -diff);
    }
    
    return;
  }
  
  // 处理普通对象
  if (typeof source === 'object' && typeof target === 'object' && !Array.isArray(source) && !Array.isArray(target)) {
    console.log(`  深度覆盖对象: ${path}`);
    
    for (const key in source) {
      // 跳过原型链上的属性
      if (!source.hasOwnProperty(key)) {
        continue;
      }
      
      const sourceValue = source[key];
      const targetValue = target[key];
      const currentPath = `${path}.${key}`;
      
      // 跳过特殊属性
      if (key.startsWith('_')) {
        continue;
      }
      
      // 如果target没有这个属性，直接赋值
      if (!(key in target)) {
        console.log(`  添加新属性: ${currentPath}`);
        target[key] = sourceValue;
        continue;
      }
      
      // 基本类型、null、undefined 直接赋值
      if (sourceValue === null || sourceValue === undefined || typeof sourceValue !== 'object') {
        if (target[key] !== sourceValue) {
          console.log(`  覆盖基本类型: ${currentPath} = ${sourceValue}`);
          target[key] = sourceValue;
        }
        continue;
      }
      
      // 数组类型
      if (Array.isArray(sourceValue)) {
        if (Array.isArray(targetValue)) {
          // 目标也是数组，递归处理
          deepOverwrite(targetValue, sourceValue, currentPath, visited);
        } else {
          // 目标不是数组，直接替换
          console.log(`  替换为数组: ${currentPath}`);
          target[key] = sourceValue;
        }
        continue;
      }
      
      // 对象类型
      if (typeof sourceValue === 'object') {
        if (targetValue && typeof targetValue === 'object' && !Array.isArray(targetValue)) {
          // 目标也是对象，递归处理
          deepOverwrite(targetValue, sourceValue, currentPath, visited);
        } else {
          // 目标不是对象，直接替换
          console.log(`  替换为对象: ${currentPath}`);
          target[key] = sourceValue;
        }
        continue;
      }
    }
  }
}

/**
 * 使用renderToString执行组件方法
 * @param {number} timeout - 超时时间（毫秒），默认30秒
 * @param {number} seed - 随机数种子
 * @param {string} outputFile - 输出状态文件路径
 */
async function executeMethodWithRenderToString(componentPath, methodName, currentData = {}, args = [], timeout = 30000, seed = null, outputFile = DEFAULT_STATE_FILE) {
  try {
    console.log(`正在通过renderToString执行方法: ${methodName}`);
    console.log(`组件路径: ${componentPath}`);
    console.log(`超时设置: ${timeout}ms`);
    
    // 根据路径动态导入组件
    // 如果是相对路径，转换为绝对路径
    let absolutePath;
    if (path.isAbsolute(componentPath)) {
      absolutePath = componentPath;
    } else {
      // 相对于当前脚本目录的路径
      absolutePath = path.resolve(__dirname, '..', "src/components/" + componentPath);
    }
    
    console.log(`绝对路径: ${absolutePath}`);
    
    // 动态导入组件
    const componentModule = await import(`file://${absolutePath}`);
    const originalComponent = componentModule.default || componentModule;
    
    if (!originalComponent) {
      throw new Error(`无法从 ${componentPath} 导入组件`);
    }
    
    // 保存原始的created函数
    const originalCreated = originalComponent.created;
    
    // 创建状态捕获对象
    let capturedState = {
      before: null,
      after: null,
      result: null,
      error: null,
      errorStack: null
    };
    
    // 创建修改后的组件
    const modifiedComponent = {
      ...originalComponent,
      data() {
        // 只返回初始数据和测试对象，不在这里合并currentData
        const initialData = originalComponent.data ? originalComponent.data() : {};
        
        // 如果提供了种子，设置种子值
        if (seed !== null) {
          initialData.seed = seed;
        }
        
        return {
          ...initialData,
          _testCapture: capturedState // 添加状态捕获对象
        };
      },
      async created() {
        console.log('=== 修改后的created生命周期执行 ===');
        
        // 执行原始的created函数（初始化所有对象）
        if (originalCreated) {
          if (originalCreated.constructor.name === 'AsyncFunction') {
            await originalCreated.call(this);
          } else {
            originalCreated.call(this);
          }
        }
        
        console.log('原始created执行完成，开始状态恢复...');
        
        // 如果有保存的状态，使用深度覆盖恢复所有数据
        if (currentData && Object.keys(currentData).length > 0) {
          console.log('检测到保存的状态，开始深度恢复...');
          console.log('保存状态的键:', Object.keys(currentData));
          
          // 使用深度覆盖函数恢复状态
          deepOverwrite(this, currentData, 'this');
          
          // 打印恢复后的关键状态
          console.log('✓ 状态恢复完成');
          if (this.gameManager) {
            console.log('  gameManager步数:', this.gameManager.getStepCount ? this.gameManager.getStepCount() : 'N/A');
            console.log('  gameManager状态:', {
              winflag: this.gameManager.winflag,
              loseflag: this.gameManager.loseflag,
              drawflag: this.gameManager.drawflag
            });
          }
          if (this.arr) {
            console.log('  arr数组长度:', this.arr.length);
            console.log('  arr内容:', this.arr);
          }
        }
        
        // 捕获执行前状态 - 使用JSON深拷贝避免循环引用
        const beforeState = JSON.parse(JSON.stringify(this.$data, (key, value) => {
          if (key.startsWith('_')) return undefined;
          return value;
        }));
        this._testCapture.before = beforeState;
        
        console.log(`=== 执行方法 ${methodName} ===`);
        
        // 执行目标方法
        try {
          if (this[methodName] && typeof this[methodName] === 'function') {
            console.log(`开始执行${methodName}方法，当前游戏状态: win=${this.gameManager?.winflag}, lose=${this.gameManager?.loseflag}, draw=${this.gameManager?.drawflag}`);
            console.log(`游戏步数: ${this.gameManager?.getStepCount()}, 自动运行状态: ${this.gameManager?.isAutoRunning}`);
            
            console.log('准备调用方法...');
            const methodPromise = this[methodName].apply(this, args);
            console.log(`方法返回类型: ${typeof methodPromise}, 是否是Promise: ${methodPromise && typeof methodPromise.then === 'function'}`);
            
            // 检查返回值是否是 Promise
            if (methodPromise && typeof methodPromise.then === 'function') {
              console.log('等待 Promise resolve...');
              
              // 创建超时Promise
              const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                  reject(new Error(`TIMEOUT: 方法执行超时 (${timeout}ms)`));
                }, timeout);
              });
              
              // 使用Promise.race实现超时控制
              this._testCapture.result = await Promise.race([
                methodPromise,
                timeoutPromise
              ]);
              
              console.log('Promise 已 resolve');
            } else {
              this._testCapture.result = methodPromise;
              console.log('同步方法执行完成');
            }
            
            console.log(`${methodName}方法执行完成，最终游戏状态: win=${this.gameManager?.winflag}, lose=${this.gameManager?.loseflag}, draw=${this.gameManager?.drawflag}`);
            console.log(`最终游戏步数: ${this.gameManager?.getStepCount()}, 自动运行状态: ${this.gameManager?.isAutoRunning}`);
          } else {
            throw new Error(`方法 ${methodName} 不存在`);
          }
        } catch (error) {
          // 检测超时异常并停止自动运行
          if (error.message && error.message.startsWith('TIMEOUT:')) {
            console.error('⏱️  超时异常:', error.message);
            if (this.gameManager && typeof this.gameManager.stopAuto === 'function') {
              console.log('正在停止自动运行...');
              this.gameManager.stopAuto();
              console.log('自动运行已停止');
            }
          } else {
            console.error('❌ 方法执行错误:', error.message);
          }
          
          this._testCapture.error = error.message;
          this._testCapture.errorStack = error.stack;
          console.error('错误堆栈:', error.stack);
        }
        
        // 捕获执行后状态 - 使用JSON深拷贝避免循环引用
        const afterState = JSON.parse(JSON.stringify(this.$data, (key, value) => {
          if (key.startsWith('_')) return undefined;
          return value;
        }));
        this._testCapture.after = afterState;
        
        console.log('=== 状态捕获完成 ===');
        const gameManager = afterState.gameManager;
        if (gameManager) {
          console.log(`After状态: win=${gameManager.winflag}, lose=${gameManager.loseflag}, draw=${gameManager.drawflag}`);
        }
        
        console.log('=== 方法执行完成 ===');
        
        // 直接打印测试结果，而不是通过模板
        const testResult = {
          methodName: methodName,
          args: args,
          result: this._testCapture.result,
          error: this._testCapture.error,
          errorStack: this._testCapture.errorStack,
          before: this._testCapture.before,
          after: this._testCapture.after,
          gameFlags: {
            winflag: this._testCapture.after ? this._testCapture.after.winflag : false,
            loseflag: this._testCapture.after ? this._testCapture.after.loseflag : false,
            drawflag: this._testCapture.after ? this._testCapture.after.drawflag : false
          },
          testSuccess: (this._testCapture.after && (this._testCapture.after.winflag || this._testCapture.after.loseflag || this._testCapture.after.drawflag))
        };
        
        console.log('\n=== 测试结果 ===');
        
        // 使用自定义replacer处理循环引用和特殊对象
        const seen = new WeakMap();
        const pathStack = [];
        let hasCircular = false;
        
        const replacer = function(key, value) {
          // 跳过以_开头的属性
          if (typeof key === 'string' && key.startsWith('_')) {
            return undefined;
          }
          
          // 处理对象循环引用
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
              const circularPath = seen.get(value);
              const currentPath = pathStack.join('.') + (key ? '.' + key : '');
              if (!hasCircular) {
                console.warn(`\n⚠️  检测到循环引用:`);
                hasCircular = true;
              }
              console.warn(`   字段: ${currentPath} -> 引用回: ${circularPath}`);
              return '[Circular]';
            }
            
            const currentPath = pathStack.join('.') + (key ? '.' + key : '');
            seen.set(value, currentPath);
            pathStack.push(key);
          }
          
          return value;
        };
        
        console.log(JSON.stringify(testResult, replacer, 2));
        
        // 保存执行后的状态到文件
        if (this._testCapture.after) {
          saveStateToFile(this._testCapture.after, outputFile);
        }
        
        process.exit(0);
      },
      // 简单的模板，不输出任何内容
      template: '<div>Test completed</div>'
    };
    
    // 创建SSR应用并渲染
    const app = createSSRApp(modifiedComponent);
    const html = await renderToString(app);
    
    // 不需要返回详细信息，因为结果已经在created生命周期中打印了
    return {
      success: true,
      note: "测试结果已通过console.log输出"
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('用法: node renderToString-method-tester.js <component-path> <method-name> [args...] [--timeout=<ms>] [--state=<json>] [--state-file=<path>] [--seed=<number>] [--continue] [--output=<path>]');
    console.log('\n基础示例:');
    console.log('  node renderToString-method-tester.js src/components/Chess.js init 0'); // 注意：文件名为Chess.js但内部组件已重命名为GridBattle
    console.log('  node renderToString-method-tester.js Spider.js clickCard 0');
    console.log('\n参数格式示例:');
    console.log('  基本类型: node ... clickCard 0 1 true "hello"');
    console.log('  JSON对象: node ... method \'{"key":"value"}\'');
    console.log('  JSON数组: node ... method \'[1,2,3]\'');
    console.log('  混合参数: node ... method 0 \'{"x":10}\' \'[1,2]\'');
    console.log('\n高级选项:');
    console.log('  --timeout=60000      设置超时（默认30000ms）');
    console.log('  --seed=12345         设置随机种子（可重现测试）');
    console.log('  --continue           使用上次保存的状态');
    console.log('  --state=\'{"..."}\'    直接传入状态JSON');
    console.log('  --state-file=x.json  从文件读取状态');
    console.log('  --output=out.json    指定输出文件（默认: .last-test-state.json）');
    console.log('\n说明:');
    console.log('  • 参数会自动尝试JSON解析，失败则作为字符串');
    console.log('  • 支持相对路径和绝对路径');
    console.log('  • 执行后状态自动保存到 .last-test-state.json');
    console.log('  • 超时后自动调用 gameManager.stopAuto()');
    process.exit(1);
  }
  
  const componentPath = args[0];
  const methodName = args[1];
  
  // 提取timeout、state、state-file、seed、continue和output参数
  let timeout = 30000;
  let currentState = {};
  let seed = null;
  let outputFile = DEFAULT_STATE_FILE;
  const methodArgs = [];
  
  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--timeout=')) {
      timeout = parseInt(arg.split('=')[1], 10);
      if (isNaN(timeout) || timeout <= 0) {
        console.error('错误: timeout必须是正整数');
        process.exit(1);
      }
    } else if (arg.startsWith('--seed=')) {
      seed = parseInt(arg.split('=')[1], 10);
      if (isNaN(seed)) {
        console.error('错误: seed必须是整数');
        process.exit(1);
      }
      console.log('✓ 将使用种子:', seed);
    } else if (arg.startsWith('--output=')) {
      outputFile = arg.substring('--output='.length);
      // 如果不是绝对路径，相对于项目根目录
      if (!path.isAbsolute(outputFile)) {
        outputFile = path.join(__dirname, '..', outputFile);
      }
      console.log('✓ 输出文件:', outputFile);
    } else if (arg === '--continue') {
      // 使用上次保存的状态
      try {
        const { readFileSync } = await import('fs');
        const stateContent = readFileSync(DEFAULT_STATE_FILE, 'utf-8');
        currentState = JSON.parse(stateContent);
        console.log('✓ 已加载上次保存的状态:', DEFAULT_STATE_FILE);
      } catch (error) {
        console.error('错误: 无法读取上次保存的状态文件:', error.message);
        console.error('提示: 请先运行一次测试以生成状态文件');
        process.exit(1);
      }
    } else if (arg.startsWith('--state=')) {
      const stateJson = arg.substring('--state='.length);
      try {
        currentState = JSON.parse(stateJson);
        console.log('✓ 成功解析状态对象');
      } catch (error) {
        console.error('错误: 无法解析状态JSON:', error.message);
        process.exit(1);
      }
    } else if (arg.startsWith('--state-file=')) {
      const stateFilePath = arg.substring('--state-file='.length);
      try {
        const { readFileSync } = await import('fs');
        const stateContent = readFileSync(stateFilePath, 'utf-8');
        currentState = JSON.parse(stateContent);
        console.log('✓ 成功从文件读取状态对象:', stateFilePath);
      } catch (error) {
        console.error('错误: 无法读取状态文件:', error.message);
        process.exit(1);
      }
    } else {
      methodArgs.push(arg);
    }
  }
  
  // 尝试解析JSON参数
  const parsedArgs = methodArgs.map(arg => {
    try {
      return JSON.parse(arg);
    } catch {
      return arg;
    }
  });
  
  await executeMethodWithRenderToString(componentPath, methodName, currentState, parsedArgs, timeout, seed, outputFile);
}

// 直接调用main函数
main().catch(console.error);

export { executeMethodWithRenderToString };
