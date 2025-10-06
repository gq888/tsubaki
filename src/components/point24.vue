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
      :undoDisabled="step <= 0 || !hitflag || !lockflag"
      :restartDisabled="!hitflag || !lockflag"
      :stepDisabled="!hitflag || !lockflag"
      :autoDisabled="!hitflag || !lockflag"
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
import GameResultModal from "./GameResultModal.vue";
import GameControls from "./GameControls.vue";

// 扩展point24组件以包含GameResultModal和GameControls，同时保留原有的point24card组件
const point24WithModal = {
  ...point24,
  components: {
    ...point24.components, // 保留原来的组件
    GameResultModal, // 添加弹窗组件
    GameControls // 添加控制按钮组件
  }
};

export default point24WithModal;
</script>

<style scoped>
@import url("./sum.css");
</style>
