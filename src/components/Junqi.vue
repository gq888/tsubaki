<template>
  <GameLayout
    :title="title"
    v-bind="gameLayoutProps"
    @undo="undo"
    @goon="goon"
    @step="stepFn"
    @auto="pass"
  >
    <template #game-content>
      <div class="junqi-container">
        <!-- 游戏状态显示 -->
        <div class="game-status">
          <div class="current-player">
            当前玩家: <span :class="currentPlayer === 1 ? 'player1' : 'player2'">{{ currentPlayerName }}</span>
          </div>
          <div class="game-phase">
            游戏阶段: {{ gamePhase === 'setup' ? '布阵' : '对战' }}
          </div>
        </div>

        <!-- 棋子选择面板（布阵阶段） -->
        <div v-if="gamePhase === 'setup'" class="piece-selection">
          <h3>选择棋子放置</h3>
          <div class="available-pieces">
            <div v-for="piece in availablePieces" :key="piece.type" class="piece-option">
              <span class="piece-name">{{ pieceNames[piece.type] }}</span>
              <span class="piece-count">剩余: {{ piece.count }}</span>
            </div>
          </div>
        </div>

        <!-- 军棋棋盘 -->
        <div class="board-container">
          <svg 
            class="junqi-board" 
            :width="cols * 60 + 40" 
            :height="rows * 60 + 40"
            viewBox="0 0 400 760"
          >
            <!-- 定义样式 -->
            <defs>
              <!-- 普通格子渐变 -->
              <linearGradient id="normalCell" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#f0f0f0;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#e0e0e0;stop-opacity:1" />
              </linearGradient>
              
              <!-- 行营格子渐变 -->
              <linearGradient id="campCell" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#fff3cd;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#ffeaa7;stop-opacity:1" />
              </linearGradient>
              
              <!-- 大本营格子渐变 -->
              <linearGradient id="baseCell" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#f8d7da;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#dc3545;stop-opacity:1" />
              </linearGradient>
              
              <!-- 铁路线格子渐变 -->
              <linearGradient id="railwayCell" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#d1ecf1;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#bee5eb;stop-opacity:1" />
              </linearGradient>
              
              <!-- 选中效果 -->
              <filter id="selectedGlow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge> 
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            <!-- 绘制棋盘背景 -->
            <rect x="0" y="0" width="400" height="760" fill="#8b4513" stroke="#654321" stroke-width="2" rx="10"/>
            
            <!-- 绘制棋盘格子 -->
            <g v-for="row in Array.from({length: rows}, (_, i) => i)" :key="row" class="board-row">
              <g v-for="col in Array.from({length: cols}, (_, i) => i)" :key="col" class="board-cell">
                <!-- 计算格子位置 -->
                <rect
                  :x="col * 60 + 20"
                  :y="row * 60 + 20"
                  width="50"
                  height="50"
                  :fill="getCellFill(row, col)"
                  :stroke="getCellStroke(row, col)"
                  stroke-width="2"
                  rx="5"
                  :filter="isSelected(row, col) ? 'url(#selectedGlow)' : ''"
                  class="cell-rect"
                  @click="clickCell(row, col)"
                />
                
                <!-- 铁路线标识 -->
                <g v-if="isRailwayCell(row, col)">
                  <line 
                    :x1="col * 60 + 25" 
                    :y1="row * 60 + 25" 
                    :x2="col * 60 + 65" 
                    :y2="row * 60 + 65" 
                    stroke="#0066cc" 
                    stroke-width="2" 
                    stroke-dasharray="5,5"
                  />
                  <line 
                    :x1="col * 60 + 65" 
                    :y1="row * 60 + 25" 
                    :x2="col * 60 + 25" 
                    :y2="row * 60 + 65" 
                    stroke="#0066cc" 
                    stroke-width="2" 
                    stroke-dasharray="5,5"
                  />
                </g>
                
                <!-- 行营标识 -->
                <g v-if="isCampCell(row, col)">
                  <circle 
                    :cx="col * 60 + 45" 
                    :cy="row * 60 + 45" 
                    r="15" 
                    fill="none" 
                    stroke="#ffc107" 
                    stroke-width="2"
                  />
                  <text 
                    :x="col * 60 + 45" 
                    :y="row * 60 + 50" 
                    text-anchor="middle" 
                    font-size="12" 
                    fill="#856404"
                    font-weight="bold"
                  >
                    营
                  </text>
                </g>
                
                <!-- 大本营标识 -->
                <g v-if="isBaseCell(row, col)">
                  <rect 
                    :x="col * 60 + 30" 
                    :y="row * 60 + 30" 
                    width="30" 
                    height="30" 
                    fill="none" 
                    stroke="#dc3545" 
                    stroke-width="2" 
                    rx="3"
                  />
                  <text 
                    :x="col * 60 + 45" 
                    :y="row * 60 + 50" 
                    text-anchor="middle" 
                    font-size="12" 
                    fill="#721c24"
                    font-weight="bold"
                  >
                    旗
                  </text>
                </g>
                
                <!-- 绘制棋子 -->
                <g v-if="board[row][col] !== 0" class="piece">
                  <circle
                    :cx="col * 60 + 45"
                    :cy="row * 60 + 45"
                    r="20"
                    :fill="getPieceFill(row, col)"
                    :stroke="getPieceStroke(row, col)"
                    stroke-width="2"
                    class="piece-circle"
                  />
                  <text
                    :x="col * 60 + 45"
                    :y="row * 60 + 50"
                    text-anchor="middle"
                    font-size="12"
                    :fill="getPieceTextColor(row, col)"
                    font-weight="bold"
                    class="piece-text"
                  >
                    {{ getPieceText(row, col) }}
                  </text>
                  <!-- 棋子未翻开时的背面显示 -->
                  <g v-if="board[row][col] && board[row][col] !== 0 && !board[row][col].revealed">
                    <circle
                      :cx="col * 60 + 45"
                      :cy="row * 60 + 45"
                      r="20"
                      fill="#666"
                      fill-opacity="0.8"
                      class="piece-back"
                    />
                    <text
                      :x="col * 60 + 45"
                      :y="row * 60 + 50"
                      text-anchor="middle"
                      font-size="10"
                      fill="white"
                      font-weight="bold"
                    >
                      ?
                    </text>
                  </g>
                </g>
              </g>
            </g>
            
            <!-- 棋盘边框装饰 -->
            <rect x="10" y="10" width="380" height="740" fill="none" stroke="#654321" stroke-width="3" rx="10"/>
          </svg>
        </div>

        <!-- 控制按钮 -->
        <div class="game-controls" v-if="gamePhase === 'setup'">
          <button @click="startGame" class="start-game-btn" :disabled="!canStartGame()">
            开始对战
          </button>
        </div>

        <!-- 游戏信息面板 -->
        <div class="game-info">
          <div class="step-info">
            步数: {{ step }}
          </div>
          <div class="history-info">
            历史记录: {{ gameManager ? gameManager.history.length : 0 }}
          </div>
        </div>
      </div>
    </template>
  </GameLayout>
</template>

<script>
import JunqiGame from "./Junqi.js";

export default {
  name: "Junqi",
  mixins: [JunqiGame],
  methods: {
    // 获取格子填充颜色
    getCellFill(row, col) {
      if (this.isCampCell(row, col)) return "url(#campCell)";
      if (this.isBaseCell(row, col)) return "url(#baseCell)";
      if (this.isRailwayCell(row, col)) return "url(#railwayCell)";
      return "url(#normalCell)";
    },

    // 获取格子边框颜色
    getCellStroke(row, col) {
      if (this.isCampCell(row, col)) return "#ffc107";
      if (this.isBaseCell(row, col)) return "#dc3545";
      if (this.isRailwayCell(row, col)) return "#17a2b8";
      return "#ccc";
    },

    // 检查是否为行营
    isCampCell(row, col) {
      return this.specialPositions.camps.some(pos => pos[0] === row && pos[1] === col);
    },

    // 检查是否为大本营
    isBaseCell(row, col) {
      return this.specialPositions.bases.some(pos => pos[0] === row && pos[1] === col);
    },

    // 检查是否为铁路线
    isRailwayCell(row, col) {
      return this.specialPositions.railways.some(railway => 
        railway.some(pos => pos[0] === row && pos[1] === col)
      );
    },

    // 检查是否选中
    isSelected(row, col) {
      return this.selectedPiece && this.selectedPiece.row === row && this.selectedPiece.col === col;
    },

    // 获取棋子填充颜色
    getPieceFill(row, col) {
      const piece = this.board[row][col];
      if (!piece || piece === 0) return "transparent";
      return piece.player === 1 ? "#007bff" : "#28a745";
    },

    // 获取棋子边框颜色
    getPieceStroke(row, col) {
      const piece = this.board[row][col];
      if (!piece || piece === 0) return "transparent";
      return piece.player === 1 ? "#0056b3" : "#1e7e34";
    },

    // 获取棋子文字颜色
    getPieceTextColor() {
      return "white";
    },

    // 获取棋子文字
    getPieceText(row, col) {
      const piece = this.board[row][col];
      if (!piece || piece === 0) return "";
      return this.pieceNames[piece.type].charAt(0);
    },

    // 检查是否可以开始游戏
    canStartGame() {
      // 简化检查：确保双方都有棋子
      let player1Pieces = 0;
      let player2Pieces = 0;
      
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          const piece = this.board[row][col];
          if (piece !== 0) {
            if (piece.player === 1) player1Pieces++;
            else if (piece.player === 2) player2Pieces++;
          }
        }
      }
      
      return player1Pieces > 0 && player2Pieces > 0;
    }
  }
};
</script>

<style scoped>
.junqi-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  color: white;
}

.game-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px 25px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  width: 100%;
  max-width: 600px;
}

.current-player .player1 {
  color: #007bff;
  font-weight: bold;
}

.current-player .player2 {
  color: #28a745;
  font-weight: bold;
}

.game-phase {
  font-size: 14px;
  opacity: 0.8;
}

.piece-selection {
  margin-bottom: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  width: 100%;
  max-width: 600px;
}

.piece-selection h3 {
  margin-bottom: 15px;
  text-align: center;
}

.available-pieces {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.piece-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.piece-option:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.piece-name {
  font-weight: bold;
}

.piece-count {
  font-size: 12px;
  opacity: 0.8;
}

.board-container {
  margin-bottom: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.junqi-board {
  display: block;
  margin: 0 auto;
  cursor: pointer;
}

.cell-rect {
  transition: all 0.2s ease;
}

.cell-rect:hover {
  stroke-width: 3;
  filter: brightness(1.1);
}

.piece-circle {
  transition: all 0.3s ease;
}

.piece-circle:hover {
  transform: scale(1.1);
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.6));
}

.piece-text {
  pointer-events: none;
  user-select: none;
}

.game-controls {
  text-align: center;
  margin-bottom: 20px;
}

.start-game-btn {
  padding: 12px 30px;
  font-size: 16px;
  font-weight: bold;
  color: white;
  background: linear-gradient(45deg, #28a745, #20c997);
  border: none;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
}

.start-game-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
}

.start-game-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #6c757d;
}

.game-info {
  display: flex;
  justify-content: space-around;
  padding: 15px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  width: 100%;
  max-width: 400px;
  font-size: 14px;
}

.step-info, .history-info {
  text-align: center;
}

@media (max-width: 768px) {
  .junqi-container {
    padding: 10px;
  }
  
  .game-status {
    flex-direction: column;
    gap: 10px;
  }
  
  .available-pieces {
    grid-template-columns: 1fr;
  }
  
  .board-container {
    padding: 10px;
    overflow-x: auto;
  }
  
  .junqi-board {
    min-width: 600px;
  }
}

@media (max-width: 480px) {
  .piece-selection h3 {
    font-size: 16px;
  }
  
  .start-game-btn {
    padding: 10px 20px;
    font-size: 14px;
  }
  
  .game-info {
    flex-direction: column;
    gap: 10px;
  }
}
</style>