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
            <CardImage
              v-for="(item, i) in cardPositions"
              :key="i"
              class="card m-0 radius"
              style="max-width: 25%"
              :card-id="selectedCard == item || secondSelectedCard == item || matchedCards[item] ? item : 'bg'"
              @click="(selectedCard != item && secondSelectedCard != item && !matchedCards[item]) && canOperate && clickCard(item, i)"
            />
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

const component = PairsComponent;

export default component;
</script>

<style scoped>
@import url("./sum.css");
</style>
