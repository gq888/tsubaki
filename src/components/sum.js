import { GameComponentPresets } from "../utils/gameComponentFactory.js";
import { shuffleCards } from "../utils/help.js";
import { getCardPlaceholderText } from "../utils/cardUtils.js";

const Sum = {
  name: "Sum",
  data() {
    return {
      title: "BlackJack",
      cardsChg: [],
      arr1: [],
      arr2: [],
      number: 54,
    };
  },
  component: [],
  methods: {
    init() {
      // 重置玩家牌组
      this.arr1.splice(0);
      this.arr2.splice(0);
      
      // 只有在牌堆为空时才重新初始化
      if (this.cardsChg.length === 0) {
        this.refillCards();
      } else {
        console.log('使用现有牌堆，剩余:', this.cardsChg.length, '张');
      }
      
      // 发初始牌
      this.hit(this.arr1);
      this.hit(this.arr2);
      this.hit(this.arr1);
      this.hit(this.arr2);
    },
    // 摸牌
    hit(arr) {
      // 如果牌堆空了，重新洗牌
      if (this.cardsChg.length === 0) {
        console.log('牌堆已空，重新洗牌...');
        this.refillCards();
      }
      
      var currentCard = this.cardsChg.shift();
      var value = currentCard >> 2;
      arr.push({ id: currentCard, value: ++value > 10 ? 10 : value });
      this.gameManager.recordOperation();
    },
    
    // 重新填充牌堆
    refillCards() {
      // 清空已使用记录
      this.cardsChg.splice(0);
      for (let i = 0; i < this.number; i++) {
        this.cardsChg.push(i);
      }
      
      // 洗牌
      shuffleCards(this.cardsChg, this.cardsChg.length);
      console.log('重新洗牌完成，新牌堆:', this.cardsChg.length, '张');
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
        this.hit(this.arr1);
      } else if (this.score1 > this.score2) {
        this.gameManager.setLose();
      }
    },
    // 点击摸牌按钮
    handleHitBtn() {
      this.hit(this.arr2);
    },
    
    /**
     * 渲染文本视图 - 显示当前游戏状态
     * 用于终端交互式游戏
     */
    renderTextView() {
      console.log('\n╔════════════════════════════════════════════════╗');
      console.log('║            黑杰克 (BlackJack)                 ║');
      console.log('╚════════════════════════════════════════════════╝');
      console.log(`\n步数: ${this.step}\n`);
      
      // 显示游戏规则
      console.log('规则: 点数接近21获胜，超过21爆牌');
      
      // 显示剩余牌堆
      console.log('━━━ 牌堆 ━━━');
      const remainingCards = this.cardsChg ? this.cardsChg.length : 0;
      console.log(`  剩余: ${remainingCards} 张\n`);
      
      // 显示（玩家1）
      console.log('━━━ 庄家 ━━━');
      const playerScore = this.getScore(1);
      if (this.arr1 && this.arr1.length > 0) {
        const playerCards = this.arr1.map(c => getCardPlaceholderText(c.id)).join(' ');
        console.log(`  ${playerCards}`);
        console.log(`  分数: ${playerScore}${playerScore > 21 ? ' 💥 爆牌!' : playerScore === 21 ? ' 🎉 BlackJack!' : ''}\n`);
      } else {
        console.log('  (无牌)\n');
      }
      
      // 显示（玩家2）
      console.log('━━━ 玩家 ━━━');
      const dealerScore = this.getScore(2);
      if (this.arr2 && this.arr2.length > 0) {
        const dealerCards = this.arr2.map(c => getCardPlaceholderText(c.id)).join(' ');
        console.log(`  ${dealerCards}`);
        console.log(`  分数: ${dealerScore}${dealerScore > 21 ? ' 💥 爆牌!' : ''}\n`);
      } else {
        console.log('  (无牌)\n');
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
      
      // 摘牌按钮（玩家1）
      const playerScore = this.getScore(1);
      if (playerScore < 21) {
        actions.push({
          id: 2,
          label: '摘牌 (HIT)',
          method: 'handleHitBtn',
          args: []
        });
      }
      
      // 停牌按钮
      actions.push({
        id: 3,
        label: '停牌 (PASS)',
        method: 'pass',
        args: []
      });
      
      return actions;
    },
    
    // 停牌方法（庄家摧牌）
    // stand() {
    //   // 庄家持续摘牌直到点数>=17
    //   while (this.getScore(2) < 17) {
    //     this.hit(this.cardsChg, this.arr2);
    //   }
      
    //   // 判断胜负
    //   const playerScore = this.getScore(1);
    //   const dealerScore = this.getScore(2);
      
    //   if (playerScore > 21) {
    //     this.gameManager.setLose();
    //   } else if (dealerScore > 21) {
    //     this.gameManager.setWin();
    //   } else if (playerScore > dealerScore) {
    //     this.gameManager.setWin();
    //   } else if (playerScore < dealerScore) {
    //     this.gameManager.setLose();
    //   } else {
    //     this.gameManager.setDraw();
    //   }
      
    //   this.gameManager.recordOperation();
    // },
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

// 使用工厂函数创建增强的Sum组件并导出
export default GameComponentPresets.strategyGame(Sum, 1000);
