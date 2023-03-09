<template>
  <div class="Sum">
  <h1>{{ title }}</h1>
<div class="btns">

  <input type="button" value="STEP" @click="stepFn" :disabled="!hitflag || !lockflag"/>    
  &nbsp;
  &nbsp;
  &nbsp;
  &nbsp;
  <input type="button" value="AUTO" @click="pass" :disabled="!hitflag || !lockflag" />
</div>
  <div class="row center">
    <img class="avatar" src="../assets/0.png">
    <span class="scrore">{{score1}}</span>
  </div>
  <div class="row">
    <div>
      <ul class="cardsul">
        <li v-for="item in arr" :key='item' class="card">
          <img :class="{shanshuo: ssArr.indexOf(item) >= 0}" :src="'./static/' + item + '.jpg'">
        </li>
      </ul>
    </div>
  </div>
  <div class="row center">
    <img class="avatar" src="../assets/1.png">
    <span class="scrore">{{score2}}</span>
  </div>
<div class="btns">

  <input type="button" value="STEP" @click="stepFn" :disabled="!hitflag || !lockflag"/>    
  &nbsp;
  &nbsp;
  &nbsp;
  &nbsp;
  <input type="button" value="AUTO" @click="pass" :disabled="!hitflag || !lockflag" />
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
    </transition>
  </div>
</template>

<script>
import fish from './fish.js'
export default fish
</script>

<style scoped>
@import url("./sum.css");
</style>
