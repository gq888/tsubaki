import { GameComponentPresets } from "../utils/gameComponentFactory.js";
import { shuffleCards } from "../utils/help.js";

const Sum = {
  name: "Sum",
  data() {
    return {
      title: "BlackJack",
      cardsChg: [],
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
      for (let i = 0; i < 54; i++) {
        cards.push(i);
      }
      shuffleCards(cards, 53);
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
    // 摸牌
    hit(cards, arr) {
      var currentCard = cards.shift();
      var value = currentCard >> 2;
      arr.push({ id: currentCard, value: ++value > 10 ? 10 : value });
      this.gameManager.recordOperation();
    },
    // 计算点数
    getScore(player) {
      let score = 0;
      let arr = this["arr" + player];
      let flag = false;
      for (let i = 0; i < arr.length; i++) {
        score += arr[i].value;
        if (arr[i].value === 1) {
          flag = true;
        }
      }
      console.log(flag);
      if (score <= 11 && flag === true) {
        score += 10;
      } else if (score > 21) {
        score = 0;
        player == 2 ? this.gameManager.setLose() : this.gameManager.setWin();
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
  },
  computed: {
    // 监听点数
    score1: function () {
      return this.getScore(1);
    },
    score2: function () {
      return this.getScore(2);
    },
  },
};

// 创建带有自定义逻辑的sum组件并导出
export default GameComponentPresets.strategyGame(Sum, 1000);
