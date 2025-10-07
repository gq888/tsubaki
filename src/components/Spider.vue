<template>
  <div class="Sum">
    <h1>{{ title }}</h1>
    <GameControls
      :undoDisabled="undoDisabled"
      :restartDisabled="restartDisabled"
      :stepDisabled="stepDisabled"
      :autoDisabled="autoDisabled"
      @undo="undo"
      @goon="goon"
      @step="stepFn"
      @auto="pass"
    />
    <div class="row">
      <div calss="center">
        <ul
          ref="container"
          class="cardsul rela center"
          style="padding-left: 0; max-width: 500px; margin: auto;"
          :style="{ height: height + 'px' }"
        >
          <li
            class="m-0 static"
            style="max-width: 100px; width:25%; height: 150px; z-index: 0;"
            @click="hitflag && lockflag && clickCard(0)"
          >
            <img
              :src="'./static/bg.jpg'"
              v-if="cards[0].length > 0"
              class="card m-0 abso"
              style="width:25%; left: 0; top: 0; "
            />
            <div
              v-else
              class="card m-0 abso"
              style="width:25%; left: 0; top: 0; "
            ></div>
          </li>
          <li
            class="cards m-0 static"
            style="width:50%; height: 150px"
            :style="{ zIndex: dragItem == 1 ? 10 : 0 }"
            :class="{ drag: dragItem == 1 }"
          >
            <div
              class="m-0 card abso"
              v-for="i in cards[1].length >= (turn > 3 ? 1 : 4 - turn)
                ? turn > 3
                  ? 1
                  : 4 - turn
                : cards[1].length"
              :style="{ left: (3 - i) * 12.5 + 25 + '%', zIndex: 3 - i }"
              :key="cards[1][i - 1] + (fresh[1] * 3 + 1) * number"
              style="width: 25%; top: 0;"
              v-move="{ start, end, move }"
              :class="{
                drag: dragItem == 1,
                opa0: dragCard == cards[1][i - 1] && enterItem >= 0
              }"
            >
              <img
                :src="'./static/' + cards[1][i - 1] + '.jpg'"
                :class="{
                  shanshuo: sign == cards[1][i - 1],
                  drag: dragItem == 1
                }"
              />
            </div>
          </li>
          <li
            class="m-0 center"
            style="width:25%; max-width: 100px; height: 150px"
          >
            <span
              class="m-0"
              :style="{ color: turn > 3 ? 'red' : 'inherit' }"
              >{{ turn }}</span
            ><span class="m-0">/3</span>
          </li>
          <li style="height: 30px; width: 100%"></li>
          <li
            v-for="i in 4"
            :key="i"
            class="cards m-0 static center"
            style="width:25%; height: 150px;"
            :class="{ drag: dragItem == i + 1 }"
            ref="middleBox"
            :style="{ zIndex: dragItem == i + 1 ? 10 : 1 }"
            @mouseenter="enter(i + 1)"
            @touchenter="enter(i + 1)"
            @mouseleave="leave(i + 1)"
            @touchleave="leave(i + 1)"
          >
            <div
              class="card m-0 abso"
              style="top: 180px; width:25%;"
              @click="hitflag && lockflag && clickCard(i + 1)"
              :style="{
                zIndex: dragItem == i + 1 ? 10 : 1,
                left: (i - 1) * 25 + '%'
              }"
            >
              <span class="m-0">{{ types[i - 1] + "A" }}</span>
            </div>
            <div
              v-for="item in cards[i + 1]"
              :key="item + (fresh[i + 1] * 3 + 2) * number"
              class="card m-0 abso"
              style="top: 180px; width:25%;"
              v-move="{ start, end, move }"
              :style="{ left: (i - 1) * 25 + '%' }"
              :class="{ drag: dragItem == i + 1 }"
            >
              <img
                :src="'./static/' + item + '.jpg'"
                :class="{
                  shanshuo: sign == item,
                  drag: dragItem == i + 1,
                  opa0: dragCard == item && enterItem >= 0
                }"
              />
            </div>
            <img
              :src="'./static/' + dragCard + '.jpg'"
              :style="{ left: (i - 1) * 25 + '%' }"
              class="card m-0 abso"
              v-show="dragCard >= 0 && enterItem == i + 1"
              style="width:25%; height: 150px; top: 180px;"
            />
          </li>
          <li style="height: 30px; width: 100%"></li>
          <li
            v-for="i in 4"
            :key="i + 4"
            class="cards m-0 static"
            style="width:25%;"
            :class="{ drag: dragItem == i + 5 }"
            :style="{
              height: cards[i + 5].length * 30 + 120 + 'px',
              zIndex: dragItem == i + 5 ? 10 : 1
            }"
            ref="downBox"
            @mouseenter="enter(i + 5)"
            @touchenter="enter(i + 5)"
            @mouseleave="leave(i + 5)"
            @touchleave="leave(i + 5)"
          >
            <div
              class="m-0 card abso"
              v-for="(item, j) in cards[i + 5]"
              :key="item + (fresh[i + 5] * 3 + 3) * number"
              style="width: 25%; height: 150px"
              :style="{ top: j * 30 + 360 + 'px', left: (i - 1) * 25 + '%' }"
              :class="{
                drag: dragItem == i + 5,
                opa0: dragItem == i + 5 && dragCard >= item && enterItem >= 0
              }"
              v-move="{ start, end, move }"
              ref="down"
            >
              <img
                :src="'./static/' + item + '.jpg'"
                :class="{ shanshuo: sign == item, drag: dragItem == i + 5 }"
              />
            </div>
            <img
              v-for="(item, j) in cards[dragItem]"
              :key="j + 8"
              :src="'./static/' + item + '.jpg'"
              :style="{
                top:
                  cards[i + 5].length * 30 +
                  (j - cards[dragItem].indexOf(dragCard)) * 30 +
                  360 +
                  'px',
                left: (i - 1) * 25 + '%'
              }"
              class="card m-0 abso"
              v-show="
                enterItem == i + 5 &&
                  ((dragItem >= 6 && dragCard >= item) || dragCard == item)
              "
              style="width:25%; height: 150px"
            />
          </li>
        </ul>
      </div>
    </div>
    <GameControls
      :undoDisabled="undoDisabled"
      :restartDisabled="restartDisabled"
      :stepDisabled="stepDisabled"
      :autoDisabled="autoDisabled"
      @undo="undo"
      @goon="goon"
      @step="stepFn"
      @auto="pass"
    />
    <GameResultModal
      v-if="winflag"
      title="U WIN!"
      :buttons="[
        {
          text: 'GO ON',
          callback: goon,
          disabled: false
        }
      ]"
    />
  </div>
</template>

<script>
import Spider from "./Spider.js";
import GameResultModal from "./GameResultModal.vue";
import GameControls from "./GameControls.vue";

// 扩展Spider组件以包含GameResultModal和GameControls
const spiderWithModal = {
  ...Spider,
  components: {
    ...Spider.components, // 保留原来的组件
    GameResultModal,
    GameControls
  }
};

export default spiderWithModal;
</script>

<style scoped>
@import url("./sum.css");
.card,
.cards {
  z-index: 1;
}
.drag {
  pointer-events: none;
  z-index: 0;
}
.opa0 {
  opacity: 0;
}
</style>
