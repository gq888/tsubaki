<template>
  <GameLayout
    v-bind="gameLayoutProps"
    :lose-subtitle="n + '/' + (number + 1) * 4"
    :lose-buttons="[
      {
        label: 'RESTART',
        action: 'goon',
        callback: goon,
        disabled: false,
      },
      {
        label: 'UNDO',
        action: 'undo',
        callback: undo,
        disabled: undoDisabled,
      },
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
            :style="{ height: (150 * (number + 1)) / 16 + 'rem' }"
            style="
              padding-left: 0;
              width: 100%;
              max-width: 31.25rem;
              margin: 0 auto;
              position: static;
            "
          >
            <CardImage
              v-for="(item, i) in cards1"
              :key="i"
              class="card m-0"
              style="width: 25%; height: 9.375rem"
              :card-id="item"
              :hide="item < 0"
              @click="canOperate && (item >= 0 ? clickCard(item) : cards1[i - 1] >= 4 && clickSign(i))"
              :class="{ shanshuo: item >= 0 && canMoveCard(item) }"
            >
              <span v-if="cards1[i - 1] >= 4" class="m-0">{{ getCurrentCandidateCard(i) }}</span>
            </CardImage>
          </ul>
        </div>
      </div>
    </template>
  </GameLayout>
</template>

<script>
import SortComponent from "./Sort.js";

const component = SortComponent;

export default component;
</script>

<style scoped>
@import url("./sum.css");
</style>
