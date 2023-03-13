<template>
  <div class="Sum">
  <h1>{{ title }}</h1>
  <div class="row" style1="overflow:scroll">
    <div>
      <ul class="cardsul flex-row center" style="padding-left: 0;">
        <div class="flex-col center" style="width: 100%">
          <!-- <span class="vertical m-0">(</span> -->
          <point24card :card="arr[0]"></point24card>
          <div class="flex-row" v-show="step < 3">
            <span class="sign center" :class="{choose: sign == 1}" @click="clickSign(1)">+</span>
            <span class="sign center" :class="{choose: sign == 2}" @click="clickSign(2)">-</span>
            <span class="sign center" :class="{choose: sign == 3}" @click="clickSign(3)">X</span>
            <span class="sign center" :class="{choose: sign == 4}" @click="clickSign(4)">/</span>
          </div>
          <div v-if="sign != 0" class="align-center">
            <div class="card"><img src="/static/bg.jpg"></div>
          </div>
          <!-- <span class="vertical m-0">)</span> -->
          <span class="vertical m-0">=</span>
          <span class="m-0">{{calc(arr[0]).toFixed(2)}}</span>
        </div>
        <div v-for="(item, i) in arr" :key='i' class="align-center flex-wrap center">
          <div v-if="i != 0" class="center">
            <point24card :card="item" @click.native="clickCard(item, i)"></point24card>
            <span class="sign center" @click="clickCard(item, i)">UP</span>
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
import point24 from './point24.js'
export default point24
</script>

<style scoped>
@import url("./sum.css");
</style>
