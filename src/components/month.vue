<template>
  <GameLayout
    v-bind="gameLayoutProps"
    :show-top-controls="true"
    :show-bottom-controls="true"
    :lose-subtitle="'YOUR LUCKY CLASSES:'"
    :lose-buttons="[
      {
        text: 'GO ON',
        callback: goon,
        disabled: false
      }
    ]"
    :lose-modal-style="{ backgroundColor: 'rgba(0,0,0,0.8)' }"
    @step="stepFn"
    @auto="pass"
    @goon="goon"
  >
    <template #game-content>
      <div class="row">
        <div class="center">
          <ul
            class="cardsul"
            style="padding-left: 0; max-width: 690px; justify-content: space-between; margin-top: 180px;"
          >
            <li
              v-for="(item, i) in arr"
              :key="i"
              class="cards m-0"
              :class="'cards' + i"
            >
              <img
                v-for="(card, j) in item"
                :key="card"
                class="m-0 card abso"
                :style="{ top: (month == i ? j : 1 + j) * 30 + 'px', left: 0 }"
                :src="
                  './static/' +
                    (cards2[i] > j ||
                    (month == i && ((month == 12 && j == 3) || j == 4))
                      ? card
                      : 'bg') +
                    '.jpg'
                "
              />
              <div
                v-show="i == 12 && month != i"
                class="m-0 card"
                style="background-color: #719192;"
              ></div>
            </li>
          </ul>
        </div>
      </div>
    </template>
    
    <template #lose-cards>
      <div class1="row" style="margin-top: 10px;">
        <div>
          <ul class="cardsul" style="padding-left: 0; max-width: 740px;">
            <div v-for="(item, i) in cards2" :key="i">
              <img
                v-if="item >= 4 && i < 12"
                :src="'./static/' + (i * 4 + 1) + '.jpg'"
                class="card"
              />
            </div>
          </ul>
        </div>
      </div>
    </template>
  </GameLayout>
</template>

<script>
import month from "./month.js";
import { GameComponentPresets } from "../utils/gameComponentFactory.js";
import GameLayout from "./GameLayout.vue";

// 使用工厂函数创建增强的month组件
const monthComponent = GameComponentPresets.simpleGame(month, 1000);
monthComponent.components = {
  ...monthComponent.components,
  GameLayout
};

export default monthComponent;
</script>

<style scoped>
@import url("./sum.css");

.cards12,
.cards12 .card {
}

.cards12 {
  position: absolute;
  top: -180px;
  height: 150px;
  min-width: 400px;
  width: 100%;
  height: 150px;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}
.cards12 .card {
  position: static;
}
</style>
