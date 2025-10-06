<template>
  <div class="Sum">
  <h1>{{ title }}</h1>
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
  <div class="row">
    <div>
      <ul class="cardsul flex-col" :style="{height: 150 * (number + 1) + 'px'}" style="padding-left: 0; width: 100%; max-width: 500px; margin: 0 auto; position: static">
        <div v-for="(item, i) in cards1" :key='i' class="card m-0" style="width:25%; height: 150px">
          <img :src="'./static/' + item + '.jpg'" v-if="item >= 0"
            @click="hitflag && lockflag && clickCard(item, i)" :class="{shanshuo: cards1[cards1.indexOf(item + 4) + 1] < 0}">
          <div v-else-if="cards1[i - 1] >= 4" @click="hitflag && lockflag && clickSign(i)">
            <span class="m-0">{{types[cards1[i - 1] % 4] + point[(cards1[i - 1] >> 2) - 1]}}</span>
          </div>
        </div>
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
      :subtitle="n + '/' + number * 4"
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
import Sort from './Sort.js'
import GameResultModal from './GameResultModal.vue'

// 扩展Sort组件以包含GameResultModal
const sortWithModal = {
  ...Sort,
  components: {
    GameResultModal
  }
}

export default sortWithModal
</script>

<style scoped>
@import url("./sum.css");
</style>
