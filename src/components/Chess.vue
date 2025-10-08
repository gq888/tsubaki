<template>
  <GameLayout
    :title="title"
    :container-style="{ width: '100%' }"
    :show-top-controls="true"
    :show-bottom-controls="true"
    :game-controls-config="gameControlsConfig"
    :winflag="winflag"
    :loseflag="loseflag"
    :drawflag="drawflag"
    :step="step"
    @undo="undo"
    @goon="goon"
    @step="stepTwiceFn"
    @auto="pass"
  >
    <template #game-content>
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
    </template>
  </GameLayout>
</template>

<script>
import Chess from "./Chess.js";
import { GameComponentPresets } from "../utils/gameComponentFactory.js";
import GameLayout from "./GameLayout.vue";

const chessComponent = GameComponentPresets.cardGame(Chess, 500);
chessComponent.components = {
  ...chessComponent.components,
  GameLayout
};

export default chessComponent;
</script>

<style scoped>
@import url("./sum.css");
</style>
