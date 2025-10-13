import { shuffleCards, wait, checkDeadForeach } from "../utils/help.js";
import { GameComponentPresets } from "../utils/gameComponentFactory.js";

const Sort = {
  name: "Sort",
  data() {
    return {
      title: "Sort",
      cards1: [],
      types: ["♥", "♠", "♦", "♣"],
      point: ["A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K"],
      number: 12,
      n: 0,
    };
  },
  methods: {
    init() {
      this.cards1.splice(0);
      let cards = this.cards1;
      for (let i = 0; i < this.number * 4; i++) {
        cards.push(i);
      }
      shuffleCards(cards, this.number * 4);
      for (let i = 0; i < 4; i++) {
        cards.splice(cards.indexOf(this.number * 4 - 1 - i), 1, -1 - i);
      }
      for (let i = 0; i < 4; i++) {
        cards.splice(i * (this.number + 1), 0, this.number * 4 - 4 + i);
      }
      this.autoCalc();
    },
    // 记录移动操作
    recordMove(from, to, card, sign) {
      this.gameManager.recordOperation({
        type: "move",
        from: from,
        to: to,
        card: card,
        sign: sign,
        timestamp: Date.now(),
      });
    },

    // 处理撤销操作
    handleUndo(operation) {
      // 根据操作类型执行相应的撤销逻辑
      switch (operation.type) {
        case "move":
          // 撤销移动操作
          this.cards1.splice(operation.to, 1, operation.sign);
          this.cards1.splice(operation.from, 1, operation.card);
          break;
      }
    },

    // 重写clickCard方法，使用GameStateManager记录操作
    clickCard(card, i) {
      if (!Number.isFinite(i)) {
        i = this.cards1.indexOf(card);
      }
      let index = this.cards1.indexOf(card + 4);
      if (index >= 0) {
        if (this.cards1[index + 1] < 0) {
          let sign = this.cards1[index + 1];
          this.cards1.splice(i, 1, sign);
          this.cards1.splice(index + 1, 1, card);
          this.recordMove(i, index + 1, card, sign); // 使用GameStateManager记录操作
        }
      }
    },

    // 重写stepFn方法
    async stepFn() {
      await this.gameManager.step(async () => {
        this.clickSign(this.next[1]);
        await wait(this.gameManager.autoStepDelay);
        
        const cardBefore = this.next[0];
        const indexBefore = this.cards1.indexOf(cardBefore);
        console.log(`🎯 准备移动卡片: card=${cardBefore}, index=${indexBefore}`);
        
        this.clickCard(this.next[0]);
      });
    },
    clickSign(i) {
      let card = this.cards1[i - 1];
      if (card < 4) {
        return;
      }
      let temp = ((card >> 2) - 1) * 4 + (card % 4);
      let index = this.cards1.indexOf(temp);
      
      // 滚动到目标卡片位置
      if (typeof window !== 'undefined' && window.document) {
        const scrollTop = (index % (this.number + 1)) * 150;
        
        // 优先滚动 GameLayout 的 wrapper
        const wrapper = document.querySelector('.game-content-wrapper');
        if (wrapper) {
          wrapper.scrollTop = scrollTop;
        } else {
          // 降级到传统的 document 滚动
          document.documentElement.scrollTop = scrollTop;
          document.body.scrollTop = scrollTop;
        }
      }
    },
    autoCalc() {
      let over = true,
        temp = {},
        prior = [];
      for (let id = -4; id < 0; id++) {
        let index = this.cards1.indexOf(id);
        let card = this.cards1[index - 1];
        temp[id] = {
          index,
          card: card,
          priority: 0,
          _in: 0,
          able: true,
        };
      }
      for (let id = -4; id < 0; id++) {
        let index = temp[id].index;
        let card = temp[id].card;
        let dead = [];
        let prevFn = (prev_c, deep) => {
          if (prev_c < 0) {
            prior.push([id, prev_c, deep]);
            temp[prev_c].priority++;
            temp[prev_c]._in++;
          } else {
            if (prev_c >= 48) {
              return;
            }
            if (!checkDeadForeach(dead, [prev_c, 0])) return;
            dead.unshift([prev_c, 0]);
            prev_c = this.cards1[this.cards1.indexOf(prev_c + 4) + 1];
            prevFn(prev_c, deep);
          }
        };
        let nextFn = (next_i, next_c, deep) => {
          if (!checkDeadForeach(dead, [next_c, 1])) return;
          dead.unshift([next_c, 1]);
          if (deep > 0 && next_c >= 8) {
            let prev_c = this.cards1[next_i + 1];
            prevFn(prev_c, deep);
          }
          next_c = this.cards1[next_i - 1];
          if (next_c < 4) {
            let n = next_i - 2;
            let num = 1;
            while (next_c < 0) {
              next_c = this.cards1[n];
              n--;
              num++;
            }
            if (next_c >= num * 4) {
              prior.push([id, this.cards1[next_i - 1], deep]);
              temp[this.cards1[next_i - 1]].priority++;
              temp[this.cards1[next_i - 1]]._in++;
              return;
            }
            next_c += 4;
            while (this.cards1[n] == next_c && n % (this.number + 1) > 0) {
              n--;
              next_c += 4;
              deep++;
            }
            if (n % (this.number + 1) == 0) {
              return;
            }
            let prev_c = this.cards1[this.cards1.indexOf(next_c) + 1];
            prevFn(prev_c, deep);
            return;
          }
          next_i = this.cards1.indexOf(next_c - 4);
          nextFn(next_i, next_c, deep);
        };
        if (card >= 4) {
          let i = index - 1,
            type = card % 4;
          let next_i = this.cards1.indexOf(card - 4);
          while (
            this.cards1[i] ==
            (this.number - 1 - (i % (this.number + 1))) * 4 + type
          ) {
            i--;
          }
          if (i < 0 || i % (this.number + 1) == this.number) {
            if (
              card < 8 ||
              next_i % (this.number + 1) == this.number ||
              this.cards1[next_i + 1] == card - 8
            ) {
              this.next = [card - 4, index];
              return;
            }
          }
          over = false;
        }
        nextFn(index, id, 0);
      }
      if (over) {
        this.n = 0;
        for (let i = 0; i < this.number * 4 + 4; i++) {
          if (
            this.cards1[i] >> 2 ==
            this.number - 1 - (i % (this.number + 1))
          ) {
            this.n++;
          }
        }
        if (this.n >= this.number * 4) {
          this.gameManager.setWin();
        } else {
          this.gameManager.setLose();
        }
        return;
      }
      let signs = [-1, -2, -3, -4];
      while (signs.length > 0) {
        let ind;
        for (ind = 0; ind < signs.length; ind++) {
          if (temp[signs[ind]]._in <= 0) {
            break;
          }
        }
        if (ind < signs.length) {
          let s = signs.splice(ind, 1)[0];
          let j = 0;
          while (j < prior.length) {
            if (prior[j][0] == s) {
              temp[prior[j][1]]._in--;
              temp[prior[j][1]].deep = prior[j][2];
              prior.splice(j, 1);
              temp[s].able = false;
            } else {
              j++;
            }
          }
        } else {
          let road = [signs[0]];
          while (prior.length > 0) {
            let p = prior.findIndex((t) => t[1] == road[0]);
            let index = road.indexOf(prior[p][0]);
            if (index >= 0) {
              temp[prior[p][1]]._in--;
              prior.splice(p, 1);
              for (let i = 0; i < index; i++) {
                for (let j = 0; j < prior.length; j++) {
                  if (prior[j][0] == road[i] && prior[j][1] == road[i + 1]) {
                    temp[prior[j][1]]._in--;
                    prior.splice(j, 1);
                    break;
                  }
                }
              }
              break;
            }
            road.unshift(prior[p][0]);
          }
        }
      }
      this.next = [-1, -1];
      let min = 999999,
        max = -1;
      let best_card_rank = -1;
      for (let i = -4; i < 0; i++) {
        let t = temp[i];
        if (t.card < 4) {
          continue;
        }
        if (!t.able) {
          continue;
        }
        let diff =
          t.deep ||
          Math.abs(
            ((t.card - 4) >> 2) -
              (this.number - 1) +
              ((t.index % (this.number + 1))),
          );
        let card_rank = (t.card - 4) >> 2;  // 卡片等级，K=11最大
        // 优先级 > 距离 > 卡片等级（大牌优先）
        if (t.priority > max || 
            (t.priority == max && diff < min) ||
            (t.priority == max && diff == min && card_rank > best_card_rank)) {
          this.next = [t.card - 4, t.index];
          min = diff;
          max = t.priority;
          best_card_rank = card_rank;
        }
      }
    },
  },
};

// 使用工厂函数创建增强的Sort组件并导出
export default GameComponentPresets.puzzleGame(Sort, 500);
