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
  <div class="row flex-row" style="padding-top: 10px; justify-content: space-around;">
    <div class="flex-col center rela" style="max-width: 25%;">
      <message class="abso" style="top: 70px;left: 0px;width: 100%;" show1="1">1</message>
      <img class="avatar" :src="'./static/avatar/32.png'">
      <span class="diff" :style="{opacity : diff1 != 0 ? 1 : 0}">{{diff1 > 0 ? '+' : ''}}{{diff1}}</span>
      <span class="scrore">{{score1}}</span>
    </div>
    <div class="flex-col center rela" style="max-width: 25%;">
      <message class="abso" style="top: 70px;left: 0px;width: 100%;">asfasfasdfasfdasdfasdfas</message>
      <img class="avatar" :src="'./static/avatar/31.png'">
      <span class="diff" :style="{opacity : diff2 != 0 ? 1 : 0}">{{diff2 > 0 ? '+' : ''}}{{diff2}}</span>
      <span class="scrore">{{score2}}</span>
    </div>
    <div class="flex-col center rela" style="max-width: 25%;">
      <message class="abso" style="top: 70px;left: 0px;width: 100%;">1</message>
      <img class="avatar" :src="'./static/avatar/29.png'">
      <span class="diff" :style="{opacity : diff3 != 0 ? 1 : 0}">{{diff3 > 0 ? '+' : ''}}{{diff3}}</span>
      <span class="scrore">{{score3}}</span>
    </div>
    <div class="flex-col center rela" style="max-width: 25%;">
      <message class="abso" style="top: 70px;left: 0px;width: 100%;">1</message>
      <img class="avatar" :src="'./static/avatar/30.png'">
      <span class="diff" :style="{opacity : diff4 != 0 ? 1 : 0}">{{diff4 > 0 ? '+' : ''}}{{diff4}}</span>
      <span class="scrore">{{score4}}</span>
    </div>
  </div>
  <div class="row">
    <div>
      <ul class="cardsul" style="padding-left: 0; margin: 0; min-height: 150px;">
        <li v-for="item in arr" :key='item' class="card m-0" style="max-width: 25%;">
          <img :class="{
              shanshuo: ssArr.indexOf(item) >= 0,
              flyin1: flyin1.indexOf(item) >= 0,
              flyin2: flyin2.indexOf(item) >= 0,
              flyout1: flyout1.indexOf(item) >= 0,
              flyout2: flyout2.indexOf(item) >= 0
            }"
            :src="'./static/' + item + '.jpg'">
        </li>
      </ul>
    </div>
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
    <div class="lose" v-if="winflag">
      <h1><img class="avatar" :src="'./static/avatar/' + [32, 31, 29, 30][step % 4] + '.png'">WIN!</h1>
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
