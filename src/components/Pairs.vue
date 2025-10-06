<template>
  <div class="Sum">
  <h1>{{ title }}</h1>
<GameControls
  :showUndo="false"
  :restartDisabled="!hitflag || !lockflag"
  :stepDisabled="!hitflag || !lockflag"
  :autoDisabled="!hitflag || !lockflag"
  @goon="goon"
  @step="stepFn"
  @auto="pass"
/>
  <div class="row">
    <span>TIME: {{time}}</span>
    <br>
    <span>STEP: {{step}}</span>
  </div>
  <div class="row">
    <div>
      <ul class="cardsul flex-row center" style="padding-left: 0; margin: 0;">
        <div v-for="(item, i) in cards1" :key='i' class="card m-0 radius" style="max-width: 25%;">
          <img :src="'./static/' + item + '.jpg'" v-if="sign == item || sign2 == item || cards2[item]">
          <img :src="'./static/bg.jpg'" v-else
            @click="hitflag && lockflag && clickCard(item, i)">
        </div>
      </ul>
    </div>
  </div>
<GameControls
  :showUndo="false"
  :restartDisabled="!hitflag || !lockflag"
  :stepDisabled="!hitflag || !lockflag"
  :autoDisabled="!hitflag || !lockflag"
  @goon="goon"
  @step="stepFn"
  @auto="pass"
/>
    <GameResultModal
      v-if="winflag"
      title="U WIN!"
      :buttons="[
        {
          text: 'GO ON',
          callback: goon,
          disabled: false
        }
      ]"
    >
      <template v-slot:content>
        <h1 class="small">TIME: {{time}}</h1>
        <h1 class="small">STEP: {{step}}</h1>
      </template>
    </GameResultModal>
  </div>
</template>

<script>
import Pairs from './Pairs.js'
import GameResultModal from './GameResultModal.vue'
import GameControls from './GameControls.vue'

// 扩展Pairs组件以包含GameResultModal和GameControls
const pairsWithModal = {
  ...Pairs,
  components: {
    GameResultModal,
    GameControls
  }
}

export default pairsWithModal
</script>

<style scoped>
@import url("./sum.css");
</style>
