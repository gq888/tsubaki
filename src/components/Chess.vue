<template>
  <div class="Sum" style="width:100%;">
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
    <!-- <div>
      <ul class="cardsul flex-col" :style="{height: 150 * (number + 1) + 'px'}" style="padding-left: 0; width: 100%; max-width: 500px; margin: 0 auto; position: static">
        <div v-for="(item, i) in cards1" :key='i' class="card m-0" style="width:25%; height: 150px">
          <img :src="'./static/' + item + '.jpg'" v-if="item >= 0"
            @click="hitflag && lockflag && clickCard(item, i)" :class="{shanshuo: cards1[cards1.indexOf(item + 4) + 1] < 0}">
          <div v-else-if="cards1[i - 1] >= 4" @click="hitflag && lockflag && clickSign(i)">
            <span class="m-0">{{types[cards1[i - 1] % 4] + point[(cards1[i - 1] >> 2) - 1]}}</span>
          </div>
        </div>
      </ul>
    </div> -->
    <div>
      <div class="cardsul center bg-fff"
       style="padding-left: 0; margin: 0; width: 100%; background-color: #719192;">
        <div v-for="(item, i) in cards1" :key='item' class="m-0 center"
         style="width: 16%; border-radius: 50%; overflow: hidden;"
         @click="hitflag && lockflag && clickCard(item, i)">
          <div class="center" style="width: 100%;"
           :style="{backgroundColor: !cards2[item] ? '#fff' : grades[item] ? '#5FB878' : '#01AAED'}">
            <img
              :style="{transform: cards2[item] && grades[item] ? 'rotate(180deg)' : ''}"
              :src="!cards2[item] ? './static/logo.png' : './static/avatar/' + item + '.png'" style="width: 100%;"
            >
          </div>
        </div>
      </div>
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
      <h1 class="small">{{n + '/' + number * 4}}</h1>
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
import Chess from './Chess.js'
export default Chess
</script>

<style scoped>
@import url("./sum.css");
</style>
