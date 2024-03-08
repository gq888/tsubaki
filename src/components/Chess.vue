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
  <input type="button" value="STEP" @click="stepTwiceFn" :disabled="!hitflag || !lockflag" />
  &nbsp;
  &nbsp;
  &nbsp;
  &nbsp;
  <input type="button" value="AUTO" @click="pass" :disabled="!hitflag || !lockflag" />
</div>
  <div class="row center">
    <div>
      <div class="cardsul center"
       style="padding-left: 0; margin: 0; width: 100%; max-width: 600px; background-color: #719192; padding: 5px 0;">
        <div v-for="(item, i) in cards1" :key='i' class="m-0 center"
         style="width: 16%; border-radius: 50%; overflow: hidden;"
         @click="hitflag && lockflag && clickCard(i)">
          <div class="center" style="width: 100%; position: relative;"
           :style="{backgroundColor: item < 0 ? 'transparent' : !cards2[item] ? '#fff' : item == sign ? '#FFB800' : grades[item] == grade ? '#01AAED' : '#5FB878'}">
            <div class="shanshuo abso" v-show="validBoxes.indexOf(i) >= 0"
             style="width: 100%; height: 100%; background-color: #FF5722; top: 0; left: 0;"></div>
            <img
              :style="{transform: cards2[item] && grades[item] != grade ? 'rotate(180deg)' : 'rotate(0)', opacity: item < 0 ? 0 : 100}"
              :src="!cards2[item] ? './static/logo.png' : './static/avatar/' + item + '.png'" style="width: 100%;"
            >
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="row">
    <span class="m-0 scrore">{{lowCount + ' : ' + highCount}}</span>
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
  <input type="button" value="STEP" @click="stepTwiceFn" :disabled="!hitflag || !lockflag" />
  &nbsp;
  &nbsp;
  &nbsp;
  &nbsp;
  <input type="button" value="AUTO" @click="pass" :disabled="!hitflag || !lockflag" />
</div>
    <transition>
    <div class="lose" v-if="status == 3" style="background-color: rgba(0,0,0,0.5);">
      <h1>DRAW GAME</h1>
      <input type="button" value="RESTART" @click="goon"/>
      <input type="button" value="UNDO" @click="undo" :disabled="step <= 0"/>
    </div>
    <div class="lose" v-if="status == 2" style="background-color: rgba(0,0,0,0.5);">
      <h1>U LOSE</h1>
      <input type="button" value="RESTART" @click="goon"/>
      <input type="button" value="UNDO" @click="undo" :disabled="step <= 0"/>
    </div>
    <div class="lose" v-if="status == 1">
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
