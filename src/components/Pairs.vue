<template>
  <GameLayout
    :title="title"
    :show-top-controls="true"
    :show-bottom-controls="true"
    :game-controls-config="gameControlsConfig"
    :winflag="winflag"
    :loseflag="loseflag"
    :drawflag="drawflag"
    :step="step"
    @goon="goon"
    @step="stepFn"
    @auto="pass"
  >
    <template #game-content>
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
    </template>
    
    <template #win-content>
      <h1 class="small">TIME: {{ time }}</h1>
      <h1 class="small">STEP: {{ step }}</h1>
    </template>
  </GameLayout>
</template>

<script>
import Pairs from "./Pairs.js";
import { GameComponentPresets } from "../utils/gameComponentFactory.js";
import GameLayout from "./GameLayout.vue";

// 使用工厂函数创建增强的Pairs组件
const pairsComponent = GameComponentPresets.pairGame(Pairs, 500);
pairsComponent.components = {
  ...pairsComponent.components,
  GameLayout
};

export default pairsComponent;
</script>

<style scoped>
@import url("./sum.css");
</style>
