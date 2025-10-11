import { GameComponentPresets } from "../utils/gameComponentFactory.js";
import { defineAsyncComponent } from "vue";

/**
 * message 组件 - 根据环境选择
 */
const message = typeof window === "undefined"
  ? { name: "message", template: "<div>Mock message</div>" }
  : defineAsyncComponent(() => import("./message.vue"));

const Fish = {
  name: "Fish",
  components: { message },
  data() {
    return {
      title: "FISHING CONTEST OF DOG TEAM",
      diff1: 0,
      diff2: 0,
      diff3: 0,
      diff4: 0,
      cards1: [],
      cards2: [],
      cards3: [],
      cards4: [],
      ssArr: [],
      flyin1: [],
      flyin2: [],
      flyout1: [],
      flyout2: [],
      cardsIndex: "",
      arr: [],
      timer: "",
    };
  },
  // 初始化
  methods: {
    init() {
      this.cards1.splice(0);
      this.cards2.splice(0);
      this.cards3.splice(0);
      this.cards4.splice(0);
      let cards = this.cards1;
      this.arr.splice(0);
      for (let i = 0; i < 54; i++) {
        cards.push(i);
      }
      this.shuffleCards(cards);
      this.cards2.push(...cards.splice(-14));
      this.cards3.push(...cards.splice(-13));
      this.cards4.push(...cards.splice(-13));
      console.log(cards, this.cards2, this.cards3);
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
    time(handle, time) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
          handle();
        }, time);
      });
    },
    async push(arr, item) {
      arr.push(item);
      // var type = (this.step % 2) == 0 ? 'flyout1' : 'flyout2'
      // this[type].push(item)
      // await this.time(() => {
      //   this[type].splice(0)
      // }, 500)
    },
    // 摸牌
    async hit(cards, arr) {
      var currentCard = cards.shift();
      var value = currentCard >> 2;
      if (value == 13) {
        this.push(arr, currentCard);
        this.ssArr.push(currentCard);
        return await this.time(() => {
          this.ssArr.splice(0);
          for (let i = 1; i <= 4; i++) {
            i != (this.step % 4) + 1 &&
              arr.push(
                ...this["cards" + i].splice(0, currentCard == 53 ? 5 : 3),
              );
          }
          // arr.push(...((this.step % 2) == 0 ? this.cards2 : this.cards1).splice(0, currentCard == 53 ? 5 : 3))
        }, this.gameManager.autoStepDelay);
      }
      var index = value == 10 ? 0 : arr.findIndex((item) => item >> 2 == value);
      this.push(arr, currentCard);
      if (index < 0) {
        return;
      }
      this.ssArr.push(currentCard, arr[index]);
      await this.time(() => {
        this.ssArr.splice(0);
        cards.push(...arr.splice(index));
      }, this.gameManager.autoStepDelay);
    },
  },
  computed: {
    // 监听点数
    score1: function () {
      return this.cards1.length;
    },
    score2: function () {
      return this.cards2.length;
    },
    score3: function () {
      return this.cards3.length;
    },
    score4: function () {
      return this.cards4.length;
    },
  },
  watch: {
    score4(val, old) {
      this.diff4 = val - old;
      this.time(() => {
        this.diff4 = 0;
      }, this.gameManager.autoStepDelay);
    },
    score3(val, old) {
      this.diff3 = val - old;
      this.time(() => {
        this.diff3 = 0;
      }, this.gameManager.autoStepDelay);
    },
    score2(val, old) {
      this.diff2 = val - old;
      this.time(() => {
        this.diff2 = 0;
      }, this.gameManager.autoStepDelay);
    },
    score1(val, old) {
      this.diff1 = val - old;
      this.time(() => {
        this.diff1 = 0;
      }, this.gameManager.autoStepDelay);
    },
  },
};

// 使用工厂函数创建增强的fish组件并导出
export default GameComponentPresets.simpleGame(Fish, 1000);
