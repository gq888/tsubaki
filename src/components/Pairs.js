import { shuffleCards, wait } from "../utils/help.js";

export default {
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
      timer: 0,
      number: 48,
      n: 0
    };
  },
  methods: {
    init() {
      this.time = 0;
      clearInterval(this.timer);
      this.timer = 0;
      this.sign = -1;
      this.sign2 = -1;
      this.cards1.splice(0);
      this.arr.splice(0);
      this.cards2.splice(0);
      let cards = this.cards1;
      for (let i = 0; i < this.number; i++) {
        cards.push(i);
      }
      shuffleCards(cards, this.number);
    },
    async clickCard(card) {
      if (!this.timer) {
        this.timer = setInterval(() => {
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
      await wait(500);
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
        clearInterval(this.timer);
        this.timer = 0;
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
    }
  }
};
