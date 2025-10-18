<template>
  <GameLayout
    v-bind="gameLayoutProps"
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
          <ul
            class="cardsul flex-row center"
            style="padding-left: 0; margin: 0"
          >
            <div
              v-for="(item, i) in cards1"
              :key="i"
              class="card m-0 radius"
              style="max-width: 25%"
            >
              <CardImage
                :card-id="item"
                v-if="sign == item || sign2 == item || cards2[item]"
              />
              <CardImage
                card-id="bg"
                v-else
                @click="canOperate && clickCard(item, i)"
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
import PairsComponent from "./Pairs.js";
import CardImage from "./CardImage.vue";

const component = PairsComponent;
component.components = {
  ...component.components,
  CardImage,
};

export default component;
</script>

<style scoped>
@import url("./sum.css");
</style>
