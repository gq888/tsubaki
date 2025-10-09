<template>
  <GameLayout
    v-bind="gameLayoutProps"
    :show-bottom-controls="true"
    :lose-subtitle="'NO PAIR'"
    @undo="undo"
    @goon="goon"
    @step="stepFn"
    @auto="pass"
  >
    <template #game-content>
      <div class="row">
        <div>
          <ul
            class="cardsul cards"
            style="
              padding-left: 0;
              width: 100%;
              height: 750px;
              max-width: 500px;
              margin: auto;
            "
          >
            <li
              v-for="(item, i) in cards1"
              :key="i"
              v-show="!done(item)"
              class="card abso"
              :style="map[i]"
              style="width: 20%; height: 150px; margin: 0"
            >
              <img
                :src="'./static/' + (check(i) ? item : 'bg') + '.jpg'"
                @click="hitflag && lockflag && clickCard(item, i)"
                :class="{ shanshuo: sign == item }"
              />
            </li>
          </ul>
        </div>
      </div>
    </template>
  </GameLayout>
</template>

<script>
import TortoiseComponent from "./Tortoise.js";
export default TortoiseComponent;
</script>

<style scoped>
@import url("./sum.css");
</style>
