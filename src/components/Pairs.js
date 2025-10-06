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
      step: 0,
      time: 0,
      timer: 0,
      winflag: false,
      hitflag: true,
      lockflag: true,
      number: 54,
      n: 0
    };
  },
  methods: {
    wait,
    init() {
      this.cards1.splice(0);
      this.arr.splice(0);
      this.cards2.splice(0);
      let cards = this.cards1;
      for (let i = 0; i < this.number; i++) {
        cards.push(i);
      }
      shuffleCards(cards, this.number);
    }
  }
};
