import { shuffleCards } from "../utils/help.js";
import { GameComponentPresets } from "../utils/gameComponentFactory.js";
import { getCardPlaceholderText } from "../utils/cardUtils.js";

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
     */
    getAvailableActions() {
      const actions = [];
      
      // 重新开始按钮
      actions.push({
        id: 1,
        label: '重新开始 (RESTART)',
        method: 'goon',
        args: []
      });
      
      // 单步执行按钮
      const hasCards = this.cards1.length > 0;
      actions.push({
        id: 2,
        label: '单步执行 (►) - 翻一张牌',
        method: 'stepFn',
        args: [],
        disabled: !hasCards
      });
      
      // 自动运行按钮
      const isAutoRunning = this.gameManager?.isAutoRunning || false;
      actions.push({
        id: 3,
        label: isAutoRunning ? '停止自动 (STOP)' : '自动运行 (AUTO)',
        method: 'pass',
        args: []
      });
      
      // 过滤掉禁用的按钮
      return actions.filter(a => !a.disabled);
    },
  },
};

// 使用工厂函数创建增强的month组件并导出
export default GameComponentPresets.simpleGame(Month, 1000);
