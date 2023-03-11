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
  <div class="row">
    <div>
      <ul class="cardsul">
        <li v-for="(item, i) in arr" :key='i' class="cards">
          <img v-for="(card, j) in item" :key='card' :style="{top: j * 30 + 'px'}"
           :src="'./static/' + (cards2[i] > j || step == i && (step == 0 && j == 3 || j == 4) ? card : 'bg') + '.jpg'" class="card abso">
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
    <div class="lose" v-if="loseflag" style="background-color: rgba(0,0,0,0.8);">
      <h1 class="small">YOUR LUCKY CLASSES:</h1>
      <div class1="row" style="margin-top: 10px;">
        <div>
          <ul class="cardsul">
            <div v-for="(item, i) in cards2" :key='i'>
              <img v-if="item >= 4" :src="'./static/' + (i * 4 + 1) + '.jpg'" class="card">
            </div>
          </ul>
        </div>
      </div>
      <input type="button" value="GO ON" @click="goon"/>
    </div>
    </transition>
  </div>
</template>

<script>
import month from './month.js'
export default month
</script>

<style scoped>
@import url("./sum.css");
</style>
