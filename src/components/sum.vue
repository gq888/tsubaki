<template>
  <GameLayout
    v-bind="gameLayoutProps"
    :win-buttons="[{ text: 'GO ON', callback: goon }]"
    :win-modal-style="{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }"
    :win-custom-class="'lose'"
    :lose-buttons="[{ text: 'AGAIN', callback: goon }]"
    :lose-modal-style="{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }"
    :lose-custom-class="'lose'"
    :draw-buttons="[{ text: 'GO ON', callback: goon }]"
    :draw-modal-style="{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }"
    :draw-custom-class="'draw lose'"
    @goon="goon"
  >
    <template #game-content>
      <div class="row center">
        <img class="avatar" :src="'./static/avatar/17.png'" />
        <span class="scrore">{{ score1 }}</span>
      </div>
      <div class="row">
        <div>
          <ul class="cardsul">
            <li v-for="item in arr1" :key="item.id" class="card">
              <img :src="'./static/' + item.id + '.jpg'" />
            </li>
          </ul>
        </div>
      </div>
      <div class="row" style="margin-top: 10px;">
        <div>
          <ul class="cardsul reverse">
            <li v-for="item in arr2" :key="item.id" class="card">
              <img :src="'./static/' + item.id + '.jpg'" />
            </li>
          </ul>
        </div>
      </div>
      <div class="row center">
        <img class="avatar" :src="'./static/avatar/32.png'" />
        <span class="scrore">{{ score2 }}</span>
      </div>
    </template>
    <template #bottom-controls>
      <GameControls
        :buttons="[
          {
            label: 'HIT',
            action: 'hitBtn',
            disabled: !hitflag
          },
          {
            label: 'PASS',
            action: 'passBtn',
            disabled: !hitflag
          }
        ]"
        @hitBtn="hit(cardsChg, arr2)"
        @passBtn="pass"
      />
    </template>
  </GameLayout>
</template>

<script>
import sum from "./sum.js";
import { GameComponentPresets } from "../utils/gameComponentFactory.js";
// 创建带有自定义逻辑的sum组件
const sumComponent = GameComponentPresets.strategyGame(sum, 1000);
export default sumComponent;
</script>

<style scoped>
@import url("./sum.css");
</style>
