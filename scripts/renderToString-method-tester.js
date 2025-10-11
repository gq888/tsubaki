#!/usr/bin/env node

/**
 * 基于renderToString的方法测试器
 * 通过覆盖created生命周期来执行测试方法
 */

import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import path from 'path';
import { fileURLToPath } from 'url';

// 预导入所有真实的游戏组件（.js文件，已包含工厂模式）
import ChessComponent from '../src/components/Chess.js';
import SpiderComponent from '../src/components/Spider.js';
import TortoiseComponent from '../src/components/Tortoise.js';
import PairsComponent from '../src/components/Pairs.js';
import SortComponent from '../src/components/Sort.js';
import fishComponent from '../src/components/fish.js';
import monthComponent from '../src/components/month.js';
import point24Component from '../src/components/point24.js';
import sumComponent from '../src/components/sum.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// 组件映射表
const GAME_COMPONENTS = {
  'Chess.js': ChessComponent,
  'Spider.js': SpiderComponent,
  'Tortoise.js': TortoiseComponent,
  'Pairs.js': PairsComponent,
  'Sort.js': SortComponent,
  'fish.js': fishComponent,
  'month.js': monthComponent,
  'point24.js': point24Component,
  'sum.js': sumComponent
};

/**
 * 使用renderToString执行组件方法
 */
async function executeMethodWithRenderToString(componentPath, methodName, currentData = {}, args = []) {
  try {
    console.log(`正在通过renderToString执行方法: ${methodName}`);
    
    // 从预导入的组件中获取组件
    const componentName = path.basename(componentPath);
    const originalComponent = GAME_COMPONENTS[componentName];
    
    if (!originalComponent) {
      throw new Error(`组件 ${componentName} 未在预导入列表中找到。可用组件: ${Object.keys(GAME_COMPONENTS).join(', ')}`);
    }
    
    // 保存原始的created函数
    const originalCreated = originalComponent.created;
    
    // 创建状态捕获对象
    let capturedState = {
      before: null,
      after: null,
      result: null,
      error: null
    };
    
    // 创建修改后的组件
    const modifiedComponent = {
      ...originalComponent,
      data() {
        const initialData = originalComponent.data ? originalComponent.data() : {};
        return {
          ...initialData,
          ...currentData, // 覆盖当前数据
          _testCapture: capturedState // 添加状态捕获对象
        };
      },
      async created() {
        console.log('=== 修改后的created生命周期执行 ===');
        
        // 执行原始的created函数
        if (originalCreated) {
          if (originalCreated.constructor.name === 'AsyncFunction') {
            await originalCreated.call(this);
          } else {
            originalCreated.call(this);
          }
        }
        
        // 捕获执行前状态
        const beforeState = { ...this.$data };
        delete beforeState._testCapture; // 移除测试对象
        this._testCapture.before = beforeState;
        
        console.log(`=== 执行方法 ${methodName} ===`);
        
        // 执行目标方法
        try {
          if (this[methodName] && typeof this[methodName] === 'function') {
            console.log(`开始执行${methodName}方法，当前游戏状态: win=${this.gameManager?.winflag}, lose=${this.gameManager?.loseflag}, draw=${this.gameManager?.drawflag}`);
            console.log(`游戏步数: ${this.gameManager?.getStepCount()}, 自动运行状态: ${this.gameManager?.isAutoRunning}`);
            
            // 添加超时控制
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('方法执行超时（150秒）')), 150000);
            });
            
            const methodPromise = this[methodName].apply(this, args);
            
            this._testCapture.result = await Promise.race([methodPromise, timeoutPromise]);
            console.log(`${methodName}方法执行完成，最终游戏状态: win=${this.gameManager?.winflag}, lose=${this.gameManager?.loseflag}, draw=${this.gameManager?.drawflag}`);
            console.log(`最终游戏步数: ${this.gameManager?.getStepCount()}, 自动运行状态: ${this.gameManager?.isAutoRunning}`);
          } else {
            throw new Error(`方法 ${methodName} 不存在`);
          }
        } catch (error) {
          this._testCapture.error = error.message;
          console.error('方法执行错误:', error);
          // 如果是超时错误，强制停止自动模式
          if (error.message.includes('超时') && this.gameManager) {
            console.log('强制停止自动模式...');
            this.gameManager.stopAuto();
          }
        }
        
        // 捕获执行后状态
        const afterState = { ...this.$data };
        delete afterState._testCapture; // 移除测试对象
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
        console.log(JSON.stringify(testResult, null, 2));
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
  
  if (args.length < 3) {
    console.log('用法: node renderToString-method-tester.js <component-path> <method-name> [args...]');
    console.log('示例: node renderToString-method-tester.js test-components/LifecycleTest.js clickCard 0');
    process.exit(1);
  }
  
  const componentPath = args[0];
  const methodName = args[1];
  const methodArgs = args.slice(2);
  
  // 尝试解析JSON参数
  const parsedArgs = methodArgs.map(arg => {
    try {
      return JSON.parse(arg);
    } catch {
      return arg;
    }
  });
  
  await executeMethodWithRenderToString(componentPath, methodName, {}, parsedArgs);
  process.exit(0);
}

// 直接调用main函数
main().catch(console.error);

export { executeMethodWithRenderToString };
