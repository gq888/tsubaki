<template>
  <GameLayout
    v-bind="gameLayoutProps"
    :lose-title="''"
    :lose-subtitle="'YOUR LUCKY CLASSES:'"
    :lose-buttons="[
      {
        text: 'GO ON',
        callback: goon,
        disabled: false,
      },
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
            style="
              padding-left: 0;
              max-width: 43.125rem;
              justify-content: space-between;
              margin-top: 11.25rem;
            "
          >
            <li
              v-for="(item, i) in arr"
              :key="i"
              class="cards m-0"
              :class="'cards' + i"
            >
              <CardImage
                v-for="(card, j) in item"
                :key="card"
                class="m-0 card abso"
                :style="{
                  top: ((month == i ? j : 1 + j) * 30) / 16 + 'rem',
                  left: 0,
                }"
                :card-id="
                  cards2[i] > j ||
                  (month == i && ((month == 12 && j == 3) || j == 4))
                    ? card
                    : 'bg'
                "
              />
              <div
                v-show="i == 12 && month != i"
                class="m-0 card"
                style="background-color: #719192"
              ></div>
            </li>
          </ul>
        </div>
      </div>
    </template>

    <template #lose-cards>
      <div class1="row" style="margin-top: 0.625rem">
        <div>
          <ul class="cardsul" style="padding-left: 0; max-width: 46.25rem">
            <CardImage
              v-for="(item, i) in visibleCards"
              :key="i"
              :card-id="item.cardId"
              class="card"
            />
          </ul>
        </div>
      </div>
    </template>
  </GameLayout>
</template>

<script>
import MonthComponent from "./month.js";

const component = {
  ...MonthComponent,
  computed: {
    ...MonthComponent.computed,
    visibleCards() {
      return this.cards2
        .map((item, i) => ({ originalItem: item, index: i, cardId: i * 4 + 1 }))
        .filter(item => item.originalItem >= 4 && item.index < 12);
    }
  }
};

export default component;
</script>

<style scoped>
@import url("./sum.css");

.cards12 {
  position: absolute;
  top: -11.25rem;
  height: 9.375rem;
  min-width: 25rem;
  width: 100%;
  height: 9.375rem;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}
.cards12 .card {
  position: static;
}
</style>
