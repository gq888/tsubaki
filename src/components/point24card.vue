<template>
  <div class="">
    <div v-if="Number.isFinite(card)" class="">
      <img :src="'./static/' + card + '.jpg'" class="card" />
    </div>
    <div v-else class="align-center flex-col">
      <div class="vertical" style="width: 50px"><span>(</span></div>
      <point24card :card="card[0]"></point24card>
      <span class="m-0">{{ ["UP", "+", "-", "X", "/"][card[1]] }}</span>
      <point24card :card="card[2]"></point24card>
      <div class="vertical" style="width: 50px"><span>)</span></div>
    </div>
  </div>
</template>

<script>
export default {
  name: "point24card",
  props: ["card"],
};
</script>

<style>
@import url("./sum.css");
</style>
