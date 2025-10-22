<template>
  <GameLayout
    v-bind="gameLayoutProps"
    :win-buttons="[{ text: 'GO ON', action: 'goon', callback: goon }]"
    :win-modal-style="{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }"
    :win-custom-class="'lose'"
    :lose-buttons="[{ text: 'AGAIN', action: 'goon', callback: goon }]"
    :lose-modal-style="{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }"
    :lose-custom-class="'lose'"
    :draw-buttons="[{ text: 'GO ON', action: 'goon', callback: goon }]"
    :draw-modal-style="{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }"
    :draw-custom-class="'draw lose'"
    @goon="goon"
  >
    <template #game-content>
      <div class="row center">
        <img class="avatar" :src="'./static/avatar/17.webp'" />
        <span class="scrore">{{ score1 }}</span>
      </div>
      <div class="row">
        <div>
          <ul class="cardsul">
            <CardImage
              v-for="item in arr1"
              :key="item.id"
              class="card"
              :card-id="item.id"
            />
          </ul>
        </div>
      </div>
      <div class="row" style="margin-top: 0.625rem">
        <div>
          <ul class="cardsul reverse">
            <CardImage
              v-for="item in arr2"
              :key="item.id"
              class="card"
              :card-id="item.id"
            />
          </ul>
        </div>
      </div>
      <div class="row center">
        <img class="avatar" :src="'./static/avatar/32.webp'" />
        <span class="scrore">{{ score2 }}</span>
      </div>
    </template>
    <template #bottom-controls>
      <GameControls
        :buttons="[
          {
            label: 'HIT',
            action: 'hitBtn',
            disabled: stepDisabled,
          },
          {
            label: 'PASS',
            action: 'passBtn',
            disabled: autoDisabled,
          },
        ]"
        @hitBtn="handleHitBtn"
        @passBtn="pass"
      />
    </template>
  </GameLayout>
</template>

<script>
import SumComponent from "./sum.js";

const component = SumComponent;

export default component;
</script>

<style scoped>
@import url("./sum.css");
</style>
