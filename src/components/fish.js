import { shuffleCards } from "../utils/help.js";
import { GameComponentPresets } from "../utils/gameComponentFactory.js";
import { getCardPlaceholderText } from "../utils/cardUtils.js";
import { defineAsyncComponent } from "vue";

/**
 * message 组件 - 根据环境选择
 */
const message =
  typeof window === "undefined"
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
      arr: [],
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
      shuffleCards(cards, 53);
      this.cards2.push(...cards.splice(-14));
      this.cards3.push(...cards.splice(-13));
      this.cards4.push(...cards.splice(-13));
      console.log(cards, this.cards2, this.cards3);
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
    /**
     * 渲染文本视图 - 显示当前游戏状态
     * 用于终端交互式游戏
     */
    renderTextView() {
      console.log('\n╔════════════════════════════════════════════════╗');
      console.log('║              钓鱼游戏 (Fish)                  ║');
      console.log('╚════════════════════════════════════════════════╝');
      console.log(`\n步数: ${this.step}\n`);
      
      // 显示4个玩家的牌
      for (let i = 1; i <= 4; i++) {
        const cards = this[`cards${i}`];
        const playerName = i === 1 ? '玩家1 (你)' : `玩家${i}`;
        console.log(`━━━ ${playerName} ━━━`);
        if (cards.length > 0) {
          console.log(`  ${cards.length}张`);
        } else {
          console.log('  (已出完)');
        }
      }
      
      // 显示中央区域
      console.log('\n━━━ 中央区域 ━━━');
      if (this.arr.length > 0) {
        const cardTexts = this.arr.map(c => getCardPlaceholderText(c)).join(' ');
        console.log(`  ${cardTexts}`);
      } else {
        console.log('  (空)');
      }
      
      return '渲染完成';
    },
    
    /**
     * 获取当前可用的操作列表
     * 用于终端交互式游戏
     */
    getAvailableActions() {
      const actions = [];
      
      // 重新开始按钮
      actions.push({
        id: 1,
        label: '重新开始 (RESTART)',
        method: 'goon',
        args: []
      });
      
      // 单步执行按钮
      actions.push({
        id: 2,
        label: '单步执行 (►)',
        method: 'stepFn',
        args: []
      });
      
      // 自动运行按钮
      const isAutoRunning = this.gameManager?.isAutoRunning || false;
      actions.push({
        id: 3,
        label: isAutoRunning ? '停止自动 (STOP)' : '自动运行 (AUTO)',
        method: 'pass',
        args: []
      });
      
      return actions;
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
