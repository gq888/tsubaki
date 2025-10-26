<template>
  <GameLayout
    v-bind="gameLayoutProps"
    @undo="undo"
    @goon="goon"
    @step="stepFn"
    @auto="pass"
  >
    <template #game-content>
      <div class="row">
        <span>步数: {{ step }}</span>
        <br />
        <span>当前数字数量: {{ currentNumberCount }}</span>
      </div>
      <div class="row">
        <div>
          <div
            class="cardsul center"
            style="
              padding-left: 0;
              margin: 0;
              width: 100%;
              max-width: 37.5rem;
              background-color: #719192;
              padding: 0.3125rem 0;
            "
          >
            <div
              v-for="(item, i) in grid"
              :key="i"
              class="m-0 center"
              style="width: 16%; height: 3.125rem; border-radius: 0.3125rem; overflow: hidden; margin: 0.125rem; cursor: pointer;"
              @click="canOperate && clickNumber(i)"
              :style="{
                backgroundColor: item === 0 ? '#4CAF50' : item === 99 ? '#FF5722' : item === -1 ? '#E0E0E0' : '#5FB878',
                border: targetPath.includes(i) ? '2px solid #FFD700' : '1px solid #333'
              }"
            >
              <div
                class="center"
                style="width: 100%; height: 100%; position: relative; font-size: 1.125rem; font-weight: bold; color: white;"
              >
                <span v-if="item === 0">起</span>
                <span v-else-if="item === 99">终</span>
                <span v-else-if="item === -1"></span>
                <span v-else>{{ item }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="row" style="margin-top: 1rem;">
        <div style="text-align: center; color: #dfcdc3; font-size: 1rem;">
          <span v-if="pathFound">✓ 找到有效路径</span>
          <span v-else>✗ 未找到路径</span>
          <br />
          <span v-if="emptyPos >= 0">空位位置: {{ emptyPos + 1 }}</span>
        </div>
      </div>
    </template>

    <template #win-content>
      <h1 class="small">步数: {{ step }}</h1>
      <h1 class="small">找到路径: {{ targetPath.length }} 步</h1>
    </template>
  </GameLayout>
</template>

<script>
import NumberMazeComponent from "./NumberMaze.js";

const component = NumberMazeComponent;

export default component;
</script>

<style scoped>
@import url("./sum.css");

.cardsul {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  gap: 0.25rem;
}

.cardsul > div {
  transition: all 0.3s ease;
}

.cardsul > div:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
}

.cardsul > div:active {
  transform: scale(0.95);
}
</style>