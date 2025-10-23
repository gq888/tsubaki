import { shuffleCards } from "../utils/help.js";
import { GameComponentPresets } from "../utils/gameComponentFactory.js";
import { getCardPlaceholderText } from "../utils/cardUtils.js";

/**
 * Month对象定义了月份游戏的基础组件，将传递给GameComponentPresets.simpleGame工厂函数
 * 工厂函数会为该组件添加游戏管理、按钮控制、自动操作等功能
 */
const Month = {
  name: "Month",
  data() {
    return {
      title: "Month",
      month: 12,
      cards1: [],
      cards2: [],
      arr: [],
      number: 52,
      
      // 以下属性由工厂函数GameComponentPresets.simpleGame添加：
      // gameManager: 游戏管理器实例，提供游戏状态控制和自动操作功能
      // customButtons: 自定义按钮数组，用于存储游戏控制按钮配置
      // step: 当前游戏步骤计数
    };
  },
  // 初始化
  methods: {
    init() {
      this.month = 12;
      this.cards1.splice(0);
      this.cards2.splice(0);
      this.arr.splice(0);
      let cards = this.cards1;
      for (let i = 0; i < this.number; i++) {
        cards.push(i);
      }
      shuffleCards(cards, this.number);
      for (let i = 0; i < this.number >> 2; i++) {
        this.cards2.push(0);
        this.arr.push(cards.splice(0, 4));
      }
    },
    async push(arr, item) {
      arr.push(item);
    },
    // 摸牌
    async hit() {
      let currentCard = this.arr[this.month].pop();
      var value = currentCard >> 2;
      this.arr[value].unshift(currentCard);
      this.month = value;
      this.cards2[value]++;
    },
    
    /**
     * 渲染文本视图 - 显示当前游戏状态
     * 用于终端交互式游戏
     */
    renderTextView() {
      console.log('\n╔════════════════════════════════════════════════╗');
      console.log('║              月份游戏 (Month)                 ║');
      console.log('╚════════════════════════════════════════════════╝');
      console.log(`\n步数: ${this.step}\n`);
      
      // 显示12个月份位置
      const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      for (let i = 0; i < 12; i++) {
        const count = this.cards2[i];
        console.log(`  [${months[i]}] ` + this.arr[i].map((c, i) => `${i < count || i >= 4 ? getCardPlaceholderText(c) : "[?]"}`).join(' ') + (count >= 4 ? ' [✓] 已完成' : ''));
      }
      
      // 显示第13个位置
      const count13 = this.cards2[12];
      console.log(`  [牌堆] ` + this.arr[12].map((c, i) => `${i < count13 || i >= 3 ? getCardPlaceholderText(c) : "[?]"}`).join(' ') + (count13 >= 4 ? ' [✓] 已完成' : `剩余 ${4 - count13} 次机会`));
      
      return '渲染完成';
    },
    
    /**
     * 获取当前可用的操作列表
     * 用于终端交互式游戏
     * 使用工厂函数中统一实现的方法
     */
  },
  
  // 以下方法由工厂函数GameComponentPresets.simpleGame添加：
  // wait(): Promise<void> - 等待指定时间，用于游戏步骤延迟
  // undo(): void - 撤销上一步操作
  // pass(): void - 跳过当前步骤
  // goon(): void - 继续游戏
  // goBack(): void - 返回上一状态
  // step(fn: Function): Promise<void> - 执行游戏步骤
  // executeMethodWithRenderToString(method: string, ...args: any[]): Promise<void> - 执行方法并渲染
  // getActions(): Array<Object> - 获取当前可用的操作列表
};

// 使用工厂函数创建增强的month组件并导出
export default GameComponentPresets.simpleGame(Month, 1000);

/**
 * 工厂函数GameComponentPresets.simpleGame为Month组件添加的功能：
 * 
 * 基础增强功能（来自createEnhancedGameComponent）：
 * - gameManager属性：提供游戏状态管理、自动模式控制和步骤执行
 * - customButtons属性：存储自定义按钮配置
 * - displayButtons计算属性：决定显示哪些游戏控制按钮
 * - gameControlsConfig计算属性：游戏控制配置
 * - wait()、pass()、goon()等方法：游戏控制方法
 * - created和beforeUnmount生命周期钩子：管理游戏状态和事件监听
 * 
 * simpleGame特有功能：
 * - step属性：游戏步骤计数器
 * - getActions()方法：获取当前可用的操作列表
 * - 提供简单游戏相关的自动操作和状态管理
 * - 支持自动步骤延迟配置（此处设置为1000ms）
 */
