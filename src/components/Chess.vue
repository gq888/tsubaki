<template>
  <GameLayout
    v-bind="gameLayoutProps"
    :container-style="{ width: '100%' }"
    :show-top-controls="true"
    :show-bottom-controls="true"
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
            style="
              padding-left: 0;
              margin: 0;
              width: 100%;
              max-width: 37.5rem;
              background-color: #719192;
              padding: 0.3125rem 0;
            "
          >
            <div
              v-for="(item, i) in cards1"
              :key="i"
              class="m-0 center"
              style="width: 16%; border-radius: 50%; overflow: hidden"
              @click="hitflag && lockflag && clickCard(i)"
            >
              <div
                class="center"
                style="width: 100%; position: relative"
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
                            : '#5FB878',
                }"
              >
                <div
                  class="shanshuo abso"
                  v-show="validBoxes.indexOf(i) >= 0"
                  style="
                    width: 100%;
                    height: 100%;
                    background-color: #ff5722;
                    top: 0;
                    left: 0;
                  "
                ></div>
                <img
                  :style="{
                    transform:
                      cards2[item] && grades[item] != grade
                        ? 'rotate(180deg)'
                        : 'rotate(0)',
                    opacity: item < 0 ? 0 : 100,
                  }"
                  :src="
                    !cards2[item]
                      ? './static/logo.webp'
                      : './static/avatar/' + item + '.webp'
                  "
                  style="width: 100%"
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
import ChessComponent from "./Chess.js";
export default ChessComponent;
</script>

<style scoped>
@import url("./sum.css");
</style>
