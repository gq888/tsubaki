<template>
  <div class="Sum" style="width:100%;">
    <h1>{{ title }}</h1>
    <GameControls
      v-bind="gameControlsConfig"
      @undo="undo"
      @goon="goon"
      @step="stepTwiceFn"
      @auto="pass"
    />
    <div class="row center">
      <div>
        <div
          class="cardsul center"
          style="padding-left: 0; margin: 0; width: 100%; max-width: 600px; background-color: #719192; padding: 5px 0;"
        >
          <div
            v-for="(item, i) in cards1"
            :key="i"
            class="m-0 center"
            style="width: 16%; border-radius: 50%; overflow: hidden;"
            @click="hitflag && lockflag && clickCard(i)"
          >
            <div
              class="center"
              style="width: 100%; position: relative;"
              :style="{
                backgroundColor:
                  item < 0
                    ? 'transparent'
                    : !cards2[item]
                    ? '#fff'
                    : item == sign
                    ? '#FFB800'
                    : grades[item] == grade
                    ? '#01AAED'
                    : '#5FB878'
              }"
            >
              <div
                class="shanshuo abso"
                v-show="validBoxes.indexOf(i) >= 0"
                style="width: 100%; height: 100%; background-color: #FF5722; top: 0; left: 0;"
              ></div>
              <img
                :style="{
                  transform:
                    cards2[item] && grades[item] != grade
                      ? 'rotate(180deg)'
                      : 'rotate(0)',
                  opacity: item < 0 ? 0 : 100
                }"
                :src="
                  !cards2[item]
                    ? './static/logo.png'
                    : './static/avatar/' + item + '.png'
                "
                style="width: 100%;"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="row">
      <span class="m-0 scrore">{{ lowCount + " : " + highCount }}</span>
    </div>
    <GameControls
      v-bind="gameControlsConfig"
      @undo="undo"
      @goon="goon"
      @step="stepTwiceFn"
      @auto="pass"
    />
    <GameResultModal
      v-if="drawflag"
      title="DRAW GAME"
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
      v-if="loseflag"
      title="U LOSE"
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
import Chess from "./Chess.js";
import { createEnhancedGameComponent } from "../utils/gameComponentFactory.js";
export default createEnhancedGameComponent(Chess, {
  autoStepDelay: 500,
  hasUndo: true,
  hasRestart: true,
  methods: {
    // 记录移动操作
    recordMove(from, to, card, sign, signIndex) {
      this.gameManager.recordOperation({
        type: "move",
        from: from,
        to: to,
        card: card,
        sign: sign,
        signIndex: signIndex,
        timestamp: Date.now()
      });
    },

    // 记录翻转操作
    recordFlip(card) {
      this.gameManager.recordOperation({
        type: "flip",
        card: card,
        timestamp: Date.now()
      });
    },

    // 处理撤销操作
    handleUndo(operation) {
      // 根据操作类型执行相应的撤销逻辑
      switch (operation.type) {
        case "move":
          // 撤销移动操作
          this.$set(this.cards1, operation.signIndex, operation.sign);
          this.$set(
            this.cards1,
            operation.to,
            operation.card >= 0 ? operation.card : -1
          );
          break;
        case "flip":
          // 撤销翻转操作
          this.$set(this.cards2, operation.card, false);
          break;
      }
    },

    // 重写undo方法
    undo() {
      // 原代码中每执行一次undo会弹出两个操作，这里也保持一致
      this.gameManager.undo();
      this.gameManager.undo();
    },

    // 重写clickCard方法，使用GameStateManager记录操作
    async clickCard(i, isAuto) {
      let card = this.cards1[i];
      if (this.grade < 0) {
        this.grade = this.grades[card];
      }
      if (card >= 0 && !this.cards2[card]) {
        this.$set(this.cards2, card, true);
        this.recordFlip(card); // 使用GameStateManager记录操作
        this.sign = -1;
        if (!isAuto) {
          this.gameManager.step(async () => {
            await Chess.methods.wait(500);
            await this.stepFn();
          });
        }
        return;
      }
      let grade = this.step % 2 == 0 ? this.grade : !this.grade;
      if (this.sign >= 0 && this.grades[this.sign] != grade) {
        this.sign =
          card != this.sign && card >= 0 && this.grades[card] != grade
            ? card
            : -1;
        return;
      }
      if (this.sign >= 0 && this.grades[this.sign] == grade) {
        if (card >= 0 && this.grades[card] == grade) {
          this.sign = this.sign == card ? -1 : card;
          return;
        }
        if (this.validBoxes.indexOf(i) >= 0) {
          let signIndex = this.cards1.indexOf(this.sign);
          this.$set(this.cards1, signIndex, -1);
          this.$set(this.cards1, i, this.sign);
          this.recordMove(signIndex, i, card, this.sign, signIndex); // 使用GameStateManager记录操作
          this.sign = -1;
          if (card >= 0) {
            if (this.lowCount <= 0) {
              if (this.grade == 1) {
                this.gameManager.setWin();
              } else {
                this.gameManager.setLose();
              }
            }
            if (this.highCount <= 0) {
              if (this.grade == 0) {
                this.gameManager.setWin();
              } else {
                this.gameManager.setLose();
              }
            }
            if (this.lowCount == 1 && this.highCount == 1) {
              this.gameManager.setDraw();
            }
          }
          if (!isAuto) {
            this.gameManager.step(async () => {
              await Chess.methods.wait(500);
              await this.stepFn();
            });
          }
          return;
        }
      }
      this.sign = card;
    },

    // 重写stepTwiceFn方法
    async stepTwiceFn() {
      await this.gameManager.step(async () => {
        await this.stepFn();
        await Chess.methods.wait(500);
        await this.stepFn();
      });
    }
  }
});
</script>

<style scoped>
@import url("./sum.css");
</style>
