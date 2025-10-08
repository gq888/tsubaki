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
    :lose-subtitle="n + '/' + number * 4"
    :lose-buttons="[
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
    @undo="undo"
    @goon="goon"
    @step="stepFn"
    @auto="pass"
  >
    <template #game-content>
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
    </template>
  </GameLayout>
</template>

<script>
import Sort from "./Sort.js";
import { GameComponentPresets } from "../utils/gameComponentFactory.js";
import GameLayout from "./GameLayout.vue";

// 使用工厂函数创建增强的Sort组件
const sortComponent = GameComponentPresets.puzzleGame(Sort, 500);
sortComponent.components = {
  ...sortComponent.components,
  GameLayout
};

export default sortComponent;
</script>

<style scoped>
@import url("./sum.css");
</style>
