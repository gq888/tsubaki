import { shuffleCards } from "../utils/help.js";
import { GameComponentPresets } from "../utils/gameComponentFactory.js";
import { getCardPlaceholderText } from "../utils/cardUtils.js";

const Tortoise = {
  name: "Tortoise",
  data() {
    return {
      title: "Tortoise",
      sign: -1,
      cards1: [],
      next: [],
      number: 54,
      map: [
        { "z-index": 0, left: "10%", top: "4.6875rem", up: [16, 30] },
        { "z-index": 0, left: "30%", top: "4.6875rem", up: [16, 17, 31] },
        { "z-index": 0, left: "50%", top: "4.6875rem", up: [17, 18, 31] },
        { "z-index": 0, left: "70%", top: "4.6875rem", up: [18, 32] },
        { "z-index": 0, left: "10%", top: "14.0625rem", up: [16, 19, 37] },
        { "z-index": 0, left: "30%", top: "14.0625rem", up: [16, 17, 19, 20] },
        { "z-index": 0, left: "50%", top: "14.0625rem", up: [17, 18, 20, 21] },
        { "z-index": 0, left: "70%", top: "14.0625rem", up: [18, 21, 33] },
        { "z-index": 0, left: "10%", top: "23.4375rem", up: [19, 22, 37] },
        { "z-index": 0, left: "30%", top: "23.4375rem", up: [19, 20, 22, 23] },
        { "z-index": 0, left: "50%", top: "23.4375rem", up: [20, 21, 23, 24] },
        { "z-index": 0, left: "70%", top: "23.4375rem", up: [21, 24, 33] },
        { "z-index": 0, left: "10%", top: "32.8125rem", up: [22, 36] },
        { "z-index": 0, left: "30%", top: "32.8125rem", up: [22, 23, 35] },
        { "z-index": 0, left: "50%", top: "32.8125rem", up: [23, 24, 35] },
        { "z-index": 0, left: "70%", top: "32.8125rem", up: [24, 34] },
        { "z-index": 1, left: "20%", top: "9.375rem", up: [25] },
        { "z-index": 1, left: "40%", top: "9.375rem", up: [25, 26] },
        { "z-index": 1, left: "60%", top: "9.375rem", up: [26] },
        { "z-index": 1, left: "20%", top: "18.75rem", up: [25, 27] },
        { "z-index": 1, left: "40%", top: "18.75rem", up: [25, 26, 27, 28] },
        { "z-index": 1, left: "60%", top: "18.75rem", up: [26, 28] },
        { "z-index": 1, left: "20%", top: "28.125rem", up: [27] },
        { "z-index": 1, left: "40%", top: "28.125rem", up: [27, 28] },
        { "z-index": 1, left: "60%", top: "28.125rem", up: [28] },
        { "z-index": 2, left: "30%", top: "14.0625rem", up: [29] },
        { "z-index": 2, left: "50%", top: "14.0625rem", up: [29] },
        { "z-index": 2, left: "30%", top: "23.4375rem", up: [29] },
        { "z-index": 2, left: "50%", top: "23.4375rem", up: [29] },
        { "z-index": 3, left: "40%", top: "18.75rem", up: [] },
        { "z-index": 1, left: "0", top: "0", up: [38] },
        { "z-index": 1, left: "40%", top: "0", up: [39] },
        { "z-index": 1, left: "80%", top: "0", up: [40] },
        { "z-index": 1, left: "80%", top: "18.75rem", up: [41] },
        { "z-index": 1, left: "80%", top: "37.5rem", up: [42] },
        { "z-index": 1, left: "40%", top: "37.5rem", up: [43] },
        { "z-index": 1, left: "0", top: "37.5rem", up: [44] },
        { "z-index": 1, left: "0", top: "18.75rem", up: [45] },
        { "z-index": 2, left: "0", top: "2.3438rem", up: [46] },
        { "z-index": 2, left: "35%", top: "0", up: [47] },
        { "z-index": 2, left: "75%", top: "0", up: [48] },
        { "z-index": 2, left: "80%", top: "16.4063rem", up: [49] },
        { "z-index": 2, left: "80%", top: "35.1563rem", up: [50] },
        { "z-index": 2, left: "45%", top: "37.5rem", up: [51] },
        { "z-index": 2, left: "5%", top: "37.5rem", up: [52] },
        { "z-index": 2, left: "0", top: "21.0938rem", up: [53] },
        { "z-index": 3, left: "0", top: "4.6875rem", up: [] },
        { "z-index": 3, left: "30%", top: "0", up: [] },
        { "z-index": 3, left: "70%", top: "0", up: [] },
        { "z-index": 3, left: "80%", top: "14.0625rem", up: [] },
        { "z-index": 3, left: "80%", top: "32.8125rem", up: [] },
        { "z-index": 3, left: "50%", top: "37.5rem", up: [] },
        { "z-index": 3, left: "10%", top: "37.5rem", up: [] },
        { "z-index": 3, left: "0", top: "23.4375rem", up: [] },
      ],
    };
  },
  // 初始化
  methods: {
    init() {
      this.sign = -1;
      this.cards1.splice(0);
      let cards = this.cards1;
      for (let i = 0; i < this.number; i++) {
        cards.push(i);
      }
      shuffleCards(cards, this.number);
      this.autoCalc();
    },
    async stepFn() {
      if (this.step >= this.number) {
        return;
      }
      await this.gameManager.step(async () => {
        let next,
          next_i,
          max = -1;
        let fn = (temp) => {
          if (temp == this.sign) {
            return;
          }
          if (this.done(temp)) {
            return;
          }
          let index = this.cards1.indexOf(temp);
          if (this.check(index) && this.map[index]["z-index"] > max) {
            next = temp;
            next_i = index;
            max = this.map[index]["z-index"];
          }
        };
        if (this.sign != -1 && this.sign << 2 != this.next[0] << 2) {
          let card = this.sign >> 2;
          for (let i = 0; i < 4; i++) {
            let temp = card * 4 + i;
            fn(temp);
          }
        }
        if (max < 0) {
          for (let temp of this.next) {
            fn(temp);
          }
        }
        this.clickCard(next, next_i);
      });
    },
    check(i) {
      return (
        this.map[i] &&
        this.map[i].up.findIndex((up) => !this.done(this.cards1[up])) < 0
      );
    },
    done(card) {
      return this.gameManager.history.indexOf(card) >= 0;
    },
    clickCard(card, i) {
      if (!this.check(i)) {
        return;
      }
      if (this.sign == card) {
        this.sign = -1;
      } else if (this.sign >> 2 != card >> 2) {
        this.sign = card;
      } else {
        this.gameManager.recordOperation(this.sign);
        this.gameManager.recordOperation(card);
        this.sign = -1;
      }
    },
    undo() {
      this.sign = -1;
      this.gameManager.undo();
      this.gameManager.undo();
    },
    autoCalc() {
      let step = this.step;
      if (step % 2 == 1) {
        return;
      }
      if (step >= this.number) {
        this.gameManager.setWin();
        return;
      }
      let temp = [],
        i,
        max = -1,
        m = -1,
        d = false;
      for (i = this.number - 1; i >= 0; i--) {
        if (!this.done(i)) {
          let card = this.cards1.indexOf(i);
          if (this.check(card)) {
            temp.push(i);
            if (this.map[card]["z-index"] > max) {
              max = this.map[card]["z-index"];
            }
          }
        } else {
          d = true;
        }
        if (i % 4 == 0) {
          if (temp.length > 1) {
            if (d) {
              this.next = temp;
              return;
            }
            if (max > m) {
              this.next = temp;
              m = max;
            }
          }
          max = -1;
          temp = [];
          d = false;
        }
      }
      if (m < 0) {
        this.gameManager.setLose();
      }
    },
    
    /**
     * 渲染文本视图 - 显示当前游戏状态
     * 用于终端交互式游戏
     */
    renderTextView() {
      // getCardPlaceholderText 从 cardUtils 导入
      
      console.log('\n╔════════════════════════════════════════════════╗');
      console.log('║              龟兔赛跑 (Tortoise)              ║');
      console.log('╚════════════════════════════════════════════════╝');
      console.log(`\n步数: ${this.step} / ${this.number}`);
      console.log(`已配对: ${this.step} 张 | 剩余: ${this.number - this.step} 张\n`);
      
      if (this.sign !== -1) {
        const signIndex = this.cards1.indexOf(this.sign);
        const signCard = getCardPlaceholderText(this.sign);
        console.log(`🎯 当前选中: ${signCard} (位置 ${signIndex})\n`);
      }
      
      // 按 z-index 分层显示
      const maxZ = Math.max(...this.map.map(m => m["z-index"]));
      
      for (let z = 0; z <= maxZ; z++) {
        console.log(`\n━━━ 第 ${z} 层 (z-index=${z}) ━━━`);
        
        const cardsInLayer = [];
        this.cards1.forEach((cardId, posIdx) => {
          if (this.map[posIdx]["z-index"] === z && !this.done(cardId)) {
            cardsInLayer.push({ cardId, posIdx });
          }
        });
        
        if (cardsInLayer.length === 0) {
          console.log('  (本层无剩余卡片)');
          continue;
        }
        
        // 按卡片ID分组显示
        const groups = {};
        cardsInLayer.forEach(({ cardId, posIdx }) => {
          const rank = cardId >> 2;
          if (!groups[rank]) {
            groups[rank] = [];
          }
          groups[rank].push({ cardId, posIdx });
        });
        
        Object.keys(groups).sort((a, b) => a - b).forEach(rank => {
          const cards = groups[rank];
          const cardTexts = cards.map(({ cardId, posIdx }) => {
            const cardText = getCardPlaceholderText(cardId);
            const canClick = this.check(posIdx);
            const isSelected = cardId === this.sign;
            
            if (isSelected) {
              return `[${cardText}✓]`;
            } else if (canClick) {
              return `<${cardText}>`;
            } else {
              return `(${cardText})`;
            }
          }).join(' ');
          
          console.log(`  点数${rank}: ${cardTexts}`);
        });
      }
      
      console.log('\n图例:');
      console.log('  <卡片> = 可点击  (卡片) = 被覆盖  [卡片✓] = 已选中');
      
      // 显示下一步提示
      if (this.next && this.next.length > 0) {
        const nextCards = this.next.map(c => getCardPlaceholderText(c)).join(', ');
        console.log(`\n💡 提示: 可配对的卡片点数 ${this.next[0] >> 2}: ${nextCards}`);
      }
      
      return '渲染完成';
    },
    
    /**
     * 获取当前可用的操作列表
     * 用于终端交互式游戏
     */
    getAvailableActions() {
      const actions = [];
      
      // 撤销按钮
      actions.push({
        id: 1,
        label: '撤销 (◀︎)',
        method: 'undo',
        args: [],
        disabled: !this.canUndo
      });
      
      // 重新开始按钮
      actions.push({
        id: 2,
        label: '重新开始 (RESTART)',
        method: 'goon',
        args: []
      });
      
      // 单步执行按钮
      actions.push({
        id: 3,
        label: '单步执行 (►)',
        method: 'stepFn',
        args: [],
        disabled: this.step >= this.number
      });
      
      // 自动运行按钮
      const isAutoRunning = this.gameManager?.isAutoRunning || false;
      actions.push({
        id: 4,
        label: isAutoRunning ? '停止自动 (STOP)' : '自动运行 (AUTO)',
        method: 'pass',
        args: []
      });
      
      // 过滤掉禁用的按钮
      return actions.filter(a => !a.disabled);
    },
  },
};

// 使用工厂函数创建增强的Tortoise组件并导出
export default GameComponentPresets.cardGame(Tortoise, 500);
