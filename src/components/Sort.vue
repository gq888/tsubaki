<template>
  <div class="Sum">
    <h1>{{ title }}</h1>
    <GameControls
      :undoDisabled="!canUndo"
      :restartDisabled="!canRestart"
      :stepDisabled="!canStep"
      :autoDisabled="!canAuto"
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
        :undoDisabled="!canUndo"
        :restartDisabled="!canRestart"
        :stepDisabled="!canStep"
        :autoDisabled="!canAuto"
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
          disabled: !canUndo
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
import GameResultModal from "./GameResultModal.vue";
import GameControls from "./GameControls.vue";

// 扩展Sort组件以包含GameResultModal和GameControls
const sortWithModal = {
  ...Sort,
  components: {
    ...Sort.components, // 保留原来的组件
    GameResultModal,
    GameControls
  },
  created: function() {
    this.init();
  },
  computed: {
    ...Sort.computed,
    // 计算按钮状态
    canUndo() {
      return this.step > 0 && this.hitflag && this.lockflag;
    },
    canRestart() {
      return this.hitflag && this.lockflag;
    },
    canStep() {
      return this.hitflag && this.lockflag;
    },
    canAuto() {
      return this.hitflag && this.lockflag;
    }
  },
  methods: {
    ...Sort.methods,
    undo() {
      let undo = this.cards2.pop()
      let i0 = this.cards1.indexOf(undo[0])
      let i1 = this.cards1.indexOf(undo[1])
      this.$set(this.cards1, i1, undo[0])
      this.$set(this.cards1, i0, undo[1])
      this.loseflag = false;
      this.winflag = false;
      this.lockflag = true;
    },
    clickCard(card, i) {
      if (!Number.isFinite(i)) {
        i = this.cards1.indexOf(card);
      }
      let index = this.cards1.indexOf(card + 4);
      if (index >= 0) {
        if (this.cards1[index + 1] < 0) {
          this.cards2.push([card, this.cards1[index + 1]]);
          this.$set(this.cards1, i, this.cards1[index + 1]);
          this.$set(this.cards1, index + 1, card);
        }
      }
    },
    async stepFn() {
      this.hitflag = false;
      this.clickSign(this.next[1]);
      await Sort.methods.wait(1000);
      this.clickCard(this.next[0]);
      this.hitflag = true;
    },
    async pass() {
      this.lockflag = this.winflag || this.loseflag;
      if (!this.lockflag) {
        await this.stepFn();
        await Sort.methods.wait(1000);
        this.pass();
      }
    },
    goon() {
      this.hitflag = true;
      this.lockflag = true;
      this.cards1.splice(0);
      this.loseflag = false;
      this.winflag = false;
      this.init();
    }
  }
};

export default sortWithModal;
</script>

<style scoped>
@import url("./sum.css");
</style>
