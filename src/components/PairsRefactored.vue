<template>
  <GameLayout
    :title="title"
    :showUndo="false"
    :showBottomControls="true"
    :hasGameInfo="true"
    :time="time"
    :step="step"
    :winflag="winflag"
    :winModal="winModalConfig"
    :restartDisabled="restartDisabled"
    :stepDisabled="stepDisabled"
    :autoDisabled="autoDisabled"
    @goon="goon"
    @step="stepFn"
    @auto="pass"
  >
    <template v-slot:game-content>
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
    </template>
  </GameLayout>
</template>

<script>
import Pairs from "./Pairs.js";
import GameLayout from "./GameLayout.vue";
import { createGameComponent } from "../mixins/GameMixin.js";

// 使用新的组件化方式创建Pairs组件
const PairsComponent = createGameComponent(Pairs, {
  autoStepDelay: 500
});

export default {
  name: 'PairsRefactored',
  components: {
    GameLayout
  },
  mixins: [PairsComponent],
  computed: {
    winModalConfig() {
      return {
        title: 'U WIN!',
        buttons: [
          {
            text: 'GO ON',
            callback: this.goon,
            disabled: false
          }
        ],
        content: () => {
          return this.$createElement('div', [
            this.$createElement('h1', { class: 'small' }, `TIME: ${this.time}`),
            this.$createElement('h1', { class: 'small' }, `STEP: ${this.step}`)
          ]);
        }
      };
    }
  },
  methods: {
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
      this.recordOperation();
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
        this.setWin();
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
    
    // 重写goon方法使用GameStateManager
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
</script>

<style scoped>
@import url("./sum.css");
</style>
