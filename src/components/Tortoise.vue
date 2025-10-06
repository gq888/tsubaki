<template>
  <div class="Sum">
  <h1>{{ title }}</h1>
  <div class="row">
    <div>
      <ul class="cardsul cards" style="padding-left: 0; width: 100%; height: 750px; max-width: 500px; margin: auto">
        <li v-for="(item, i) in cards1" :key='i' v-show="!done(item)" class="card abso" :style="map[i]" style="width:20%; height: 150px; margin: 0">
          <img :src="'./static/' + (check(i) ? item : 'bg') + '.jpg'" @click="hitflag && lockflag && clickCard(item, i)" :class="{shanshuo: sign == item}">
        </li>
      </ul>
    </div>
  </div>
<div class="btns">

  <input type="button" value="UNDO" @click="undo" :disabled="step <= 0 || !hitflag || !lockflag"/>    
  &nbsp;
  &nbsp;
  &nbsp;
  &nbsp;
  <input type="button" value="RESTART" @click="goon" :disabled="!hitflag || !lockflag" />
  &nbsp;
  &nbsp;
  &nbsp;
  &nbsp;
  <input type="button" value="STEP" @click="stepFn" :disabled="!hitflag || !lockflag" />
  &nbsp;
  &nbsp;
  &nbsp;
  &nbsp;
  <input type="button" value="AUTO" @click="pass" :disabled="!hitflag || !lockflag" />
</div>
    <GameResultModal
      v-if="loseflag"
      title="U LOSE"
      subtitle="NO PAIR"
      :buttons="[
        {
          text: 'RESTART',
          callback: goon,
          disabled: false
        },
        {
          text: 'UNDO',
          callback: undo,
          disabled: step <= 0
        }
      ]"
      :modalStyle="{ backgroundColor: 'rgba(0,0,0,0.5)' }"
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
    />
  </div>
</template>

<script>
import Tortoise from './Tortoise.js'
import GameResultModal from './GameResultModal.vue'

// 扩展Tortoise组件以包含GameResultModal
const tortoiseWithModal = {
  ...Tortoise,
  components: {
    GameResultModal
  }
}

export default tortoiseWithModal
</script>

<style scoped>
@import url("./sum.css");
</style>
