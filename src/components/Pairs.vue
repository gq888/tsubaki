<template>
  <div class="Sum">
    <h1>{{ title }}</h1>
    <GameControls
      :showUndo="false"
      :restartDisabled="restartDisabled"
      :stepDisabled="stepDisabled"
      :autoDisabled="autoDisabled"
      @goon="goon"
      @step="stepFn"
      @auto="pass"
    />
    <div class="row">
      <span>TIME: {{ time }}</span>
      <br />
      <span>STEP: {{ step }}</span>
    </div>
    <div class="row">
      <div>
        <ul class="cardsul flex-row center" style="padding-left: 0; margin: 0;">
          <div
            v-for="(item, i) in cards1"
            :key="i"
            class="card m-0 radius"
            style="max-width: 25%;"
          >
            <img
              :src="'./static/' + item + '.jpg'"
              v-if="sign == item || sign2 == item || cards2[item]"
            />
            <img
              :src="'./static/bg.jpg'"
              v-else
              @click="hitflag && lockflag && clickCard(item, i)"
            />
          </div>
        </ul>
      </div>
    </div>
    <GameControls
      :showUndo="false"
      :restartDisabled="restartDisabled"
      :stepDisabled="stepDisabled"
      :autoDisabled="autoDisabled"
      @goon="goon"
      @step="stepFn"
      @auto="pass"
    />
    <GameResultModal
      v-if="winflag"
      title="U WIN!"
      :buttons="[
        {
          text: 'GO ON',
          callback: goon,
          disabled: false
        }
      ]"
    >
      <template v-slot:content>
        <h1 class="small">TIME: {{ time }}</h1>
        <h1 class="small">STEP: {{ step }}</h1>
      </template>
    </GameResultModal>
  </div>
</template>

<script>
import Pairs from "./Pairs.js";
import GameResultModal from "./GameResultModal.vue";
import GameControls from "./GameControls.vue";
import GameStateManager from "../utils/gameStateManager.js";

// 扩展Pairs组件以包含GameResultModal和GameControls
const pairsWithModal = {
  ...Pairs,
  components: {
    ...Pairs.components, // 保留原来的组件
    GameResultModal,
    GameControls
  },
  data() {
    return {
      ...Pairs.data.call(this),
      gameManager: new GameStateManager({
        autoStepDelay: 500
      })
    };
  },
  created: function() {
    // 初始化GameStateManager
    this.gameManager.init();
    this.init();
  },
  beforeUnmount() {
    // 清理定时器
    clearInterval(this.timer);
    // 停止自动模式
    this.gameManager.stopAuto();
  },
  computed: {
    ...Pairs.computed,
    // 使用GameStateManager的默认计算属性
    ...GameStateManager.getDefaultComputedProperties()
  },
  methods: {
    ...Pairs.methods,
    // 重写clickCard方法，记录状态变化
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
        this.$set(this.cards2, card, true);
        this.$set(this.cards2, this.sign, true);
        this.sign = -1;
      }
      this.gameManager.hitflag = false;
      this.sign2 = card;
      await Pairs.methods.wait(500);
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
    },
    async pass() {
      await this.gameManager.startAuto(async () => {
        if (!this.winflag) {
          await this.stepFn();
        }
      });
    },
    goon() {
      this.gameManager.reset(() => {
        this.time = 0;
        clearInterval(this.timer);
        this.timer = 0;
        this.sign = -1;
        this.sign2 = -1;
        this.init();
      });
    }
  }
};

export default pairsWithModal;
</script>

<style scoped>
@import url("./sum.css");
</style>
