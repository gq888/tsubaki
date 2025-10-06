<template>
  <div class="Sum">
  <h1>{{ title }}</h1>
<div class="btns">
  <GameControls 
    :buttons="[
      { 
        label: 'HIT', 
        action: 'hitBtn', 
        disabled: !hitflag 
      },
      { 
        label: 'PASS', 
        action: 'passBtn', 
        disabled: !hitflag 
      }
    ]"
    @hitBtn="hit(cardsChg,arr2)"
    @passBtn="pass"
  />
</div>
  <div class="row center">
    <img class="avatar" :src="'./static/avatar/17.png'">
    <span class="scrore">{{score1}}</span>
  </div>
  <div class="row">
    <div>
      <ul class="cardsul">
        <li v-for="item in arr1" :key='item.id' class="card"><img :src="'./static/' + item.id + '.jpg'"></li>
      </ul>
    </div>
  </div>
  <div class="row" style="margin-top: 10px;">
    <div>
      <ul class="cardsul reverse">
        <li v-for="item in arr2" :key='item.id' class="card"><img :src="'./static/' + item.id + '.jpg'"></li>
      </ul>
    </div>
  </div>
  <div class="row center">
    <img class="avatar" :src="'./static/avatar/32.png'">
    <span class="scrore">{{score2}}</span>
  </div>
<div class="btns">
  <GameControls 
    :buttons="[
      { 
        label: 'HIT', 
        action: 'hitBtn', 
        disabled: !hitflag 
      },
      { 
        label: 'PASS', 
        action: 'passBtn', 
        disabled: !hitflag 
      }
    ]"
    @hitBtn="hit(cardsChg,arr2)"
    @passBtn="pass"
  />
</div>
    <transition>
    <GameResultModal 
      v-if="loseflag" 
      :title="'U LOSE'"
      :buttons="[{ text: 'AGAIN', callback: goon }]"
      :modalStyle="{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }"
      :customClass="'lose'"
    />
    <GameResultModal 
      v-if="winflag" 
      :title="'U WIN!'"
      :buttons="[{ text: 'GO ON', callback: goon }]"
      :modalStyle="{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }"
      :customClass="'lose'"
    />
    <GameResultModal 
      v-if="drawflag" 
      :title="'DRAW GAME'"
      :buttons="[{ text: 'GO ON', callback: goon }]"
      :modalStyle="{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }"
      :customClass="'draw lose'"
    />
    </transition>
  </div>
</template>

<script>
import sum from './sum.js'
import GameResultModal from './GameResultModal.vue'
import GameControls from './GameControls.vue'
const componentConfig = {
  ...sum,
  components: {
    GameResultModal,
    GameControls
  }
}
export default componentConfig
</script>

<style scoped>
@import url("./sum.css");
</style>
