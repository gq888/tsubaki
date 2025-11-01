<template>
  <GameLayout
    v-bind="gameLayoutProps"
    :win-title="'🎉 恭喜！'"
    :win-subtitle="`你成功清空了所有数字！最终得分：${score}`"
    :lose-title="'😔 游戏结束'"
    :lose-subtitle="`没有可用的序列了！最终得分：${score}`"
    @undo="undo"
    @goon="goon"
    @step="stepFn"
    @auto="pass"
  >
    <template #game-content>
      <div class="row center">
        <div class="game-container">
          <!-- 分数显示 -->
          <div class="score-display">
            <span class="scrore">得分: {{ score }}</span>
          </div>
          
          <!-- 游戏网格 -->
          <div class="grid-container">
            <div
              v-for="(row, rowIndex) in grid"
              :key="rowIndex"
              class="grid-row"
            >
              <div
                v-for="(cell, colIndex) in row"
                :key="colIndex"
                class="grid-cell"
                :class="{
                  'cell-empty': cell === null,
                  'cell-selectable': cell !== null && canOperate,
                  'cell-selected': isCellSelected(rowIndex, colIndex),
                  'cell-selectable-next': isCellSelectableNext(rowIndex, colIndex)
                }"
                @click="cell !== null && canOperate && handleCellClick(rowIndex, colIndex)"
              >
                <span v-if="cell !== null" class="cell-number">{{ cell }}</span>
              </div>
            </div>
          </div>
          
          <!-- 游戏状态提示 -->
          <div class="game-status">
            <p v-if="!gameManager.winflag && !gameManager.loseflag" class="status-text">
              选择相邻的递增数字序列（长度≥{{ minSequenceLength }}）
            </p>
            <p v-else-if="gameManager.winflag" class="status-text win-text">
              🎉 恭喜！你清空了所有数字！
            </p>
            <p v-else-if="gameManager.loseflag" class="status-text lose-text">
              😔 没有可用的序列了！
            </p>
          </div>
          
          <!-- 当前选中的序列显示 -->
          <div v-if="selectedCells.length > 0" class="selected-sequence">
            <h3>当前选中序列:</h3>
            <div class="sequence-display">
              <span
                v-for="(cell, index) in selectedCells"
                :key="index"
                class="sequence-cell"
              >
                {{ cell.value }}
              </span>
            </div>
            <div class="sequence-controls">
              <button
                class="btn-confirm"
                @click="confirmSequence"
                :disabled="!isValidSequence(selectedCells)"
              >
                确认选择
              </button>
              <button
                class="btn-clear"
                @click="clearSelection"
              >
                清除选择
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </GameLayout>
</template>

<script>
import NumberSequenceComponent from "./NumberSequence.js";

const component = NumberSequenceComponent;

export default component;
</script>

<style scoped>
@import url("./sum.css");

.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.25rem;
  max-width: 31.25rem;
  margin: 0 auto;
}

.score-display {
  margin-bottom: 1.25rem;
  text-align: center;
}

.grid-container {
  display: flex;
  flex-direction: column;
  background-color: #719192;
  padding: 0.625rem;
  border-radius: 0.3125rem;
  margin-bottom: 1.25rem;
}

.grid-row {
  display: flex;
  justify-content: center;
}

.grid-cell {
  width: 3.125rem;
  height: 3.125rem;
  border: 0.0625rem solid #dfcdc3;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #5FB878;
  margin: 0.125rem;
  border-radius: 0.1875rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.grid-cell.cell-empty {
  background-color: transparent;
  border: 0.0625rem dashed #719192;
  cursor: default;
}

.grid-cell.cell-selectable:hover {
  background-color: #FFB800;
  transform: scale(1.05);
}

.grid-cell.cell-selected {
  background-color: #FFB800;
  box-shadow: 0 0 0.625rem rgba(255, 184, 0, 0.8);
  transform: scale(1.05);
}

.grid-cell.cell-selectable-next {
  background-color: #01AAED;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    box-shadow: 0 0 0.3125rem rgba(1, 170, 237, 0.6);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 0 0.9375rem rgba(1, 170, 237, 0.8);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0.3125rem rgba(1, 170, 237, 0.6);
  }
}

.cell-number {
  font-size: 1.25rem;
  font-weight: bold;
  color: #fff;
}

.game-status {
  text-align: center;
  margin-bottom: 1.25rem;
}

.status-text {
  font-size: 1rem;
  color: #dfcdc3;
  margin: 0;
}

.status-text.win-text {
  color: #5FB878;
  font-weight: bold;
}

.status-text.lose-text {
  color: #FF5722;
  font-weight: bold;
}

.selected-sequence {
  background-color: #3c4245;
  padding: 1.25rem;
  border-radius: 0.3125rem;
  margin-top: 1.25rem;
  text-align: center;
}

.selected-sequence h3 {
  color: #dfcdc3;
  margin-bottom: 0.625rem;
  font-size: 1.125rem;
}

.sequence-display {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 0.9375rem;
  flex-wrap: wrap;
}

.sequence-cell {
  display: inline-block;
  width: 2.5rem;
  height: 2.5rem;
  background-color: #FFB800;
  color: #fff;
  font-weight: bold;
  font-size: 1.125rem;
  line-height: 2.5rem;
  text-align: center;
  margin: 0.1875rem;
  border-radius: 0.1875rem;
}

.sequence-controls {
  display: flex;
  justify-content: center;
  gap: 0.625rem;
}

.btn-confirm,
.btn-clear {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 0.1875rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-confirm {
  background-color: #5FB878;
  color: #fff;
}

.btn-confirm:hover:not(:disabled) {
  background-color: #01AAED;
}

.btn-confirm:disabled {
  background-color: #719192;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-clear {
  background-color: #FF5722;
  color: #fff;
}

.btn-clear:hover {
  background-color: #FF7043;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .grid-cell {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .cell-number {
    font-size: 1rem;
  }
  
  .sequence-cell {
    width: 2rem;
    height: 2rem;
    line-height: 2rem;
    font-size: 1rem;
  }
}
</style>