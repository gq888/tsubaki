<template>
  <div class="">
    <div v-if="Number.isFinite(card)" class="">
      <CardImage :card-id="card" class="card" />
    </div>
    <div v-else class="align-center flex-col">
      <div class="vertical" style="width: 3.125rem"><span>(</span></div>
      <point24card :card="card[0]"></point24card>
      <span class="m-0">{{ ["UP", "+", "-", "X", "/"][card[1]] }}</span>
      <point24card :card="card[2]"></point24card>
      <div class="vertical" style="width: 3.125rem"><span>)</span></div>
    </div>
  </div>
</template>

<script>
import CardImage from "./CardImage.vue";

export default {
  name: "point24card",
  components: {
    CardImage,
  },
  props: ["card"],
};
</script>

<style>
@import url("./sum.css");
</style>
