<template>
  <div class="Sum">
  <h1>{{ title }}</h1>
  <div class="row">
    <div>
      <ul class="cardsul cards" style="padding-left: 0; width: 100%; height: 750px; max-width: 500px; margin: auto">
        <li v-for="(item, i) in cards1" :key='i' v-show="!done(item)" class="card abso" :style="map[i]" style="width:20%; height: 150px; margin: 0">
          <img :src="'./static/' + (check(i) ? item : 'bg') + '.jpg'" @click="hitflag && lockflag && clickCard(item, i)" :class="{shanshuo: sign == item}">
        </li>
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
      <h1 class="small">NO PAIR</h1>
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
import Tortoise from './Tortoise.js'
export default Tortoise
</script>

<style scoped>
@import url("./sum.css");
</style>
