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
    <div calss="center">
      <ul class="cardsul" style="padding-left: 0; max-width: 500px; margin: auto; justify-content: flex-start;">
        <li class="card m-0" style="width:25%; height: 150px" @click="hitflag && lockflag && clickCard(0)">
          <img :src="'./static/bg.jpg'" v-if="cards[0].length > 0" class="card m-0" style="width: 100%">
        </li>
        <li class="cards m-0 rela" style="width:50%; height: 150px" @click="hitflag && lockflag && clickCard(1)" :style="{zIndex: dragItem == 1 ? 11 : 'auto'}"
         :class="{drag: dragItem == 1}">
          <div class="m-0 card abso" v-for="i in cards[1].length >= (turn > 3 ? 1 : 4 - turn) ? (turn > 3 ? 1 : 4 - turn) : cards[1].length"
           :style="{right: (i - 1) * 25 + '%', zIndex: 3 - i}" :key="cards[1][i - 1] + fresh[1] * number" style="width: 50%"
           v-move="{start, end, move}" :class="{drag: dragItem == 1}">
            <img :src="'./static/' + cards[1][i - 1] + '.jpg'" :class="{shanshuo: sign == cards[1][i - 1], drag: dragItem == 1}">
          </div>
        </li>
        <li class="m-0 center" style="width:25%; max-width: 100px; height: 150px">
          <span class="m-0" :style="{color: turn > 3 ? 'red' : 'inherit'}">{{turn}}</span><span class="m-0">/3</span>
        </li>
      </ul>
      <div class="row" style="height: 30px;"></div>
      <ul class="cardsul" style="padding-left: 0; max-width: 500px; margin: auto; justify-content: space-between;">
        <li v-for="i in 4" :key="i" class="cards m-0 rela center" style="width:25%; height: 150px" :style="{zIndex: dragItem == i + 1 ? 11 : 'auto'}"
         :class="{drag: dragItem == i + 1}">
          <div class="card m-0 abso" style="left: 0; width: 100%;" @click="hitflag && lockflag && clickCard(i + 1)"
           @mouseenter="enter(i + 1)" @touchenter="enter(i + 1)" @mouseleave="leave(i + 1)" @touchleave="leave(i + 1)">
            <span class="m-0">{{types[i - 1] + 'A'}}</span>
          </div>
          <div v-for="item in cards[i + 1]" :key="item + fresh[i + 1] * number" class="card m-0 abso" style="width: 100%; left: 0; top: 0;"
           v-move="{start, end, move}" @mouseenter="enter(i + 1)" @touchenter="enter(i + 1)" @mouseleave="leave(i + 1)" @touchleave="leave(i + 1)"
           :class="{drag: dragItem == i + 1}">
            <img :src="'./static/' + item + '.jpg'" :class="{shanshuo: sign == item, drag: dragItem == i + 1}">
          </div>
        </li>
      </ul>
      <div class="row" style="height: 30px;"></div>
      <ul class="cardsul" style="padding-left: 0; max-width: 500px; margin: auto; justify-content: space-between;">
        <li v-for="i in 4" :key="i" class="cards m-0 rela" style="width:25%" :class="{drag: dragItem == i + 5}"
         :style="{height: cards[i + 5].length * 30 + 120 + 'px', left: 0, zIndex: dragItem == i + 5 ? 11 : 'auto'}" @click1="end">
          <div class="m-0 card abso" v-for="(item, j) in cards[i + 5]" :key='item + fresh[i + 5] * number' style="width: 100%; height: 150px"
           :style="{top: j * 30 + 'px', left: 0}" :class="{drag: dragItem == i + 5}"
           v-move="{start, end, move}" ref="down" @mouseenter="enter(i + 5)" @touchenter="enter(i + 5)" @mouseleave="leave(i + 5)" @touchleave="leave(i + 5)">
            <img :src="'./static/' + item + '.jpg'" :class="{shanshuo: sign == item}">
          </div>
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
    <div class="lose" v-if="winflag">
      <h1>U WIN!</h1>
      <input type="button" value="GO ON" @click="goon"/>
    </div>
    </transition>
  </div>
</template>

<script>
import Spider from './Spider.js'
export default Spider
</script>

<style scoped>
@import url("./sum.css");

.drag {
  pointer-events: none;
  z-index: 11;
}
</style>
