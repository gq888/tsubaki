<template>
  <div class="Sum">
    <h1>{{ title }}</h1>
    <GameControls
      v-bind="gameControlsConfig"
      @undo="undo"
      @goon="goon"
      @step="stepFn"
      @auto="pass"
    />
    <div class="row">
      <div>
        <ul
          class="cardsul flex-col"
          :style="{ height: 150 * (number + 1) + 'px' }"
          style="padding-left: 0; width: 100%; max-width: 500px; margin: 0 auto; position: static"
        >
          <div
            v-for="(item, i) in cards1"
            :key="i"
            class="card m-0"
            style="width:25%; height: 150px"
          >
            <img
              :src="'./static/' + item + '.jpg'"
              v-if="item >= 0"
              @click="hitflag && lockflag && clickCard(item, i)"
              :class="{ shanshuo: cards1[cards1.indexOf(item + 4) + 1] < 0 }"
            />
            <div
              v-else-if="cards1[i - 1] >= 4"
              @click="hitflag && lockflag && clickSign(i)"
            >
              <span class="m-0">{{
                types[cards1[i - 1] % 4] + point[(cards1[i - 1] >> 2) - 1]
              }}</span>
            </div>
          </div>
        </ul>
      </div>
    </div>
    <div class="btns">
      <GameControls
        v-bind="gameControlsConfig"
        @undo="undo"
        @goon="goon"
        @step="stepFn"
        @auto="pass"
      />
    </div>
    <GameResultModal
      v-if="loseflag"
      title="U LOSE"
      :subtitle="n + '/' + number * 4"
      :buttons="[
        {
          text: 'RESTART',
          callback: goon,
          disabled: false
        },
        {
          text: 'UNDO',
          callback: undo,
          disabled: undoDisabled
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
import Sort from "./Sort.js";
import { GameComponentPresets } from "../utils/gameComponentFactory.js";

// 使用工厂函数创建增强的Sort组件
export default GameComponentPresets.puzzleGame(Sort, 500, {
  // 记录移动操作
  recordMove(from, to, card, sign) {
    this.gameManager.recordOperation({
      type: "move",
      from: from,
      to: to,
      card: card,
      sign: sign,
      timestamp: Date.now()
    });
  },

  // 处理撤销操作
  handleUndo(operation) {
    // 根据操作类型执行相应的撤销逻辑
    switch (operation.type) {
      case "move":
        // 撤销移动操作
        this.$set(this.cards1, operation.to, operation.sign);
        this.$set(this.cards1, operation.from, operation.card);
        break;
    }
    this.state = 0;
  },

  // 重写clickCard方法，使用GameStateManager记录操作
  clickCard(card, i) {
    if (!Number.isFinite(i)) {
      i = this.cards1.indexOf(card);
    }
    let index = this.cards1.indexOf(card + 4);
    if (index >= 0) {
      if (this.cards1[index + 1] < 0) {
        let sign = this.cards1[index + 1];
        this.recordMove(i, index + 1, card, sign); // 使用GameStateManager记录操作
        this.$set(this.cards1, i, sign);
        this.$set(this.cards1, index + 1, card);
      }
    }
  },

  // 重写stepFn方法
  async stepFn() {
    await this.gameManager.step(async () => {
      this.clickSign(this.next[1]);
      await Sort.methods.wait(1000);
      this.clickCard(this.next[0]);
    });
  },

  // 覆盖Sort.js中的autoCalc方法，使用GameStateManager设置游戏结果
  autoCalc() {
    // 先调用原始方法
    Sort.methods.autoCalc.call(this);
    
    // 然后使用gameManager设置结果
    if (this.state == 1) {
      this.gameManager.setWin();
    } else if (this.state == 2) {
      this.gameManager.setLose();
    }
  }
});
</script>

<style scoped>
@import url("./sum.css");
</style>
