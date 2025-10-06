<template>
  <div class="Sum">
  <h1>{{ title }}</h1>
<GameControls
  :showUndo="false"
  :showRestart="false"
  :stepDisabled="!hitflag || !lockflag"
  :autoDisabled="!hitflag || !lockflag"
  @step="stepFn"
  @auto="pass"
/>
  <div class="row">
    <div class="center">
      <ul class="cardsul" style="padding-left: 0; max-width: 690px; justify-content: space-between; margin-top: 180px;">
        <li v-for="(item, i) in arr" :key='i' class="cards m-0" :class="'cards' + i">
          <img v-for="(card, j) in item" :key='card' class="m-0 card abso"
           :style="{top: (step == i ? j : 1 + j) * 30 + 'px', left: 0}"
           :src="'./static/' + (cards2[i] > j || step == i && (step == 12 && j == 3 || j == 4) ? card : 'bg') + '.jpg'">
          <div v-show="i == 12 && step != i" class="m-0 card" style="background-color: #719192;"></div>
        </li>
      </ul>
    </div>
  </div>
<GameControls
  :showUndo="false"
  :showRestart="false"
  :stepDisabled="!hitflag || !lockflag"
  :autoDisabled="!hitflag || !lockflag"
  @step="stepFn"
  @auto="pass"
/>
    <GameResultModal
      v-if="loseflag"
      subtitle="YOUR LUCKY CLASSES:"
      :buttons="[
        {
          text: 'GO ON',
          callback: goon,
          disabled: false
        }
      ]"
      :modalStyle="{ backgroundColor: 'rgba(0,0,0,0.8)' }"
    >
      <template v-slot:cards>
        <div class1="row" style="margin-top: 10px;">
          <div>
            <ul class="cardsul" style="padding-left: 0; max-width: 740px;">
              <div v-for="(item, i) in cards2" :key='i'>
                <img v-if="item >= 4 && i < 12" :src="'./static/' + (i * 4 + 1) + '.jpg'" class="card">
              </div>
            </ul>
          </div>
        </div>
      </template>
    </GameResultModal>
  </div>
</template>

<script>
import month from './month.js'
import GameResultModal from './GameResultModal.vue'
import GameControls from './GameControls.vue'

// 扩展month组件以包含GameResultModal和GameControls
const monthWithModal = {
  ...month,
  components: {
    GameResultModal,
    GameControls
  }
}

export default monthWithModal
</script>

<style scoped>
@import url("./sum.css");

.cards12, .cards12 .card {
}

.cards12 {
  position: absolute;
  top: -180px;
  height: 150px;
  min-width: 400px;
  width: 100%;
  height: 150px;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}
.cards12 .card {
  position: static;
}
</style>
