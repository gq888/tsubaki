<template>
  <div class="Sum">
    <h1>{{ title }}</h1>
    <div class="row center" style1="overflow:scroll">
      <div class="flex-row center">
        <ul class="cardsul flex-row center" style="padding-left: 0;">
          <div class="flex-col center m-0">
            <!-- <span class="vertical m-0">(</span> -->
            <point24card :card="arr[0]"></point24card>
            <div class="flex-row" v-show="step < 3">
              <span
                v-for="i in 4"
                :key="i"
                class="sign center"
                :class="{ choose: sign == i }"
                @click="hitflag && lockflag && clickSign(i)"
                >{{ signs[i] }}</span
              >
            </div>
            <div v-if="sign != 0" class="align-center">
              <div class="card"><img :src="'./static/bg.jpg'" /></div>
            </div>
            <!-- <span class="vertical m-0">)</span> -->
            <span class="vertical m-0">=</span>
            <span class="m-0">{{ calc(arr[0]).toFixed(2) }}</span>
          </div>
        </ul>
        <ul
          class="cardsul flex-row center"
          style="padding-left: 0;margin-left: 20px;"
        >
          <div
            v-for="(item, i) in arr"
            :key="i"
            class="align-center flex-wrap flex-row center"
          >
            <div v-if="i != 0" class="flex-row center m-0">
              <span
                class="sign center"
                @click="hitflag && lockflag && clickCard(item, i)"
                >{{ signs[sign] }}</span
              >
              <point24card
                :card="item"
                @click.native="hitflag && lockflag && clickCard(item, i)"
              ></point24card>
            </div>
          </div>
        </ul>
      </div>
    </div>
    <GameControls
      v-bind="gameControlsConfig"
      @undo="undo"
      @goon="goon"
      @step="stepFn"
      @auto="pass"
    />
    <GameResultModal
      v-if="loseflag"
      title="U LOSE"
      subtitle="NO EXP = 24"
      :buttons="[
        {
          text: 'RESTART',
          callback: goon,
          disabled: false
        },
        {
          text: 'UNDO',
          callback: undo,
          disabled: step <= 0
        }
      ]"
      :modalStyle="{ backgroundColor: 'rgba(0,0,0,0.5)' }"
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
    />
  </div>
</template>

<script>
import point24 from "./point24.js";
import { GameComponentPresets } from "../utils/gameComponentFactory.js";
import { timeout } from "../utils/help.js";

// 使用工厂函数创建增强的point24组件
export default GameComponentPresets.puzzleGame(point24, 800, {
  // 记录操作
  recordOperation(type, data) {
    this.gameManager.recordOperation({
      type: type,
      ...data,
      timestamp: Date.now()
    });
  },

  // 处理撤销操作
  handleUndo(operation) {
    // 根据操作类型执行相应的撤销逻辑
    switch (operation.type) {
      case "combine":
        // 撤销组合操作
        this.cards2.splice(this.step, 1);
        this.arr.splice(this.arr.findIndex(a => this.first(a) == this.first(operation.combined)), 1, operation.left, operation.right);
        break;
    }
  },

  // 重写clickCard方法，使用GameStateManager记录操作
  clickCard(card, i) {
    if (i == 0) {
      return;
    }
    if (this.sign != 0) {
      let left = this.arr[0];
      let right = this.arr.splice(i, 1)[0];
      let combined = [left, this.sign, right];
      this.arr.splice(0, 1, combined);
      this.sign = 0;
      this.$set(this.cards2, this.step, combined);
      this.recordOperation("combine", {
        left: left,
        right: right,
        combined: combined
      });
    } else {
      let temp = this.arr[0];
      this.$set(this.arr, 0, this.arr[i]);
      this.$set(this.arr, i, temp);
    }
  },

  // 重写stepFn方法
  async stepFn() {
    await this.gameManager.step(async () => {
      if (this.step >= 3) {
        return;
      }
      let temp = this.cards2[this.step];
      this.sign = 0;
      this.clickCard(temp[0], this.arr.indexOf(temp[0]));
      await timeout(() => {}, 1000);
      this.clickSign(temp[1]);
      await timeout(() => {}, 1000);
      this.clickCard(temp[2], this.arr.indexOf(temp[2]));
    });
  },

  // 覆盖point24.js中的autoCalc方法，使用GameStateManager设置游戏结果
  autoCalc() {
    if (this.step >= 3) {
      if (this.calc(this.arr[0]) == 24) {
        this.gameManager.setWin();
      } else {
        this.gameManager.setLose();
      }
      return;
    }
    let temp = [...this.arr];
    let f = this.process(temp, temp.length, 24);
    if (!f) {
      this.gameManager.setLose();
      return;
    }

    point24.methods.autoCalc.call(this);
  }
});
</script>

<style scoped>
@import url("./sum.css");
</style>
