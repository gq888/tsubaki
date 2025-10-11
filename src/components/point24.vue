<template>
  <GameLayout
    v-bind="gameLayoutProps"
    :show-bottom-controls="true"
    :lose-subtitle="'NO EXP = 24'"
    @undo="undo"
    @goon="goon"
    @step="stepFn"
    @auto="pass"
  >
    <template #game-content>
      <div class="row center" style1="overflow:scroll">
        <div class="flex-row center">
          <ul class="cardsul flex-row center" style="padding-left: 0">
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
            style="padding-left: 0; margin-left: 1.25rem"
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
                  @click="hitflag && lockflag && clickCard(item, i)"
                ></point24card>
              </div>
            </div>
          </ul>
        </div>
      </div>
    </template>
  </GameLayout>
</template>

<script>
import Point24Component from "./point24.js";
export default Point24Component;
</script>

<style scoped>
@import url("./sum.css");
</style>
