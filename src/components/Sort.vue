<template>
  <GameLayout
    v-bind="gameLayoutProps"
    :lose-subtitle="n + '/' + (number + 1) * 4"
    :lose-buttons="[
      {
        text: 'RESTART',
        callback: goon,
        disabled: false,
      },
      {
        text: 'UNDO',
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
            <div
              v-for="(item, i) in cards1"
              :key="i"
              class="card m-0"
              style="width: 25%; height: 9.375rem"
            >
              <img
                :src="'./static/' + item + '.webp'"
                v-if="item >= 0"
                @click="canOperate && clickCard(item)"
                :class="{ shanshuo: canMoveCard(item) }"
              />
              <div
                v-else-if="cards1[i - 1] >= 4"
                @click="canOperate && clickSign(i)"
              >
                <span class="m-0">{{
                  types[cards1[i - 1] % 4] + point[(cards1[i - 1] >> 2) - 1]
                }}</span>
              </div>
            </div>
          </ul>
        </div>
      </div>
    </template>
  </GameLayout>
</template>

<script>
import SortComponent from "./Sort.js";
export default SortComponent;
</script>

<style scoped>
@import url("./sum.css");
</style>
