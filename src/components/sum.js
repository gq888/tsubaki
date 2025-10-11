import { GameComponentPresets } from "../utils/gameComponentFactory.js";

const Sum = {
  name: "Sum",
  data() {
    return {
      title: "BlackJack",
      arrCard: [],
      sum: 0,
      score: 0,
      cardsOrg: [],
      cardsChg: [],
      cardsIndex: "",
      types: ["♠", "♥", "♦", "♣"],
      point: ["A", 2, 3, 4, 5, 6, 7, 8, 9, 10, "J", "Q", "K"],
      arr1: [],
      arr2: [],
    };
  },
  component: [],
  methods: {
    init(cards) {
      this.cardsChg = [];
      cards = this.cardsChg;
      this.arr1.splice(0);
      this.arr2.splice(0);
      // this.getCards(this.cardsOrg)
      // this.getCards(cards)
      for (let i = 0; i < 54; i++) {
        cards.push(i);
      }
      this.shuffleCards(cards);
      console.log(cards);
      this.hit(cards, this.arr1);
      this.hit(cards, this.arr2);
      this.hit(cards, this.arr1);
      this.hit(cards, this.arr2);
    },
    // 获取牌库
    getCards(cards) {
      for (let i in this.types) {
        for (let j in this.point) {
          cards.push(this.types[i] + this.point[j]);
        }
      }
      return cards;
    },
    // 洗牌
    shuffleCards(cards) {
      let rand, tmp;
      for (let i = 0; i < 1000; i++) {
        rand = Math.floor(Math.random() * 53);
        tmp = cards[53];
        cards[53] = cards[rand];
        cards[rand] = tmp;
      }
      return cards;
    },
    // 取随机数
    getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    // 摸牌
    hit(cards, arr) {
      var currentCard = cards.shift();
      // var value = (this.cardsOrg.indexOf(currentCard) + 1) % 13
      var value = currentCard >> 2;
      // console.log(value)
      arr.push({ id: currentCard, value: ++value > 10 ? 10 : value });
      this.gameManager.recordOperation();
    },
    // 计算点数
    getScore(ary, score) {
      let flag = false;
      for (let i = 0; i < ary.length; i++) {
        score += ary[i].value;
        if (ary[i].value === 1) {
          flag = true;
        }
      }
      console.log(flag);
      if (score <= 11 && flag === true) {
        score += 10;
      } else if (score > 21) {
        score = 0;
      }
      return score;
    },

    async stepFn() {
      if (this.score1 === this.score2) {
        this.gameManager.setDraw();
      } else if (this.score1 < this.score2) {
        this.hit(this.cardsChg, this.arr1);
      } else if (this.score1 > this.score2) {
        this.gameManager.setLose();
      }
    },
    
    // 处理历史更新事件
    handleHistoryUpdate() {
      // 处理score监听逻辑
      if (this.score2 === 0) {
        this.gameManager.setLose();
      }
      if (this.score1 === 0) {
        this.gameManager.setWin();
      }
    },
  },
  computed: {
    // 监听点数
    score1: function () {
      return this.getScore(this.arr1, this.score);
    },
    score2: function () {
      return this.getScore(this.arr2, this.score);
    },
  },
};

// 创建带有自定义逻辑的sum组件并导出
export default GameComponentPresets.strategyGame(Sum, 1000);
