<template>
  <div class="TowerHanoi">
    <h1>{{ title }}</h1>
    
    <GameControls
      v-bind="gameControlsConfig"
      @undo="undo"
      @goon="goon"
      @step="stepFn"
      @auto="pass"
    />
    
    <div class="game-info">
      <div class="info-row">
        <span>步数: {{ step }}</span>
        <span>移动次数: {{ moveCount }}</span>
        <span>最优解: {{ minMoves }} 步</span>
      </div>
      <div class="info-row">
        <span>完成度: {{ completionPercentage }}%</span>
        <span>效率: {{ efficiencyScore }}%</span>
      </div>
    </div>
    
    <div class="game-area">
      <div class="towers-container">
        <div 
          v-for="(tower, towerIndex) in towers" 
          :key="towerIndex"
          class="tower"
          :class="{ selected: selectedTower === towerIndex }"
          @click="clickTower(towerIndex)"
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
      
      <div class="game-status" v-if="selectedTower >= 0">
        <p>已选中: {{ getTowerName(selectedTower) }}</p>
        <p>点击目标柱子移动圆盘</p>
      </div>
    </div>
    
    <div class="difficulty-selector">
      <label>圆盘数量: </label>
      <select v-model="diskCount" @change="resetGame">
        <option value="3">3个圆盘</option>
        <option value="4">4个圆盘</option>
        <option value="5">5个圆盘</option>
        <option value="6">6个圆盘</option>
        <option value="7">7个圆盘</option>
        <option value="8">8个圆盘</option>
      </select>
    </div>
    
    <GameResultModal
      v-if="winflag"
      title="恭喜！游戏胜利！"
      :subtitle="`用了 ${moveCount} 步，效率 ${efficiencyScore}%`"
      :buttons="[{
        text: '再来一局',
        callback: goon,
        disabled: false
      }]"
    />
    
    <GameResultModal
      v-if="loseflag"
      title="游戏结束"
      subtitle="没有有效的移动了"
      :buttons="[{
        text: '重新开始',
        callback: goon,
        disabled: false
      }]"
    />
  </div>
</template>

<script>
import TowerHanoi from "./TowerHanoi.js";
import { GameComponentPresets } from "../utils/gameComponentFactory.js";

// 使用工厂函数创建增强的TowerHanoi组件
export default GameComponentPresets.puzzleGame(TowerHanoi, 800);
</script>

<style scoped>
.TowerHanoi {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.game-info {
  margin: 20px 0;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
  border: 1px solid #ddd;
}

.info-row {
  display: flex;
  justify-content: space-around;
  margin: 10px 0;
  font-size: 14px;
  color: #333;
}

.info-row span {
  padding: 5px 10px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.game-area {
  margin: 30px 0;
  padding: 20px;
  background: #fafafa;
  border-radius: 10px;
  border: 2px solid #e0e0e0;
}

.towers-container {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  min-height: 300px;
  padding: 20px 0;
}

.tower {
  position: relative;
  width: 180px;
  height: 280px;
  margin: 0 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
  background: linear-gradient(to bottom, #f8f8f8, #e8e8e8);
  border: 2px solid #ccc;
}

.tower:hover {
  background: linear-gradient(to bottom, #f0f0f0, #e0e0e0);
  border-color: #999;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.tower.selected {
  background: linear-gradient(to bottom, #e3f2fd, #bbdefb);
  border-color: #2196f3;
  box-shadow: 0 6px 20px rgba(33, 150, 243, 0.3);
  transform: translateY(-4px);
}

.tower-label {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  font-weight: bold;
  color: #333;
  font-size: 16px;
  background: rgba(255,255,255,0.9);
  padding: 5px 10px;
  border-radius: 15px;
  border: 1px solid #ddd;
}

.tower-base {
  position: absolute;
  bottom: 0;
  left: 10px;
  right: 10px;
  height: 8px;
  background: linear-gradient(to right, #8d6e63, #6d4c41);
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.tower-pole {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 220px;
  background: linear-gradient(to top, #8d6e63, #6d4c41);
  border-radius: 3px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.disks-container {
  position: absolute;
  bottom: 8px;
  left: 10px;
  right: 10px;
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  gap: 2px;
}

.disk {
  height: 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 12px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  transition: all 0.2s ease;
  border: 2px solid rgba(255,255,255,0.3);
}

.disk:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
}

/* 不同大小的圆盘颜色 */
.disk-size-1 { background: linear-gradient(45deg, #ff6b6b, #ee5a52); width: 40px; }
.disk-size-2 { background: linear-gradient(45deg, #4ecdc4, #44a08d); width: 60px; }
.disk-size-3 { background: linear-gradient(45deg, #45b7d1, #3498db); width: 80px; }
.disk-size-4 { background: linear-gradient(45deg, #f9ca24, #f0932b); width: 100px; }
.disk-size-5 { background: linear-gradient(45deg, #6c5ce7, #5f3dc4); width: 120px; }
.disk-size-6 { background: linear-gradient(45deg, #fd79a8, #e84393); width: 140px; }
.disk-size-7 { background: linear-gradient(45deg, #00b894, #00a085); width: 160px; }
.disk-size-8 { background: linear-gradient(45deg, #fdcb6e, #e17055); width: 180px; }

.game-status {
  text-align: center;
  margin-top: 20px;
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
  font-weight: bold;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
}

.difficulty-selector {
  text-align: center;
  margin: 20px 0;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.difficulty-selector label {
  font-weight: bold;
  color: #495057;
  margin-right: 10px;
}

.difficulty-selector select {
  padding: 8px 12px;
  border: 2px solid #6c757d;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  font-weight: bold;
  color: #495057;
  cursor: pointer;
  transition: all 0.2s ease;
}

.difficulty-selector select:hover {
  border-color: #495057;
  box-shadow: 0 2px 8px rgba(108, 117, 125, 0.2);
}

.difficulty-selector select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.25);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .towers-container {
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }
  
  .tower {
    width: 160px;
    height: 200px;
  }
  
  .tower-pole {
    height: 140px;
  }
  
  .disk {
    height: 20px;
    font-size: 10px;
  }
  
  .info-row {
    flex-direction: column;
    gap: 10px;
  }
}

/* 动画效果 */
@keyframes diskMove {
  0% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-10px) scale(1.1); }
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