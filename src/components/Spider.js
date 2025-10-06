import { shuffleCards, wait, checkDeadForeach } from "../utils/help.js";
import move from "../directives/move.js";

export default {
  name: "Spider",
  data() {
    return {
      title: "Spider",
      cards: [[], [], [], [], [], [], [], [], [], []],
      fresh: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      arr: [],
      sign: -99,
      index: -99,
      dragCard: -99,
      dragItem: -99,
      enterItem: -99,
      turn: 1,
      types: ["♥", "♠", "♦", "♣"],
      loseflag: false,
      winflag: false,
      hitflag: true,
      lockflag: true,
      number: 52
    };
  },
  directives: { move },
  created: function() {
    this.init();
  },
  mounted() {
    let enter = i => () => this.moveEnter(i);
    for (let i = 0; i < 4; i++) {
      let middle = this.$refs.middleBox[i];
      let down = this.$refs.downBox[i];
      let middleEnter = enter(i + 2);
      let downEnter = enter(i + 6);
      middle.addEventListener("mousemove", middleEnter);
      middle.addEventListener("touchmove", middleEnter);
      down.addEventListener("mousemove", downEnter);
      down.addEventListener("touchmove", downEnter);
    }
  },
  // 初始化
  methods: {
    init() {
      let cards = this.cards[0];
      for (let i = 0; i < this.number; i++) {
        cards.push(i);
      }
      shuffleCards(cards, this.number);
      for (let i = 6; i < 10; i++) {
        this.cards[i].push(this.cards[0].splice(-1)[0]);
      }
    },
    findPos(card) {
      for (let i = 2; i < 10; i++) {
        if (this.cards[i].indexOf(card) >= 0) {
          return i;
        }
      }
      return -99;
    },
    addAndCheck(card, type) {
      let res = checkDeadForeach(this.record, [card, type]);
      if (!res) return false;
      this.record.unshift([card, type]);
      return true;
    },
    checkDown(card) {
      if (!this.addAndCheck(card, 1)) return;
      let type = card % 2;
      let level = card >> 2;
      if (level == 12) {
        return false;
      }
      let up1 = ((level + 1) % 13) * 4 + !type;
      let up2 = up1 + 2;
      let pos1 = this.findPos(up1);
      let pos2 = this.findPos(up2);
      if (pos1 < 0 && pos2 < 0) {
        return false;
      } else if (pos1 >= 6 && pos2 >= 6) {
        let pos = this.findPos(card);
        let top1 = this.cards[pos1][this.cards[pos1].length - 1];
        let top2 = this.cards[pos2][this.cards[pos2].length - 1];
        if (top1 != up1 && top2 != up2) {
          return false;
        }
        if (pos == (top1 == up1 ? pos1 : pos2)) {
          return false;
        }
        return [pos, top1 == up1 ? pos1 : pos2];
      }
      if (pos1 >= 6 || pos2 >= 6) {
        let cards = pos1 >= 6 ? this.cards[pos1] : this.cards[pos2];
        let up = pos1 >= 6 ? up1 : up2;
        let index = cards.indexOf(up);
        if (index == cards.length - 1) {
          let pos = this.findPos(card);
          if (pos != (pos1 >= 6 ? pos1 : pos2)) {
            return [pos, pos1 >= 6 ? pos1 : pos2];
          }
        } else {
          let res = this.checkUp(cards[index + 1]);
          if (res) {
            return res;
          }
        }
        if (pos1 < 0 || pos2 < 0) {
          return false;
        }
      }
      let first;
      if (pos1 - 2 == up1 % 4) {
        let i = 0;
        let top = this.cards[pos1][this.cards[pos1].length - 1];
        while (top - 4 * i >= up1) {
          let res = this.checkDown(top - 4 * i);
          if (!res) {
            break;
          }
          if (!first) {
            first = res;
          }
          i++;
        }
        if (top - 4 * i < up1) {
          return first;
        }
      }
      if (pos2 - 2 == up2 % 4) {
        let i = 0;
        let top = this.cards[pos2][this.cards[pos2].length - 1];
        while (top - 4 * i >= up2) {
          let res = this.checkDown(top - 4 * i);
          if (!res) {
            break;
          }
          if (!first) {
            first = res;
          }
          i++;
        }
        if (top - 4 * i < up2) {
          return first;
        }
      }
      return false;
    },
    checkUp(card) {
      if (!this.addAndCheck(card, 2)) return;
      let type = card % 4;
      let level = card >> 2;
      let result = [];
      for (let i = 0; i <= level; i++) {
        let temp = i * 4 + type;
        let pos = this.findPos(temp);
        if (pos < 0) {
          if (i == level) {
            result.push([pos, type + 2]);
            break;
          }
          return false;
        }
        if (pos == type + 2) {
          continue;
        }
        let index = this.cards[pos].indexOf(temp);
        if (index == this.cards[pos].length - 1) {
          result.push([pos, type + 2]);
          continue;
        }
        let res = this.checkMove(this.cards[pos][index + 1]);
        if (!res) {
          return false;
        }
        result.push(res);
      }
      return result[0];
    },
    checkMove(card) {
      if (!this.addAndCheck(card, 0)) return;
      return this.checkDown(card) || this.checkUp(card);
    },
    async stepFn() {
      this.hitflag = false;
      let next = false;
      for (let i = 6; i < 10; i++) {
        this.record = [];
        next = this.checkMove(this.cards[i][0]);
        if (next) {
          if (
            !this.skipCheck &&
            !checkDeadForeach(this.arr, [next[1], next[0]])
          )
            continue;
          break;
        }
      }
      this.record = [];
      !next &&
        this.cards[1].length > 0 &&
        (next = this.checkMove(this.cards[1][0]));
      if (
        !next ||
        (!this.skipCheck && !checkDeadForeach(this.arr, [next[1], next[0]]))
      ) {
        this.hitflag = true;
        return this.clickCard(0);
      }
      this.skipCheck = false;
      this.sign = -99;
      await this.clickCard(next[0] < 0 ? 1 : next[0]);
      console.log(next, this.sign);
      await wait(1000);
      await this.clickCard(next[1]);
      this.hitflag = true;
    },
    async addCard() {
      for (let i = 6; i < 10; i++) {
        if (this.cards[i].length <= 0) {
          if (this.cards[1].length > 0) {
            this.arr.unshift([i, 1, 0, 1]);
            this.cards[i].push(this.cards[1].splice(0, 1)[0]);
          } else if (this.cards[0].length > 0) {
            this.arr.unshift([i, 0, this.cards[0].length - 1, 1]);
            this.cards[i].push(this.cards[0].splice(-1)[0]);
          }
        }
      }
      if (this.cards[0].length <= 0 && this.cards[1].length <= 0) {
        if (this.lock) {
          return false;
        }
        this.dragCard = -99;
        this.dragItem = -99;
        this.enterItem = -99;
        this.lock = true;
        for (let i = 0; i < this.number; i++) {
          let type = i % 4;
          while (this.cards[type + 2].length <= i >> 2) {
            this.record = [];
            let next = this.checkUp(i);
            if (
              !next ||
              (!this.skipCheck &&
                !checkDeadForeach(this.arr, [next[1], next[0]]))
            ) {
              for (let j = 6; j < 10; j++) {
                if (this.cards[j].length <= 0 || this.cards[j][0] >> 2 >= 12) {
                  continue;
                }
                this.record = [];
                next = this.checkMove(this.cards[j][0]);
                if (next) {
                  if (
                    !this.skipCheck &&
                    !checkDeadForeach(this.arr, [next[1], next[0]])
                  ) {
                    next = false;
                    continue;
                  }
                  break;
                }
              }
            }
            if (!next) {
              this.skipCheck = true;
              continue;
            }
            this.skipCheck = false;
            console.log(next);
            this.sign = -99;
            await this.clickCard(next[0]);
            await wait(500);
            await this.clickCard(next[1]);
            for (let k = 6; k < 10; k++) {
              if (this.cards[k].length <= 0) {
                let pos = this.findPos(i);
                if (this.cards[pos][this.cards[pos].length - 1] != i) {
                  let index = this.cards[pos].indexOf(i);
                  let next = [
                    k,
                    pos,
                    index + 1,
                    this.cards[pos].length - index - 1,
                    i
                  ];
                  this.cards[k].push(...this.cards[pos].splice(index + 1));
                  this.arr.unshift(next);
                  continue;
                }
                let l;
                for (l = 48; l < 52; l++) {
                  let pos = this.findPos(l);
                  if (pos < 6) {
                    continue;
                  }
                  let index = this.cards[pos].indexOf(l);
                  if (l <= 0) {
                    continue;
                  }
                  let next = [k, pos, index, this.cards[pos].length - index, l];
                  console.log(next);
                  if (!checkDeadForeach(this.arr, next)) {
                    continue;
                  }
                  this.cards[k].push(...this.cards[pos].splice(index));
                  this.arr.unshift(next);
                  break;
                }
                if (l < 52) {
                  continue;
                }
                for (l = 6; l < 10; l++) {
                  if (this.cards[l].length > 1) {
                    let next = [k, l, this.cards[l].length - 1, 1];
                    if (!checkDeadForeach(this.arr, next)) {
                      continue;
                    }
                    this.cards[k].push(this.cards[l].splice(-1)[0]);
                    this.arr.unshift(next);
                    break;
                  }
                }
              }
            }
          }
        }
        this.sign = -99;
        this.winflag = true;
        this.lock = false;
      }
    },
    async clickCard(index) {
      let len = this.cards[index].length;
      if (index == 0) {
        if (this.cards[0].length > 0) {
          this.arr.unshift([1, 0, this.turn > 3 ? 1 : 4 - this.turn]);
          this.cards[1].unshift(
            ...this.cards[0].splice(this.turn > 3 ? -1 : this.turn - 4)
          );
        } else {
          for (let i = 0; i < this.arr.length; i++) {
            let step = this.arr[i];
            if (step[0] == 0 && step[1] == 1) {
              this.skipCheck = true;
            } else if (step[0] != 1 || step[1] != 0) {
              break;
            }
          }
          this.arr.unshift([0, 1, this.cards[1].length]);
          this.cards[0].unshift(...this.cards[1].splice(0));
          this.turn++;
        }
        this.sign = -99;
      } else if (index == 1) {
        if (len > 0) {
          this.sign = this.cards[index][0];
          this.index = index;
        }
      } else if (index < 6) {
        if (this.sign == index - 2 + len * 4) {
          this.arr.unshift([
            index,
            this.index,
            this.cards[this.index].indexOf(this.sign),
            1
          ]);
          this.cards[index].push(
            this.cards[this.index].splice(
              this.cards[this.index].indexOf(this.sign),
              1
            )[0]
          );
          this.sign = -99;
        } else {
          if (len > 0) {
            this.sign = this.cards[index][len - 1];
            this.index = index;
          }
        }
      } else {
        let top = this.cards[index][len - 1],
          i;
        if (
          this.sign >= 0 &&
          this.index >= 6 &&
          (i = this.cards[this.index].findIndex(card => {
            return (
              card >> 2 < 13 &&
              card % 2 != top % 2 &&
              ((card >> 2) + 1) % 13 == top >> 2
            );
          })) >= 0
        ) {
          this.arr.unshift([
            index,
            this.index,
            i,
            this.cards[this.index].length - i,
            top
          ]);
          this.cards[index].push(...this.cards[this.index].splice(i));
          this.sign = -99;
        } else if (
          this.sign >= 0 &&
          this.index < 6 &&
          this.sign >> 2 < 13 &&
          this.sign % 2 != top % 2 &&
          ((this.sign >> 2) + 1) % 13 == top >> 2
        ) {
          this.arr.unshift([
            index,
            this.index,
            this.cards[this.index].indexOf(this.sign),
            1,
            top
          ]);
          this.cards[index].push(
            this.cards[this.index].splice(
              this.cards[this.index].indexOf(this.sign),
              1
            )[0]
          );
          this.sign = -99;
        } else if (len > 0) {
          this.sign = top;
          this.index = index;
        }
      }
      if (this.sign < 0) {
        await this.addCard();
      }
    },
    undo() {
      this.sign = -99;
      if (this.step <= 0) {
        return;
      }
      let temp = this.arr.shift(),
        add = false;
      if (temp[1] == 0) {
        if (temp[0] == 1)
          return this.cards[0].push(...this.cards[1].splice(0, temp[2]));
        else {
          add = true;
          this.cards[0].push(this.cards[temp[0]].splice(0, 1)[0]);
        }
      } else if (temp[1] == 1) {
        if (temp[0] != 0) {
          this.cards[1].unshift(this.cards[temp[0]].splice(-1)[0]);
          add = true;
          if (temp[0] < 6 || this.cards[temp[0]].length > 0) {
            return;
          }
        } else {
          this.cards[1].unshift(...this.cards[0].splice(0));
          this.turn--;
          return;
        }
      }
      if (add) {
        temp = this.arr.shift();
      }
      this.cards[temp[1]].splice(
        temp[2],
        0,
        ...this.cards[temp[0]].splice(-temp[3])
      );
    },
    start(e) {
      let item = e.detail.vnode.key % this.number;
      if (!this.hitflag || !this.lockflag) {
        return false;
      }
      let drag = this.findPos(item);
      if (drag < 0 && item != this.cards[1][0]) {
        return;
      }
      let data = e.detail.vnode._moveData;
      data.offsetLeft = e.detail.el.offsetLeft;
      data.offsetTop = e.detail.el.offsetTop;
      this.dragItem = drag;
      if (this.dragItem < 0) {
        this.dragItem = 1;
      }
      this.dragCard = item;
      this.enterItem = -99;
    },
    async end(e) {
      let drag = this.dragItem;
      if (!this.hitflag || !this.lockflag) {
        return;
      }
      if (drag == 1 && this.dragCard != this.cards[1][0]) {
        return;
      }
      let data = e.detail.vnode._moveData;
      let left = data.offsetX + data.offsetLeft;
      let top = data.offsetY + data.offsetTop;
      let index = Math.floor((left + 50) / this.cardWidth);
      if (index >= 0 && index < 4 && top >= 115 && top <= this.height - 75) {
        index += top <= 330 ? 2 : 6;
        await this.clickCard(drag).catch(console.log);
        if (this.sign >= 0 && index != drag && index >= 0) {
          await this.clickCard(index).catch(console.log);
        }
      }
      this.fresh[drag]++;
      this.enterItem = -99;
      this.dragItem = -99;
      this.dragCard = -99;
    },
    enter(item) {
      console.log("enter", item);
      // this.enterItem = item
    },
    leave(item) {
      console.log("leave", item);
      // if (this.enterItem == item) {
      //   this.enterItem = -99
      // }
    },
    moveEnter(item) {
      console.log("moveEnter", item, this.dragItem);
      // if (item == this.dragItem) {
      //   return
      // }
      // this.enterItem = item
      // this.moveflag = false
    },
    move(e) {
      if (!this.hitflag || !this.lockflag) {
        return false;
      }
      if (this.dragItem == 1 && this.dragCard != this.cards[1][0]) {
        return;
      }
      let data = e.detail.vnode._moveData;
      let left = data.offsetX + data.offsetLeft;
      let top = data.offsetY + data.offsetTop;
      let index = Math.floor((left + 50) / this.cardWidth);
      if (index >= 0 && index < 4 && top >= 115 && top <= this.height - 75) {
        index += top <= 330 ? 2 : 6;
        if (this.dragItem != index) this.enterItem = index;
      } else {
        this.enterItem = -99;
      }
      e.detail.el.style.left = left + "px";
      e.detail.el.style.top = top + "px";
      if (this.dragItem >= 6) {
        let index = this.cards[this.dragItem].indexOf(this.dragCard);
        let j = 0;
        for (let down of this.$refs.down) {
          let res = down.className.match("drag");
          if (!res || ++j <= index) {
            continue;
          }
          down.style.left = data.offsetX + data.offsetLeft + "px";
          down.style.top =
            data.offsetY + data.offsetTop + (j - index - 1) * 30 + "px";
        }
      }
    },
    async pass() {
      this.lockflag = false;
      if (!this.winflag && !this.loseflag) {
        await this.stepFn();
        await wait(500);
        this.pass();
      }
    },
    goon() {
      this.hitflag = true;
      this.lockflag = true;
      for (let i = 0; i < 10; i++) {
        this.cards[i].splice(0);
      }
      this.fresh = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.turn = 1;
      this.sign = -99;
      this.dragItem = -99;
      this.dragCard = -99;
      this.enterItem = -99;
      this.arr.splice(0);
      this.loseflag = false;
      this.winflag = false;
      this.init();
    }
  },
  computed: {
    step() {
      return this.arr.length;
    },
    height() {
      return (
        Math.max(...this.cards.slice(-4).map(cards => cards.length)) * 30 + 480
      );
    },
    cardWidth() {
      return this.$refs.container.offsetWidth >> 2;
    }
  }
};
