<template>
  <div class="Sum">
  <h1>{{ title }}</h1>
<div class="btns">
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
<div class="btns">
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
    <div class="lose" v-if="winflag">
      <h1>U WIN!</h1>
      <h1 class="small">TIME: {{time}}</h1>
      <h1 class="small">STEP: {{step}}</h1>
      <input type="button" value="GO ON" @click="goon"/>
    </div>
    </transition>
  </div>
</template>

<script>
import Pairs from './Pairs.js'
export default Pairs
</script>

<style scoped>
@import url("./sum.css");
</style>
