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
import { writeFileSync, readFileSync, watchFile, unwatchFile } from 'fs';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 检测命令行参数中是否包含--interactive
const isInteractiveMode = process.argv.includes('--interactive');

// 规范化组件路径 - 全局函数，供所有地方使用
function getAbsoluteComponentPath(relativePath) {
  // 动态导入组件
  let absolutePath;
  if (path.isAbsolute(relativePath)) {
    absolutePath = relativePath;
  } else {
    absolutePath = path.resolve(__dirname, '..', "src/components/" + relativePath);
  }
  
  return absolutePath;
}

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
      target.splice(target.length, 0, ...source.slice(target.length));
    } else if (diff < 0) {
      // target更长：删除元素  
      target.splice(source.length, -diff);
    }
    
    return;
  }
  
  // 处理普通对象
  if (typeof source === 'object' && typeof target === 'object' && !Array.isArray(source) && !Array.isArray(target)) {
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
        target[key] = sourceValue;
        continue;
      }
      
      // 基本类型、null、undefined 直接赋值
      if (sourceValue === null || sourceValue === undefined || typeof sourceValue !== 'object') {
        if (target[key] !== sourceValue) {
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
          target[key] = sourceValue;
        }
        continue;
      }
    }
  }
}

/**
 * 等待文件变化（用于异步方法完成检测）
 * @param {string} filePath - 要监听的文件路径
 * @param {number} timeout - 超时时间（毫秒）
 * @returns {Promise<boolean>} - 是否在超时前检测到文件变化
 */
async function waitForFileChange(filePath, timeout = 60000) {
  return new Promise((resolve) => {
    let fileChanged = false;
    let timer;
    let watchListener;
    
    // 获取文件初始状态
    let initialMtime = 0;
    let initialSize = 0;
    let fileExists = false;
    try {
      const stats = readFileSync(filePath);
      initialMtime = stats.mtime ? stats.mtime.getTime() : 0;
      initialSize = stats.size;
      fileExists = true;
    } catch (error) {
      // 文件不存在，初始状态为0
      console.log('📝 文件不存在，将等待文件创建或更新: ', error.message);
    }
    
    // 设置超时
    timer = setTimeout(() => {
      if (!fileChanged) {
        if (watchListener) {
          unwatchFile(filePath);
        }
        console.log(`⏱️  文件变化监听超时 (${timeout}ms)`);
        resolve(false);
      }
    }, timeout);
    
    // 监听文件变化
    watchListener = (curr, prev) => {
      if (!fileChanged) {
        // 安全地获取修改时间，处理mtime可能为undefined的情况
        const currMtime = curr.mtime ? curr.mtime.getTime() : 0;
        const mtimeChanged = currMtime !== initialMtime;
        const sizeChanged = curr.size !== initialSize;
        
        if (mtimeChanged || sizeChanged) {
          fileChanged = true;
          clearTimeout(timer);
          unwatchFile(filePath);
          console.log('✓ 检测到文件变化，异步方法执行完成');
          resolve(true);
        }
      }
    };
    
    watchFile(filePath, { interval: 100 }, watchListener);
    
    // 如果文件已存在，立即检查一次是否需要等待变化
    if (fileExists) {
      console.log('⏳ 文件已存在，开始监听...');
    }
  });
}

/**
 * 使用renderToString执行组件方法
 * @param {number} timeout - 超时时间（毫秒），默认30秒
 * @param {number} seed - 随机数种子
 * @param {string} outputFile - 输出状态文件路径
 * @param {boolean} waitForAsync - 是否等待异步方法完成（交互模式专用）
 */
async function executeMethodWithRenderToString(componentPath, methodName, currentData = {}, args = [], timeout = 60000, seed = null, outputFile = DEFAULT_STATE_FILE, maxSteps = null) {
  try {
    console.log(`正在通过renderToString执行方法: ${methodName}`);
    console.log(`组件路径: ${componentPath}`);
    console.log(`超时设置: ${timeout}ms`);
    
  // 根据路径动态导入组件
  let absolutePath = getAbsoluteComponentPath(componentPath);
    
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

        if (maxSteps !== null) {
          initialData.gameManager.maxSteps = maxSteps;
        }
        
        return {
          ...initialData,
          _testCapture: capturedState, // 添加状态捕获对象
          jsonResult: "" // 添加jsonResult属性用于存储序列化结果
        };
      },
      async created() {
        // 执行原始的created函数（初始化所有对象）
        if (originalCreated) {
          if (originalCreated.constructor.name === 'AsyncFunction') {
            await originalCreated.call(this);
          } else {
            originalCreated.call(this);
          }
        }
        // 如果有保存的状态，使用深度覆盖恢复所有数据
        if (currentData && Object.keys(currentData).length > 0) {
          
          // 使用深度覆盖函数恢复状态
          deepOverwrite(this, currentData, 'this');
          
          if (this.gameManager) {
            console.log('  gameManager步数:', this.gameManager.getStepCount ? this.gameManager.getStepCount() : 'N/A');
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
            const methodPromise = this[methodName].apply(this, args);
            
            // 检查返回值是否是 Promise
            if (methodPromise && typeof methodPromise.then === 'function') {
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
              // 标记为异步方法
              this._testCapture.isAsync = true;
            } else {
              this._testCapture.result = methodPromise;
              this._testCapture.isAsync = false;
              console.log('同步方法执行完成');
            }
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
        }
        
        // 捕获执行后状态 - 使用JSON深拷贝避免循环引用
        const afterState = JSON.parse(JSON.stringify(this.$data, (key, value) => {
          if (key.startsWith('_')) return undefined;
          return value;
        }));
        this._testCapture.after = afterState;
        
        const gameManager = afterState.gameManager;
        
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
        
        // 保存执行后的状态到文件
        if (this._testCapture.after) {
          saveStateToFile(this._testCapture.after, outputFile);
        }
        
        // 只有在非交互式模式下才退出进程
        // 在交互式模式下，需要让进程继续运行，以便后续操作
        if (!isInteractiveMode) {
          console.log(JSON.stringify(testResult, replacer, 2));
          process.exit(0);
        }
        // 对于同步方法，返回过滤了循环引用的JSON序列化结果
        if (!this._testCapture.isAsync && this._testCapture.result !== undefined) {
          try {
            // 使用与之前相同的replacer处理循环引用
            const seen = new WeakMap();
            const pathStack = [];
            
            const replacer = function(key, value) {
              // 跳过以_开头的属性
              if (typeof key === 'string' && key.startsWith('_')) {
                return undefined;
              }
              
              // 处理对象循环引用
              if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) {
                  return '[Circular]';
                }
                
                const currentPath = pathStack.join('.') + (key ? '.' + key : '');
                seen.set(value, currentPath);
                pathStack.push(key);
              }
              
              return value;
            };
            
            // 将JSON编码为base64 ASCII格式，避免被渲染函数二次处理
            const jsonStr = JSON.stringify(this._testCapture.result, replacer);
            this.jsonResult = Buffer.from(jsonStr).toString('base64');
          } catch (e) {
            // 如果序列化失败，返回错误信息
            this.jsonResult = e.message;
          }
        }
        else this.jsonResult = "";
      },
      template: "<div>{{jsonResult}}</div>"
    };
    
    // 创建SSR应用并渲染
    const app = createSSRApp(modifiedComponent);
    const html = await renderToString(app);
    // 返回详细信息，包括测试结果
    return {
      success: true,
      html,
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
 * 交互式游戏循环
 */
async function interactiveGameLoop(componentPath, seed = null, timeout = 60000, outputFile = DEFAULT_STATE_FILE) {
  try {
    // 使用统一的路径规范化函数
    const absolutePath = getAbsoluteComponentPath(componentPath);
    
    const componentModule = await import(`file://${absolutePath}`);
    const gameComponent = componentModule.default || componentModule;
    
    // 初始化游戏状态
    let currentState = {};
    
    // 先执行 init 方法初始化游戏
    console.log('\n🎮 初始化游戏...');
    await executeMethodWithRenderToString(componentPath, 'init', currentState, [], timeout, seed, outputFile);
    
    // 读取初始化后的状态
    const stateContent = readFileSync(outputFile, 'utf-8');
    currentState = JSON.parse(stateContent);
    
    // 创建 readline 接口
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const question = (prompt) => new Promise((resolve) => rl.question(prompt, resolve));
    
    let gameRunning = true;
    let turnCount = 0;
    
    while (gameRunning) {
      turnCount++;
      console.log('\n' + '='.repeat(60));
      console.log(`第 ${turnCount} 回合`);
      console.log('='.repeat(60));
      
      // 调用游戏的 renderTextView 方法显示当前状态
      console.log('\n📊 当前游戏状态:');
      try {
        const result = await executeMethodWithRenderToString(
          componentPath, 
          'renderTextView', 
          currentState, 
          [], 
          timeout, 
          seed, 
          outputFile
        );
        
        // 重新读取状态（renderTextView 可能会更新状态）
        const newStateContent = readFileSync(outputFile, 'utf-8');
        currentState = JSON.parse(newStateContent);
      } catch (error) {
        console.log('\n⚠️  renderTextView 方法未实现或执行出错');
        console.log('当前状态摘要:', {
          step: currentState.step || 0,
          title: currentState.title
        });
      }
      
      // 检查游戏是否结束
      if (currentState.gameManager) {
        const { winflag, loseflag, drawflag } = currentState.gameManager;
        if (winflag || loseflag || drawflag) {
          console.log('\n🏁 游戏结束!');
          if (winflag) console.log('🎉 你赢了！');
          if (loseflag) console.log('😢 你输了！');
          if (drawflag) console.log('🤝 平局！');
          break;
        }
      }
      
      // 获取可用操作
      console.log('\n🎯 可用操作:');
      let actions = [];
      
      try {
        // 直接从executeMethodWithRenderToString的返回值中获取actions，而不是从文件读取
        // 我们需要修改executeMethodWithRenderToString方法以返回测试结果
        const actionsResult = await executeMethodWithRenderToString(
          componentPath,
          'getAvailableActions',
          currentState,
          [],
          timeout,
          seed,
          outputFile
        );
        
        // 直接使用html中的JSON数据作为actions
        // html格式为<div>base64编码的JSON字符串</div>，需要解码后使用
        if (actionsResult.html) {
          try {
            // 提取div标签中的内容
            const jsonMatch = actionsResult.html.match(/<div>(.*?)<\/div>/);
            if (jsonMatch && jsonMatch[1]) {
              // 解码base64字符串为原始JSON
              const decodedStr = Buffer.from(jsonMatch[1], 'base64').toString('utf-8');
              const resultObj = JSON.parse(decodedStr);
              if (Array.isArray(resultObj)) {
                actions = resultObj;
              } else if (resultObj && Array.isArray(resultObj.result)) {
                actions = resultObj.result;
              }
            }
          } catch (parseError) {
            console.error('无法获取actions:', parseError.message);
            console.error('错误详情:', parseError.stack);
          }
        }
      } catch (error) {
        // 如果没有实现 getAvailableActions，使用默认按钮
        console.log('提示: 该游戏未实现 getAvailableActions 方法，使用默认操作');
      }
      
      // 显示操作选项
      actions.forEach(action => {
        console.log(`  [${action.id}] ${action.label}`);
      });
      console.log('  [0] 退出游戏');
      
      // 获取用户输入
      const input = await question('\n请选择操作 (输入数字): ');
      const choice = parseInt(input);
      
      if (choice === 0) {
        console.log('\n👋 退出游戏');
        gameRunning = false;
        break;
      }
      
      const selectedAction = actions.find(a => a.id === choice);
      if (!selectedAction) {
        console.log('\n❌ 无效的选择，请重试');
        continue;
      }
        
      // 如果是异步方法且需要等待完成，在方法执行前就开始监听文件变化
      let fileWatchPromise = waitForFileChange(outputFile, timeout);
      
      // 执行选择的操作
      console.log(`\n⚙️  执行: ${selectedAction.label}`);
      try {
        await executeMethodWithRenderToString(
          componentPath,
          selectedAction.method,
          currentState,
          selectedAction.args || [],
          timeout,
          seed,
          outputFile
        );

        // 如果检测到异步方法且需要等待，等待文件变化监听结果
        if (fileWatchPromise) {
          // 等待文件变化监听结果
          const fileChanged = await fileWatchPromise;
        }
        
        // 重新读取更新后的状态
        const updatedStateContent = readFileSync(outputFile, 'utf-8');
        currentState = JSON.parse(updatedStateContent);
      } catch (error) {
        console.log(`\n❌ 执行失败: ${error.message}`);
      }
    }
    
    rl.close();
    console.log('\n✅ 交互式游戏结束');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ 交互式游戏出错:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * 主函数
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('用法: node renderToString-method-tester.js <component-path> <method-name> [args...] [--timeout=<ms>] [--state=<json>] [--state-file=<path>] [--seed=<number>] [--continue] [--output=<path>] [--interactive] [--set-max-steps=<number>]');
    console.log('\n交互模式:');
    console.log('  node renderToString-method-tester.js Tortoise.js --interactive');
    console.log('  node renderToString-method-tester.js Sort.js --interactive --seed=12345');
    console.log('\n基础示例:');
    console.log('  node renderToString-method-tester.js src/components/Chess.js init 0'); // 注意：文件名为Chess.js但内部组件已重命名为GridBattle
    console.log('  node renderToString-method-tester.js Spider.js clickCard 0');
    console.log('\n参数格式示例:');
    console.log('  基本类型: node ... clickCard 0 1 true "hello"');
    console.log('  JSON对象: node ... method \'{"key":"value"}\'');
    console.log('  JSON数组: node ... method \'[1,2,3]\'');
    console.log('  混合参数: node ... method 0 \'{"x":10}\' \'[1,2]\'');
    console.log('\n高级选项:');
    console.log('  --timeout=60000      设置超时（默认60000ms）');
    console.log('  --seed=12345         设置随机种子（可重现测试）');
    console.log('  --continue           使用上次保存的状态');
    console.log('  --state=\'{"..."}\'    直接传入状态JSON');
    console.log('  --state-file=x.json  从文件读取状态');
    console.log('  --output=out.json    指定输出文件（默认: .last-test-state.json）');
    console.log('  --set-max-steps=N    设置自动模式最大步数（用于测试自动停止）');
    console.log('\n说明:');
    console.log('  • 参数会自动尝试JSON解析，失败则作为字符串');
    console.log('  • 支持相对路径和绝对路径');
    console.log('  • 执行后状态自动保存到 .last-test-state.json');
    console.log('  • 超时后自动调用 gameManager.stopAuto()');
    process.exit(1);
  }
  
  const componentPath = args[0];
  
  // 检查是否是交互模式
  const isInteractive = args.includes('--interactive');
  
  if (isInteractive) {
    // 交互模式
    let seed = null;
    let timeout = 60000;
    let outputFile = DEFAULT_STATE_FILE;
    
    for (let i = 1; i < args.length; i++) {
      const arg = args[i];
      if (arg.startsWith('--seed=')) {
        seed = parseInt(arg.split('=')[1], 10);
        if (isNaN(seed)) {
          console.error('错误: seed必须是整数');
          process.exit(1);
        }
      } else if (arg.startsWith('--timeout=')) {
        timeout = parseInt(arg.split('=')[1], 10);
          if (isNaN(timeout) || timeout <= 0) {
            console.error('错误: timeout必须是正整数');
          process.exit(1);
        }
      } else if (arg.startsWith('--output=')) {
        outputFile = arg.substring('--output='.length);
        if (!path.isAbsolute(outputFile)) {
          outputFile = path.join(__dirname, '..', outputFile);
        }
      }
    }
    
    await interactiveGameLoop(componentPath, seed, timeout, outputFile);
    return;
  }
  
  // 非交互模式，需要至少2个参数
  if (args.length < 2) {
    console.log('错误: 非交互模式需要指定方法名');
    console.log('用法: node renderToString-method-tester.js <component-path> <method-name> [args...]');
    process.exit(1);
  }
  
  const methodName = args[1];
  
  // 提取timeout、state、state-file、seed、continue、output和set-max-steps参数
  let timeout = 60000;
  let currentState = {};
  let seed = null;
  let outputFile = DEFAULT_STATE_FILE;
  let maxSteps = null; // 新增：最大步数参数
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
    } else if (arg.startsWith('--set-max-steps=')) {
      maxSteps = parseInt(arg.split('=')[1], 10);
      if (isNaN(maxSteps) || maxSteps <= 0) {
        console.error('错误: set-max-steps必须是正整数');
        process.exit(1);
      }
      console.log('✓ 将设置最大步数为:', maxSteps);
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
  
  await executeMethodWithRenderToString(componentPath, methodName, currentState, parsedArgs, timeout, seed, outputFile, maxSteps);
}

// 直接调用main函数
main().catch(console.error);

export { executeMethodWithRenderToString };
