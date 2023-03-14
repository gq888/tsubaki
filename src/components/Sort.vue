<template>
  <div class="Sum">
  <h1>{{ title }}</h1>
  <div class="row">
    <div>
      <ul class="cardsul flex-col" style="padding-left: 0; width: 100%; height: 2100px; max-width: 500px; margin: 0 auto; position: static">
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
    <transition>
    <div class="lose" v-if="loseflag" style="background-color: rgba(0,0,0,0.5);">
      <h1>U LOSE</h1>
      <input type="button" value="RESTART" @click="goon"/>
      <input type="button" value="UNDO" @click="undo" :disabled="step <= 0"/>
    </div>
    <div class="lose" v-if="winflag">
      <h1>U WIN!</h1>
      <input type="button" value="GO ON" @click="goon"/>
    </div>
    </transition>
  </div>
</template>

<script>
import Sort from './Sort.js'
export default Sort
</script>

<style scoped>
@import url("./sum.css");
</style>
