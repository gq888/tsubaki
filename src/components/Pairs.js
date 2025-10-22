import { shuffleCards, wait } from "../utils/help.js";
import { GameComponentPresets } from "../utils/gameComponentFactory.js";
import { getCardPlaceholderText } from "../utils/cardUtils.js";

const Pairs = {
  name: "Pairs",
  data() {
    return {
      title: "Pairs",
      cards1: [],
      cards2: [],
      arr: [],
      sign: -1,
      sign2: -2,
      time: 0,
      _timer: 0,
      number: 48,
      n: 0,
    };
  },
  methods: {
    init() {
      this.time = 0;
      clearInterval(this._timer);
      this._timer = 0;
      this.sign = -1;
      this.sign2 = -1;
      this.cards1.splice(0);
      this.arr.splice(0);
      this.cards2.splice(0);
      let cards = this.cards1;
      for (let i = 0; i < this.number; i++) {
        cards.push(i);
        this.cards2.push(false);
      }
      shuffleCards(cards, this.number);
    },
    async clickCard(card) {
      if (!this._timer) {
        this._timer = setInterval(() => {
          this.time++;
        }, 1000);
      }
      if (this.sign == card || this.cards2[card]) {
        return;
      }
      this.arr[card] = true;
      this.gameManager.recordOperation();
      if (this.sign < 0) {
        this.sign = card;
        return;
      }
      if (this.sign >> 2 == card >> 2) {
        this.cards2.splice(card, 1, true);
        this.cards2.splice(this.sign, 1, true);
        this.sign = -1;
      }
      this.gameManager.hitflag = false;
      this.sign2 = card;
      await wait(this.gameManager.autoStepDelay);
      this.sign = -1;
      this.sign2 = -1;
      this.gameManager.hitflag = true;

      // 检查游戏是否结束
      let gameOver = true;
      for (let i = 0; i < this.number; i++) {
        if (!this.cards2[i]) {
          gameOver = false;
          break;
        }
      }

      if (gameOver) {
        this.gameManager.setWin();
        clearInterval(this._timer);
        this._timer = 0;
      }
    },
    async stepFn() {
      if (this.sign >= 0) {
        for (let i = 0; i < 4; i++) {
          let sign = this.sign - (this.sign % 4) + i;
          if (sign != this.sign && this.arr[sign] && !this.cards2[sign]) {
            return await this.clickCard(sign);
          }
        }
      } else {
        let num;
        for (let i = 0; i < this.number; i++) {
          if (i % 4 == 0) {
            num = 0;
          }
          if (this.arr[i] && !this.cards2[i]) {
            num++;
          }
          if (num > 1) {
            return await this.clickCard(i);
          }
        }
      }
      for (let i = 0; i < this.number; i++) {
        let c = this.cards1[i];
        if (!this.arr[c] && !this.cards2[c]) {
          return await this.clickCard(c);
        }
      }
    },
    
    /**
     * 渲染文本视图 - 显示当前游戏状态
     * 用于终端交互式游戏
     */
    renderTextView() {
      console.log('\n╔════════════════════════════════════════════════╗');
      console.log('║              配对游戏 (Pairs)                 ║');
      console.log('╚════════════════════════════════════════════════╝');
      
      // 统计信息
      const matched = this.cards2.filter(m => m).length;
      console.log(`\n时间: ${this.time}秒 | 已配对: ${matched}/${this.number} 张\n`);
      
      // 按6x8网格显示
      const cols = 8;
      const rows = 6;
      
      for (let row = 0; row < rows; row++) {
        let line = '  ';
        for (let col = 0; col < cols; col++) {
          const idx = row * cols + col;
          const cardId = this.cards1[idx];
          
          if (this.cards2[idx] || idx === this.sign || idx === this.sign2) {
            // 已翻开或当前选中
            const cardText = getCardPlaceholderText(cardId);
            const prefix = idx === this.sign ? '>' : idx === this.sign2 ? '*' : '';
            line += `${(prefix + cardText).padEnd(3)} `;
          } else if (this.arr[idx]) {
            line += '[✓] ';
          } else {
            // 未翻开
            line += '[?] ';
          }
        }
        console.log(line);
      }
      
      console.log('\n图例:');
      console.log('  [?] = 未翻开  [✓] = 已看过  > = 第一张  * = 第二张');
      
      console.log(this.sign >= 0 ? `\n当前选中: ${getCardPlaceholderText(this.cards1[this.sign])} (需要配对)` : '\n');
      
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
      
      // 单步执行按钮（自动翻一张牌）
      actions.push({
        id: 2,
        label: '单步执行 (►)',
        method: 'stepFn',
        args: []
      });
      
      // 自动运行按钮
      const isAutoRunning = this.gameManager?.isAutoRunning || false;
      actions.push({
        id: 3,
        label: isAutoRunning ? '停止自动 (STOP)' : '自动运行 (AUTO)',
        method: 'pass',
        args: []
      });
      
      return actions;
    },
  },
};

// 使用工厂函数创建增强的Pairs组件并导出
export default GameComponentPresets.pairGame(Pairs, 500);
