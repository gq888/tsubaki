<template>
  <div class="Sum">
    <h1>{{ title }}</h1>
    <GameControls
      v-bind="gameControlsConfig"
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
      v-bind="gameControlsConfig"
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
import { GameComponentPresets } from "../utils/gameComponentFactory.js";

// 使用工厂函数创建增强的Pairs组件
export default GameComponentPresets.pairGame(Pairs, 500, {
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
  }
});
</script>

<style scoped>
@import url("./sum.css");
</style>
