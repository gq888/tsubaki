<template>
  <GameLayout
    v-bind="gameLayoutProps"
    :show-bottom-controls="true"
    @step="stepFn"
    @auto="pass"
    @goon="goon"
  >
    <template #game-content>
      <div
        class="row flex-row"
        style="padding-top: 0.625rem; justify-content: space-around"
      >
        <div class="flex-col center rela" style="max-width: 25%">
          <message
            class="abso"
            style="top: 4.375rem; left: 0; width: 100%"
            show1="1"
            >1</message
          >
          <img class="avatar" :src="'./static/avatar/32.png'" />
          <span class="diff" :style="{ opacity: diff1 != 0 ? 1 : 0 }"
            >{{ diff1 > 0 ? "+" : "" }}{{ diff1 }}</span
          >
          <span class="scrore">{{ score1 }}</span>
        </div>
        <div class="flex-col center rela" style="max-width: 25%">
          <message class="abso" style="top: 4.375rem; left: 0; width: 100%"
            >asfasfasdfasfdasdfasdfas</message
          >
          <img class="avatar" :src="'./static/avatar/31.png'" />
          <span class="diff" :style="{ opacity: diff2 != 0 ? 1 : 0 }"
            >{{ diff2 > 0 ? "+" : "" }}{{ diff2 }}</span
          >
          <span class="scrore">{{ score2 }}</span>
        </div>
        <div class="flex-col center rela" style="max-width: 25%">
          <message class="abso" style="top: 4.375rem; left: 0; width: 100%"
            >1</message
          >
          <img class="avatar" :src="'./static/avatar/29.png'" />
          <span class="diff" :style="{ opacity: diff3 != 0 ? 1 : 0 }"
            >{{ diff3 > 0 ? "+" : "" }}{{ diff3 }}</span
          >
          <span class="scrore">{{ score3 }}</span>
        </div>
        <div class="flex-col center rela" style="max-width: 25%">
          <message class="abso" style="top: 4.375rem; left: 0; width: 100%"
            >1</message
          >
          <img class="avatar" :src="'./static/avatar/30.png'" />
          <span class="diff" :style="{ opacity: diff4 != 0 ? 1 : 0 }"
            >{{ diff4 > 0 ? "+" : "" }}{{ diff4 }}</span
          >
          <span class="scrore">{{ score4 }}</span>
        </div>
      </div>
      <div class="row">
        <div>
          <ul
            class="cardsul"
            style="padding-left: 0; margin: 0; min-height: 9.375rem"
          >
            <li
              v-for="item in arr"
              :key="item"
              class="card m-0"
              style="max-width: 25%"
            >
              <img
                :class="{
                  shanshuo: ssArr.indexOf(item) >= 0,
                  flyin1: flyin1.indexOf(item) >= 0,
                  flyin2: flyin2.indexOf(item) >= 0,
                  flyout1: flyout1.indexOf(item) >= 0,
                  flyout2: flyout2.indexOf(item) >= 0,
                }"
                :src="'./static/' + item + '.jpg'"
              />
            </li>
          </ul>
        </div>
      </div>
    </template>

    <template #win-content>
      <h1>
        <img
          class="avatar"
          :src="'./static/avatar/' + [32, 31, 29, 30][step % 4] + '.png'"
        />WIN!
      </h1>
    </template>
  </GameLayout>
</template>

<script>
import FishComponent from "./fish.js";
export default FishComponent;
</script>

<style scoped>
@import url("./sum.css");
</style>
