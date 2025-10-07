import { shuffleCards } from "../utils/help.js";
export default {
  name: "Month",
  data() {
    return {
      title: "Month",
      month: 12,
      cards1: [],
      cards2: [],
      arr: [],
      timer: "",
      number: 52
    };
  },
  created: function() {
    this.init(this.cards1);
  },
  // 初始化
  methods: {
    init() {
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
    async stepFn() {
      await this.hit();
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
    }
  }
};
