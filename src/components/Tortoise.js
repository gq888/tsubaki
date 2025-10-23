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
     * 渲染文本视图 - 字符画形式显示当前游戏状态
     * 通过16格子(4x4)系统模拟浏览器渲染效果，使用细线边框
     * 画布20x20，卡牌4x4，后渲染的自然覆盖先渲染的
     */
    renderTextView() {
      console.log('\n╔════════════════════════════════════════════════╗');
      console.log('║              龟兔赛跑 (Tortoise)              ║');
      console.log('╚════════════════════════════════════════════════╝');
      console.log(`\n步数: ${this.step} / ${this.number}`);
      console.log(`已配对: ${this.step} 张 | 剩余: ${this.number - this.step} 张\n`);
      
      // 图例
      console.log('\n图例:');
      console.log('  ┌──┐ = 卡牌边框  ▄ = 选中卡牌边框 ♥5 = 可点击卡牌内容  ·· = 不可点击卡牌');
      
      // 显示下一步提示
      if (this.next && this.next.length > 0) {
        const nextCards = this.next.map(c => getCardPlaceholderText(c)).join(', ');
        console.log(`\n💡 提示: 可配对的卡片: ${nextCards}`);
      }
      
      if (this.sign !== -1) {
        const signIndex = this.cards1.indexOf(this.sign);
        const signCard = getCardPlaceholderText(this.sign);
        console.log(`🎯 当前选中: ${signCard} (位置 ${signIndex})\n`);
      }
      
      // 创建字符画布：20行 × 20列
      const CANVAS_ROWS = 20;
      const CANVAS_COLS = 20;
      const canvas = Array(CANVAS_ROWS).fill(null).map(() => Array(CANVAS_COLS).fill('·'));
      
      // 卡牌尺寸（字符单位）
      const CARD_ROWS = 4;  // 4行
      const CARD_COLS = 4;  // 4列
      
      // 布局参数（来自CSS）
      const LAYOUT_WIDTH = 100;  // 100%
      const LAYOUT_HEIGHT = 46.875; // rem
      
      // 收集所有未完成的卡牌，按z-index排序（从低到高）
      const activeCards = [];
      this.cards1.forEach((cardId, posIdx) => {
        if (!this.done(cardId)) {
          const mapInfo = this.map[posIdx];
          const canClick = this.check(posIdx);
          const isSelected = cardId === this.sign;
          
          activeCards.push({
            cardId,
            posIdx,
            left: parseFloat(mapInfo.left),
            top: parseFloat(mapInfo.top),
            zIndex: mapInfo["z-index"],
            canClick,
            isSelected,
            cardText: getCardPlaceholderText(cardId)
          });
        }
      });
      
      // 按z-index升序排列（底层先渲染）
      activeCards.sort((a, b) => a.zIndex - b.zIndex);
      
      // 逐层渲染卡牌（后渲染的自然覆盖先渲染的）
      activeCards.forEach(card => {
        // 计算卡牌在字符画布中的位置
        const startCol = Math.round((card.left / LAYOUT_WIDTH) * (CANVAS_COLS - CARD_COLS));
        const startRow = Math.round((card.top / LAYOUT_HEIGHT) * (CANVAS_ROWS - CARD_ROWS));
        
        // 确保位置在有效范围内
        const safeStartRow = Math.max(0, Math.min(startRow, CANVAS_ROWS - CARD_ROWS));
        const safeStartCol = Math.max(0, Math.min(startCol, CANVAS_COLS - CARD_COLS));
        
        // 渲染16格子卡牌
        for (let row = 0; row < CARD_ROWS; row++) {
          for (let col = 0; col < CARD_COLS; col++) {
            const canvasRow = safeStartRow + row;
            const canvasCol = safeStartCol + col;
            
            if (canvasRow < CANVAS_ROWS && canvasCol < CANVAS_COLS) {
              let char = ' ';
              
              if (row === 0) {
                // 第一行：上边框
                if (this.sign == card.cardId) {
                  char = "▄";
                } else if (col === 0) {
                  char = '┌'; // 左上角
                } else if (col === CARD_COLS - 1) {
                  char = '┐'; // 右上角
                } else {
                  char = '──'; // 上边框（占2个字符宽度）
                }
              } else if (row === CARD_ROWS - 1) {
                // 最后一行：下边框
                if (this.sign == card.cardId) {
                  char = "▀";
                } else if (col === 0) {
                  char = '└'; // 左下角
                } else if (col === CARD_COLS - 1) {
                  char = '┘'; // 右下角
                } else {
                  char = '──'; // 下边框（占2个字符宽度）
                }
              } else if (col === 0 || col === CARD_COLS - 1) {
                // 左右边框
                char = this.sign == card.cardId? "█" : '│';
              } else if (card.canClick) {
                // 可点击卡牌的内部内容
                if (row === 1 && col === 1) {
                  char = card.cardText[0] || ' '; // 花色
                } else if (row === 1 && col === 2) {
                  char = card.cardText[1] || ' '; // 点数
                } else if (row === 2 && col === 1) {
                  char = card.cardText[1] || ' '; // 下方点数
                } else if (row === 2 && col === 2) {
                  char = card.cardText[0] || ' '; // 下方花色
                }
              } else {
                // 不可点击卡牌的内部内容
                if (row === 1 && (col === 1 || col === 2)) {
                  char = '·'; // 中间点
                } else if (row === 2 && (col === 1 || col === 2)) {
                  char = '·'; // 下方点
                }
              }
              
              // 处理双字符边框
              if (char === '──') {
                canvas[canvasRow][canvasCol] = '─';
                if (canvasCol + 1 < CANVAS_COLS) {
                  canvas[canvasRow][canvasCol + 1] = '─';
                }
              } else {
                canvas[canvasRow][canvasCol] = char;
              }
            }
          }
        }
      });
      
      // 输出字符画
      console.log('\n━━━ 游戏布局 (字符画) ━━━');
      console.log('画布: 20行 × 20列，每张卡牌: 4行 × 4列\n');
      
      // 添加边框
      const borderedCanvas = [];
      borderedCanvas.push('┌' + '─'.repeat(CANVAS_COLS) + '┐');
      
      canvas.forEach(row => {
        borderedCanvas.push('│' + row.join('') + '│');
      });
      
      borderedCanvas.push('└' + '─'.repeat(CANVAS_COLS) + '┘');
      
      console.log(borderedCanvas.join('\n'));
      
      return '字符画渲染完成';
    },
    
    /**
     * 获取当前可用的操作列表
     * 用于终端交互式游戏
     * 使用工厂函数中统一实现的方法
     */
  },
};

// 使用工厂函数创建增强的Tortoise组件并导出
export default GameComponentPresets.cardGame(Tortoise, 500);
