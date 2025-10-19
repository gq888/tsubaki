import { shuffleCards, wait, seededRandom } from "../utils/help.js";
import { GameComponentPresets } from "../utils/gameComponentFactory.js";

let _modes = [
  [1, 0],
  [1, 1],
  [2, 1],
  [2, 2],
  [3, 1],
  [3, 2],
  [3, 3],
];

const GridBattle = {
  name: "GridBattle",
  data() {
    return {
      title: "GridBattle",
      cards1: [],
      cards2: [],
      // 移除arr数组，因为现在由GameStateManager管理历史记录
      // arr: [],
      sign: -1,
      number: 36,
      grade: -1,
      modes: [
        0, 1, 3, 6, 10, 15, 2, 5, 7, 13, 18, 21, 4, 8, 14, 17, 24, 27, 9, 12,
        20, 25, 26, 31, 11, 19, 23, 29, 30, 35, 16, 22, 28, 32, 34, 33,
      ],
      grades: [
        1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 1,
        1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1,
      ],
    };
  },
  computed: {
    validBoxes() {
      return this.getValidBoxes(this.sign);
    },
    lowCount() {
      return this.cards1.filter((item) => this.grades[item] === 0).length;
    },
    highCount() {
      return this.cards1.filter((item) => this.grades[item] === 1).length;
    },
  },
  // 初始化
  methods: {
    init() {
      this.sign = -1;
      this.grade = -1;
      this.cards1.splice(0);
      this.cards2.splice(0);
      let cards = this.cards1;
      // return cards.splice(0, 0, ...this.modes)
      for (let i = 0; i < this.number; i++) {
        cards.push(i);
        this.cards2.push(false); // 初始化cards2为36个false
      }
      shuffleCards(cards, this.number);
    },
    // 记录移动操作
    recordMove(from, to, card, sign, signIndex) {
      this.gameManager.recordOperation({
        type: "move",
        from: from,
        to: to,
        card: card,
        sign: sign,
        signIndex: signIndex,
        timestamp: Date.now(),
      });
    },

    // 记录翻转操作
    recordFlip(card) {
      this.gameManager.recordOperation({
        type: "flip",
        card: card,
        timestamp: Date.now(),
      });
    },

    // 处理撤销操作
    handleUndo(operation) {
      // 根据操作类型执行相应的撤销逻辑
      switch (operation.type) {
        case "move":
          // 撤销移动操作
          this.cards1.splice(operation.signIndex, 1, operation.sign);
          this.cards1.splice(
            operation.to,
            1,
            operation.card >= 0 ? operation.card : -1,
          );
          break;
        case "flip":
          // 撤销翻转操作
          this.cards2[operation.card] = false; // 直接赋值而不是splice
          break;
      }
    },

    // 重写undo方法
    undo() {
      // 原代码中每执行一次undo会弹出两个操作，这里也保持一致
      this.gameManager.undo();
      this.gameManager.undo();
    },

    // 重写clickCard方法，使用GameStateManager记录操作
    async clickCard(i, isAuto) {
      let card = this.cards1[i];
      if (this.grade < 0) {
        this.grade = this.grades[card];
      }
      if (card >= 0 && !this.cards2[card]) {
        this.cards2[card] = true; // 直接赋值而不是splice
        this.recordFlip(card); // 使用GameStateManager记录操作
        this.sign = -1;
        if (!isAuto) {
          this.gameManager.step(async () => {
            await wait(this.gameManager.autoStepDelay);
            await this.stepFn();
          });
        }
        return;
      }
      let grade = this.step % 2 == 0 ? this.grade : !this.grade;
      if (this.sign >= 0 && this.grades[this.sign] != grade) {
        this.sign =
          card != this.sign && card >= 0 && this.grades[card] != grade
            ? card
            : -1;
        return;
      }
      if (this.sign >= 0 && this.grades[this.sign] == grade) {
        if (card >= 0 && this.grades[card] == grade) {
          this.sign = this.sign == card ? -1 : card;
          return;
        }
        if (this.validBoxes.indexOf(i) >= 0) {
          let signIndex = this.cards1.indexOf(this.sign);
          this.cards1.splice(signIndex, 1, -1);
          this.cards1.splice(i, 1, this.sign);
          this.recordMove(signIndex, i, card, this.sign, signIndex); // 使用GameStateManager记录操作
          this.sign = -1;
          if (card >= 0) {
            if (this.lowCount <= 0) {
              if (this.grade == 1) {
                this.gameManager.setWin();
              } else {
                this.gameManager.setLose();
              }
            }
            if (this.highCount <= 0) {
              if (this.grade == 0) {
                this.gameManager.setWin();
              } else {
                this.gameManager.setLose();
              }
            }
            if (this.lowCount == 1 && this.highCount == 1) {
              this.gameManager.setDraw();
            }
          }
          if (!isAuto) {
            this.gameManager.step(async () => {
              await wait(this.gameManager.autoStepDelay);
              await this.stepFn();
            });
          }
          return;
        }
      }
      this.sign = card;
    },

    // 重写stepTwiceFn方法
    async stepTwiceFn() {
      await this.gameManager.step(async () => {
        await this.stepFn();
        await wait(this.gameManager.autoStepDelay);
        await this.stepFn();
      });
    },
    getValidBoxes(item) {
      let arr = [];
      // let item = this.cards1[index];
      let index = this.cards1.indexOf(item);
      if (item < 0 || index < 0) {
        return arr;
      }
      let mode = this.modes.indexOf(item);
      let h = _modes[Math.floor(mode / 6)],
        v = _modes[mode % 6];
      if (index + v[0] * 6 < 36 && (index % 6) + v[1] < 6)
        arr.push(index + v[0] * 6 + v[1]);
      if (index - v[0] * 6 >= 0 && (index % 6) + v[1] < 6)
        arr.push(index - v[0] * 6 + v[1]);
      if (index + v[0] * 6 < 36 && (index % 6) - v[1] >= 0)
        arr.push(index + v[0] * 6 - v[1]);
      if (index - v[0] * 6 >= 0 && (index % 6) - v[1] >= 0)
        arr.push(index - v[0] * 6 - v[1]);
      if (index + h[1] * 6 < 36 && (index % 6) + h[0] < 6)
        arr.push(index + h[1] * 6 + h[0]);
      if (index - h[1] * 6 >= 0 && (index % 6) + h[0] < 6)
        arr.push(index - h[1] * 6 + h[0]);
      if (index + h[1] * 6 < 36 && (index % 6) - h[0] >= 0)
        arr.push(index + h[1] * 6 - h[0]);
      if (index - h[1] * 6 >= 0 && (index % 6) - h[0] >= 0)
        arr.push(index - h[1] * 6 - h[0]);
      return arr;
    },
    async stepFn() {
      // 1.挪2.送3.翻4.翻吃5.坏翻6.中翻7.友8.躲9.敌10.吃
      let temp = [];
      let hide = [],
        friends = [];
      let grade = this.step % 2 == 0 ? this.grade : !this.grade;
      let _this = this;
      let moveFn = async function (from, to) {
        _this.sign = -1;
        await _this.clickCard(from, true);
        await wait(_this.gameManager.autoStepDelay);
        await _this.clickCard(to, true);
      };
      for (let i = 0; i < this.cards1.length; i++) {
        let item = this.cards1[i];
        if (item < 0) {
          temp[i] = temp[i] || 1;
          continue;
        }
        if (!this.cards2[item]) {
          temp[i] = temp[i] || 3;
          hide.push(i);
          continue;
        }
        if (this.grades[item] == grade) {
          temp[i] = 7;
          friends.push(i);
          let boxes = this.getValidBoxes(item);
          for (let b of boxes) {
            let c = this.cards1[b];
            if (c < 0) {
              continue;
            }
            if (!this.cards2[c]) {
              temp[b] = temp[b] == 5 || temp[b] == 6 ? 6 : 4;
              continue;
            }
            if (this.grades[c] != grade) {
              return await moveFn(i, b);
            }
          }
          continue;
        }
        temp[i] = 9;
        let boxes = this.getValidBoxes(item);
        for (let b of boxes) {
          let c = this.cards1[b];
          if (c < 0) {
            temp[b] = 2;
            continue;
          }
          if (!this.cards2[c]) {
            temp[b] = temp[b] == 4 || temp[b] == 6 ? 6 : 5;
            continue;
          }
          if (this.grades[c] == grade) {
            temp[b] = 8;
          }
        }
      }
      // 1.吃2.躲3.翻吃4.中翻5.翻6.挪7.坏翻8.送
      for (let f of friends) {
        let t = temp[f];
        if (t == 8) {
          let c = this.cards1[f];
          let boxes = this.getValidBoxes(c);
          for (let box of boxes) {
            if (temp[box] == 1) {
              return await moveFn(f, box);
            }
          }
        }
      }
      let best = -1;
      let worst = -1;
      for (let i = 0; i < hide.length; i++) {
        let h = hide[i];
        let t = temp[h];
        if (t == 4) {
          return await this.clickCard(h, true);
        }
        if (t == 5) {
          worst = h;
          hide.splice(i, 1);
          i--;
        }
        if (t == 6) {
          best = h;
        }
      }
      if (best >= 0) {
        return await this.clickCard(best, true);
      }
      if (hide.length > 0) {
        let random = Math.floor(seededRandom() * hide.length);
        return await this.clickCard(hide[random], true);
      }
      let suicide = false;
      let road = [];
      let protectedRoad = [];
      // 预先收集所有友方棋子可以到达的空位
      let friendsReach = {};
      for (let f of friends) {
        let c = this.cards1[f];
        let boxes = this.getValidBoxes(c);
        for (let box of boxes) {
          if (temp[box] == 1) {
            friendsReach[box] = (friendsReach[box] || 0) + 1;
          }
        }
      }
      // 收集路径，区分受保护和普通路径
      for (let f of friends) {
        let c = this.cards1[f];
        let boxes = this.getValidBoxes(c);
        for (let box of boxes) {
          if (temp[box] == 1) {
            if (friendsReach[box] >= 2) {
              protectedRoad.push([f, box]);
            } else {
              road.push([f, box]);
            }
          }
          if (temp[box] == 2) {
            suicide = [f, box];
          }
        }
      }
      // 优先移动到受保护的位置
      if (protectedRoad.length > 0) {
        let random = Math.floor(seededRandom() * protectedRoad.length);
        return await moveFn(protectedRoad[random][0], protectedRoad[random][1]);
      }
      // 其次移动到普通空位
      if (road.length > 0) {
        let random = Math.floor(seededRandom() * road.length);
        return await moveFn(road[random][0], road[random][1]);
      }
      if (worst >= 0) {
        return await this.clickCard(worst, true);
      }
      if (suicide) {
        return await moveFn(suicide[0], suicide[1]);
      } else {
        console.log("unkown error");
      }
    },
  },
};

// 使用工厂函数创建增强的GridBattle组件并导出
export default GameComponentPresets.cardGame(GridBattle, 500);
