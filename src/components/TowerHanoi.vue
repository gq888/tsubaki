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
        <span>移动次数: {{ moveCount }}</span>
        <br />
        <span>最优解: {{ minMoves }} 步</span>
      </div>
      
      <div class="row">
        <div>
          <div 
            class="towers-container center"
            style="
              padding: 1rem;
              margin: 0;
              width: 100%;
              max-width: 37.5rem;
              background-color: #719192;
              border-radius: 0.5rem;
            "
          >
            <div 
              v-for="(tower, towerIndex) in towers" 
              :key="towerIndex"
              class="tower"
              :class="{ selected: selectedTower === towerIndex }"
              @click="canOperate && clickTower(towerIndex)"
            >
              <div class="tower-label">{{ getTowerName(towerIndex) }}</div>
              <div class="tower-base"></div>
              <div class="tower-pole"></div>
              <div class="disks-container">
                <div 
                  v-for="disk in tower" 
                  :key="disk"
                  class="disk"
                  :class="getDiskClass(disk)"
                  :style="getDiskStyle(disk)"
                >
                  {{ disk }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row" style="margin-top: 1rem;">
        <div style="text-align: center; color: #dfcdc3; font-size: 1rem;">
          <span v-if="selectedTower >= 0">
            已选中: {{ getTowerName(selectedTower) }} - 点击目标柱子移动圆盘
          </span>
          <span v-else>点击柱子选择圆盘</span>
        </div>
      </div>
      
      <div class="row">
        <div class="difficulty-selector">
          <label>圆盘数量: </label>
          <select 
            v-model="diskCount" 
            @change="resetGame"
            style="
              padding: 0.5rem 1rem;
              border: 0.125rem solid #6c757d;
              border-radius: 0.375rem;
              background: white;
              font-size: 1rem;
              font-weight: bold;
              color: #495057;
              cursor: pointer;
            "
          >
            <option value="3">3个圆盘</option>
            <option value="4">4个圆盘</option>
            <option value="5">5个圆盘</option>
            <option value="6">6个圆盘</option>
            <option value="7">7个圆盘</option>
            <option value="8">8个圆盘</option>
          </select>
        </div>
      </div>
    </template>

    <template #win-content>
      <h1 class="small">步数: {{ step }}</h1>
      <h1 class="small">移动次数: {{ moveCount }}</h1>
      <h1 class="small">最优解: {{ minMoves }} 步</h1>
    </template>
  </GameLayout>
</template>

<script>
import TowerHanoi from "./TowerHanoi.js";
import { GameComponentPresets } from "../utils/gameComponentFactory.js";

// 使用工厂函数创建增强的TowerHanoi组件
export default GameComponentPresets.puzzleGame(TowerHanoi, 800);
</script>

<style scoped>
@import url("./sum.css");

/* 汉诺塔游戏样式 - 遵循项目标准 */
.towers-container {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  min-height: 18.75rem;
  padding: 1.25rem 0;
  gap: 1rem;
  flex-wrap: wrap;
}

.tower {
  position: relative;
  width: 11.25rem;
  height: 17.5rem;
  margin: 0 0.625rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 0.5rem;
  background: linear-gradient(to bottom, #f8f8f8, #e8e8e8);
  border: 0.125rem solid #ccc;
}

.tower:hover {
  background: linear-gradient(to bottom, #f0f0f0, #e0e0e0);
  border-color: #999;
  transform: translateY(-0.125rem);
  box-shadow: 0 0.25rem 0.75rem rgba(0,0,0,0.15);
}

.tower.selected {
  background: linear-gradient(to bottom, #e3f2fd, #bbdefb);
  border-color: #2196f3;
  box-shadow: 0 0.375rem 1.25rem rgba(33, 150, 243, 0.3);
  transform: translateY(-0.25rem);
}

.tower-label {
  position: absolute;
  top: 0.625rem;
  left: 50%;
  transform: translateX(-50%);
  font-weight: bold;
  color: #333;
  font-size: 1rem;
  background: rgba(255,255,255,0.9);
  padding: 0.3125rem 0.625rem;
  border-radius: 0.9375rem;
  border: 0.0625rem solid #ddd;
}

.tower-base {
  position: absolute;
  bottom: 0;
  left: 0.625rem;
  right: 0.625rem;
  height: 0.5rem;
  background: linear-gradient(to right, #8d6e63, #6d4c41);
  border-radius: 0.25rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.2);
}

.tower-pole {
  position: absolute;
  bottom: 0.5rem;
  left: 50%;
  transform: translateX(-50%);
  width: 0.375rem;
  height: 13.75rem;
  background: linear-gradient(to top, #8d6e63, #6d4c41);
  border-radius: 0.1875rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.2);
}

.disks-container {
  position: absolute;
  bottom: 0.5rem;
  left: 0.625rem;
  right: 0.625rem;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: 0.125rem;
}

.disk {
  height: 1.5rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 0.75rem;
  text-shadow: 0.0625rem 0.0625rem 0.125rem rgba(0,0,0,0.5);
  box-shadow: 0 0.125rem 0.25rem rgba(0,0,0,0.2);
  transition: all 0.2s ease;
  border: 0.125rem solid rgba(255,255,255,0.3);
}

.disk:hover {
  transform: scale(1.05);
  box-shadow: 0 0.25rem 0.5rem rgba(0,0,0,0.3);
}

/* 不同大小的圆盘颜色 */
.disk-size-1 { background: linear-gradient(45deg, #ff6b6b, #ee5a52); width: 2.5rem; }
.disk-size-2 { background: linear-gradient(45deg, #4ecdc4, #44a08d); width: 3.75rem; }
.disk-size-3 { background: linear-gradient(45deg, #45b7d1, #3498db); width: 5rem; }
.disk-size-4 { background: linear-gradient(45deg, #f9ca24, #f0932b); width: 6.25rem; }
.disk-size-5 { background: linear-gradient(45deg, #6c5ce7, #5f3dc4); width: 7.5rem; }
.disk-size-6 { background: linear-gradient(45deg, #fd79a8, #e84393); width: 8.75rem; }
.disk-size-7 { background: linear-gradient(45deg, #00b894, #00a085); width: 10rem; }
.disk-size-8 { background: linear-gradient(45deg, #fdcb6e, #e17055); width: 11.25rem; }

.difficulty-selector {
  text-align: center;
  margin: 1.25rem 0;
  padding: 0.9375rem;
  background: #f8f9fa;
  border-radius: 0.5rem;
  border: 0.0625rem solid #dee2e6;
}

.difficulty-selector label {
  font-weight: bold;
  color: #495057;
  margin-right: 0.625rem;
}

/* 响应式设计 - 使用rem单位 */
@media (max-width: 48rem) {
  .towers-container {
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
  }
  
  .tower {
    width: 10rem;
    height: 12.5rem;
  }
  
  .tower-pole {
    height: 8.75rem;
  }
  
  .disk {
    height: 1.25rem;
    font-size: 0.625rem;
  }
  
  .disk-size-1 { width: 2rem; }
  .disk-size-2 { width: 3rem; }
  .disk-size-3 { width: 4rem; }
  .disk-size-4 { width: 5rem; }
  .disk-size-5 { width: 6rem; }
  .disk-size-6 { width: 7rem; }
  .disk-size-7 { width: 8rem; }
  .disk-size-8 { width: 9rem; }
}

@media (max-width: 30rem) {
  .tower {
    width: 8.75rem;
    height: 11.25rem;
  }
  
  .tower-pole {
    height: 7.5rem;
  }
  
  .disk {
    height: 1.125rem;
    font-size: 0.5625rem;
  }
  
  .disk-size-1 { width: 1.75rem; }
  .disk-size-2 { width: 2.625rem; }
  .disk-size-3 { width: 3.5rem; }
  .disk-size-4 { width: 4.375rem; }
  .disk-size-5 { width: 5.25rem; }
  .disk-size-6 { width: 6.125rem; }
  .disk-size-7 { width: 7rem; }
  .disk-size-8 { width: 7.875rem; }
}

/* 动画效果 */
@keyframes diskMove {
  0% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-0.625rem) scale(1.1); }
  100% { transform: translateY(0) scale(1); }
}

.disk.moving {
  animation: diskMove 0.3s ease-in-out;
}

/* 胜利动画 */
@keyframes victory {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.tower.completed {
  animation: victory 1s ease-in-out infinite;
}
</style>