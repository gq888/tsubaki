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

/**
 * Fish对象定义了钓鱼游戏的基础组件，将传递给GameComponentPresets.simpleGame工厂函数
 * 工厂函数会为该组件添加游戏管理、按钮控制、自动操作等功能
 */
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
      number: 54,
      
      // 以下属性由工厂函数GameComponentPresets.simpleGame添加：
      // gameManager: 游戏管理器实例，提供游戏状态控制和自动操作功能
      // customButtons: 自定义按钮数组，用于存储游戏控制按钮配置
      // step: 当前游戏步骤计数
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
      for (let i = 0; i < this.number; i++) {
        cards.push(i);
      }
      shuffleCards(cards, this.number);
      this.cards2.push(...cards.splice(-14));
      this.cards3.push(...cards.splice(-13));
      this.cards4.push(...cards.splice(-13));
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
      
      // 显示4个玩家的牌 - 两行表格格式
      // console.log('┌─────────┬─────────┬─────────┬─────────┐');
      console.log('│ 玩家1(你) │  玩家2  │  玩家3  │  玩家4  │');
      // console.log('├─────────┼─────────┼─────────┼─────────┤');
      
      // 获取每个玩家的牌数
      const cardCounts = [];
      for (let i = 1; i <= 4; i++) {
        const cards = this[`cards${i}`];
        cardCounts.push(cards.length > 0 ? `${cards.length}张` : '已出完');
      }
      
      console.log(`│${cardCounts[0].padStart(9, ' ')}│${cardCounts[1].padStart(9, ' ')}│${cardCounts[2].padStart(9, ' ')}│${cardCounts[3].padStart(9, ' ')}│`);
      // console.log('└─────────┴─────────┴─────────┴─────────┘');
      
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

/**
 * 工厂函数GameComponentPresets.simpleGame为Fish组件添加的功能：
 * 
 * 基础增强功能（来自createEnhancedGameComponent）：
 * - gameManager属性：提供游戏状态管理、自动模式控制和步骤执行
 * - customButtons属性：存储自定义按钮配置
 * - displayButtons计算属性：决定显示哪些游戏控制按钮
 * - gameControlsConfig计算属性：游戏控制配置
 * - wait()、pass()、goon()等方法：游戏控制方法
 * - created和beforeUnmount生命周期钩子：管理游戏状态和事件监听
 * 
 * simpleGame特有功能：
 * - step属性：游戏步骤计数器
 * - getActions()方法：获取当前可用的操作列表
 * - 提供简单游戏相关的自动操作和状态管理
 * - 支持自动步骤延迟配置（此处设置为1000ms）
 */
