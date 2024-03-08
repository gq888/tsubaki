<template>
  <div class="Sum">
  <h1>{{ title }}</h1>
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

  <input type="button" value="HIT" @click="hit(cardsChg,arr2)" :disabled="!hitflag"/>
  &nbsp;
  &nbsp;
  &nbsp;
  &nbsp;
  <input type="button" value="PASS" @click="pass" :disabled="!hitflag" />
</div>
    <transition>
    <div class="lose" v-if="loseflag">
      <h1>U LOSE</h1>
      <input type="button" value="AGAIN" @click="goon"/>
    </div>
    <div class="lose" v-if="winflag">
      <h1>U WIN!</h1>
      <input type="button" value="GO ON" @click="goon"/>
    </div>
    <div class="draw lose" v-if="drawflag">
      <h1>DRAW GAME</h1>
      <input type="button" value="GO ON" @click="goon"/>
    </div>
    </transition>
  </div>
</template>

<script>
import sum from './sum.js'
export default sum
</script>

<style scoped>
@import url("./sum.css");
</style>
