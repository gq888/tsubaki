<template>
  <GameLayout
    v-bind="gameLayoutProps"
    @goon="goon"
    @step="stepFn"
    @auto="pass"
  >
    <template #game-content>
      <div class="row">
        <span>MOVES: {{ moves }}</span>
        <br />
        <span>STEP: {{ step }}</span>
      </div>
      <div class="row">
        <div>
          <ul
            class="cardsul flex-col center"
            style="
              padding-left: 0;
              margin: 0;
              width: 100%;
              max-width: 31.25rem;
            "
          >
            <li
              v-for="(row, rowIndex) in grid"
              :key="rowIndex"
              class="flex-row center"
              style="padding: 0; margin: 0; list-style: none"
            >
              <div
                v-for="(number, colIndex) in row"
                :key="colIndex"
                class="grid-cell"
                :class="{
                  'empty-cell': number === 0
                }"
                @click="canOperate && clickCard(rowIndex, colIndex)"
              >
                <span v-if="number !== 0" class="number-tile">{{ number }}</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </template>

    <template #win-content>
      <h1 class="small">MOVES: {{ moves }}</h1>
      <h1 class="small">STEP: {{ step }}</h1>
    </template>
  </GameLayout>
</template>

<script>
import NumberPuzzleComponent from "./NumberPuzzle.js";

const component = NumberPuzzleComponent;

export default component;
</script>

<style scoped>
@import url("./sum.css");

.grid-cell {
  width: 4rem;
  height: 4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0.25rem 0.9375rem rgba(0, 0, 0, 0.1);
  border: 0.125rem solid transparent;
  margin: 0.125rem;
}

.grid-cell:hover {
  transform: translateY(-0.125rem);
  box-shadow: 0 0.375rem 1.25rem rgba(0, 0, 0, 0.15);
}

.grid-cell.movable-cell {
  background: rgba(76, 175, 80, 0.9);
  border-color: #4CAF50;
}

.grid-cell.movable-cell:hover {
  background: rgba(76, 175, 80, 1);
  transform: scale(1.05);
}

.grid-cell.empty-cell {
  background: rgba(255, 255, 255, 0.2);
  cursor: default;
}

.number-tile {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  text-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.1);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .grid-cell {
    width: 3.5rem;
    height: 3.5rem;
  }
  
  .number-tile {
    font-size: 1.3rem;
  }
}

@media (max-width: 360px) {
  .grid-cell {
    width: 3rem;
    height: 3rem;
  }
  
  .number-tile {
    font-size: 1.2rem;
  }
}
</style>