import { GameComponentPresets } from "../utils/gameComponentFactory.js";

/**
 * Junqi（军棋）对象定义了军棋游戏的基础组件
 * 工厂函数会为该组件添加游戏管理、按钮控制、自动操作等功能
 */

const Junqi = {
  name: "Junqi",
  data() {
    return {
      title: "军棋",
      // 棋盘状态：0=空，1=甲方棋子，2=乙方棋子
      board: [],
      // 棋子类型：0=工兵，1=排长，2=连长，3=营长，4=团长，5=旅长，6=师长，7=军长，8=司令，9=炸弹，10=地雷，11=军旗
      pieces: {
        甲方: [
          { type: 11, count: 1 }, // 军旗
          { type: 8, count: 1 },  // 司令
          { type: 7, count: 1 },  // 军长
          { type: 6, count: 2 },  // 师长
          { type: 5, count: 2 },  // 旅长
          { type: 4, count: 2 },  // 团长
          { type: 3, count: 2 },  // 营长
          { type: 2, count: 3 },  // 连长
          { type: 1, count: 3 },  // 排长
          { type: 0, count: 3 },  // 工兵
          { type: 9, count: 2 },  // 炸弹
          { type: 10, count: 3 }, // 地雷
        ],
        乙方: [
          { type: 11, count: 1 }, // 军旗
          { type: 8, count: 1 },  // 司令
          { type: 7, count: 1 },  // 军长
          { type: 6, count: 2 },  // 师长
          { type: 5, count: 2 },  // 旅长
          { type: 4, count: 2 },  // 团长
          { type: 3, count: 2 },  // 营长
          { type: 2, count: 3 },  // 连长
          { type: 1, count: 3 },  // 排长
          { type: 0, count: 3 },  // 工兵
          { type: 9, count: 2 },  // 炸弹
          { type: 10, count: 3 }, // 地雷
        ]
      },
      // 当前玩家：1=甲方，2=乙方
      currentPlayer: 1,
      // 选中的棋子位置
      selectedPiece: null,
      // 游戏阶段：setup=布阵，playing=对战
      gamePhase: 'setup',
      // 棋盘尺寸：12行x5列
      rows: 12,
      cols: 5,
      // 特殊位置定义
      specialPositions: {
        // 行营位置（棋子进入后不能被攻击）
        camps: [[2,1], [2,3], [3, 2], [4,1], [4,3], [7,1], [7,3], [8, 2], [9,1], [9,3]],
        // 大本营位置（军旗必须放在这里）
        bases: [[11,1], [11,3], [0,1], [0,3]],
        // 铁路线位置（工兵可沿铁路线任意移动）
        railways: [
          // 横向铁路线
          [[1,0], [1,1], [1,2], [1,3], [1,4]],
          [[5,0], [5,1], [5,2], [5,3], [5,4]],
          [[6,0], [6,1], [6,2], [6,3], [6,4]],
          [[10,0], [10,1], [10,2], [10,3], [10,4]],
          // 纵向铁路线
          [[2,0], [3,0], [4,0]],
          [[2,2], [3,2], [4,2]],
          [[2,4], [3,4], [4,4]],
          [[7,0], [8,0], [9,0]],
          [[7,2], [8,2], [9,2]],
          [[7,4], [8,4], [9,4]]
        ]
      }
    };
  },
  computed: {
    // 获取棋子显示名称
    pieceNames() {
      return ['工兵', '排长', '连长', '营长', '团长', '旅长', '师长', '军长', '司令', '炸弹', '地雷', '军旗'];
    },
    // 获取当前玩家名称
    currentPlayerName() {
      return this.currentPlayer === 1 ? '甲方' : '乙方';
    },
    // 检查是否可以布阵
    canSetup() {
      return this.gamePhase === 'setup';
    },
    // 检查是否可以移动
    canMove() {
      return this.gamePhase === 'playing' && !this.selectedPiece;
    },
    // 获取可用棋子
    availablePieces() {
      const player = this.currentPlayerName;
      return this.pieces[player].filter(piece => piece.count > 0);
    }
  },
  methods: {
    // 初始化游戏
    init() {
      this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(0));
      this.currentPlayer = 1;
      this.selectedPiece = null;
      this.gamePhase = 'setup';
      
      // 重置棋子数量
      Object.keys(this.pieces).forEach(player => {
        this.pieces[player].forEach(piece => {
          switch(piece.type) {
            case 11: piece.count = 1; break; // 军旗
            case 8: case 7: piece.count = 1; break; // 司令、军长
            case 6: case 5: case 4: case 3: piece.count = 2; break; // 师、旅、团、营长
            case 2: case 1: case 0: piece.count = 3; break; // 连、排、工兵
            case 9: piece.count = 2; break; // 炸弹
            case 10: piece.count = 3; break; // 地雷
          }
        });
      });
    },

    // 检查是否可以开始游戏
    canStartGame() {
      // 简化检查：确保双方都有棋子
      let player1Pieces = 0;
      
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          const piece = this.board[row][col];
          if (piece !== 0) {
            if (piece.player === 1) player1Pieces++;
          }
        }
      }
      
      return player1Pieces >= 25;
    },

    // 随机摆放指定玩家的棋子
    randomPlacePlayerPieces(player) {
      const playerName = player === 1 ? '甲方' : '乙方';
      const playerPieces = this.pieces[playerName];
      
      // 获取该玩家的可放置区域
      const availablePositions = [];
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          // 检查是否在玩家区域内且位置为空
          const isPlayerArea = player === 1 ? row >= 6 : row <= 5;
          if (isPlayerArea && this.board[row][col] === 0) {
            availablePositions.push({ row, col });
          }
        }
      }
      
      // 打乱位置顺序
      this.shuffleArray(availablePositions);
      
      let positionIndex = 0;
      
      // 按棋子类型顺序放置（先放军旗，然后按等级从高到低）
      const placeOrder = [11, 8, 7, 6, 5, 4, 3, 2, 1, 0, 9, 10]; // 军旗、司令、军长、师长...
      
      for (const pieceType of placeOrder) {
        const pieceConfig = playerPieces.find(p => p.type === pieceType);
        if (!pieceConfig || pieceConfig.count <= 0) continue;
        
        // 放置该类型的所有棋子
        for (let i = 0; i < pieceConfig.count && positionIndex < availablePositions.length; i++) {
          const pos = availablePositions[positionIndex++];
          this.board[pos.row][pos.col] = {
            player: player,
            type: pieceType,
            revealed: false
          };
          
          console.log(`随机放置了 ${playerName} 的 ${this.pieceNames[pieceType]} 在 (${pos.row}, ${pos.col})`);
        }
        
        // 更新棋子数量（已放置的棋子数量设为0）
        pieceConfig.count = Math.max(0, pieceConfig.count - (positionIndex > 0 ? 
          availablePositions.slice(0, positionIndex).filter(pos => 
            this.board[pos.row][pos.col].type === pieceType
          ).length : 0));
      }
      
      console.log(`已为 ${playerName} 随机摆放棋子，使用了 ${positionIndex} 个位置`);
    },

    // 打乱数组顺序（Fisher-Yates算法）
    shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    },

    // 点击棋盘格子
    clickCell(row, col) {
      console.log(`点击了格子: ${row}, ${col}`);
      if (this.gamePhase === 'setup') {
        this.handleSetupClick(row, col);
      } else if (this.gamePhase === 'playing') {
        this.handlePlayClick(row, col);
      }
    },

    // 处理布阵阶段的点击
    handleSetupClick(row, col) {
      const cellPlayer = this.getCellPlayer(row, col);
      
      // 如果点击的是自己的棋子，选中它
      if (cellPlayer === this.currentPlayer) {
        this.selectedPiece = { row, col };
        return;
      }
      
      // 如果点击空位置且有可用棋子，选择棋子类型并放置
      if (cellPlayer === 0 && this.availablePieces.length > 0) {
        // 选择第一个可用棋子类型（简化处理）
        const selectedPieceType = this.availablePieces[0].type;
        if (this.canPlacePiece(row, col)) {
          this.placePiece(row, col, selectedPieceType);
        }
      }
      
      // 如果已经选中了棋子，尝试放置
      if (this.selectedPiece) {
        if (this.canPlacePiece(row, col)) {
          this.placePiece(row, col);
        }
        this.selectedPiece = null;
      }
    },

    // 处理对战阶段的点击
    handlePlayClick(row, col) {
      const cellPlayer = this.getCellPlayer(row, col);
      
      // 如果点击的是自己的棋子，选中它
      if (cellPlayer === this.currentPlayer) {
        this.selectedPiece = { row, col };
        return;
      }
      
      // 如果已经选中了棋子，尝试移动或攻击
      if (this.selectedPiece) {
        if (this.canMovePiece(this.selectedPiece.row, this.selectedPiece.col, row, col)) {
          this.movePiece(this.selectedPiece.row, this.selectedPiece.col, row, col);
        }
        this.selectedPiece = null;
      }
    },

    // 获取格子所属玩家
    getCellPlayer(row, col) {
      const piece = this.board[row][col];
      if (!piece) return 0;
      return piece.player;
    },

    // 检查是否可以放置棋子
    canPlacePiece(row, col) {
      // 检查是否在己方区域
      const isPlayerArea = this.currentPlayer === 1 ? row >= 6 : row <= 5;
      if (!isPlayerArea) return false;
      
      // 检查位置是否为空
      if (this.board[row][col] !== 0) return false;
      
      return true;
    },

    // 放置棋子
    placePiece(row, col, pieceType = null) {
      // 如果没有指定棋子类型，使用默认工兵
      if (pieceType === null) {
        pieceType = 0; // 默认放置工兵
      }
      
      // 检查是否还有该类型的棋子可用
      const playerPieces = this.pieces[this.currentPlayerName];
      const pieceConfig = playerPieces.find(p => p.type === pieceType);
      if (!pieceConfig || pieceConfig.count <= 0) {
        console.log(`玩家 ${this.currentPlayerName} 没有可用的 ${this.pieceNames[pieceType]} 棋子`);
        return;
      }
      
      // 放置棋子
      this.board[row][col] = {
        player: this.currentPlayer,
        type: pieceType,
        revealed: false // 棋子未翻开
      };
      
      // 减少可用棋子数量
      pieceConfig.count--;
      
      this.recordOperation({
        type: 'place',
        row: row,
        col: col,
        player: this.currentPlayer,
        pieceType: pieceType
      });
      
      console.log(`在 (${row}, ${col}) 放置了 ${this.currentPlayerName} 的 ${this.pieceNames[pieceType]}`);
    },

    // 检查是否可以移动棋子
    canMovePiece(fromRow, fromCol, toRow, toCol) {
      const piece = this.board[fromRow][fromCol];
      if (!piece || piece.player !== this.currentPlayer) return false;
      
      // 检查目标位置是否为空或敌方棋子
      const targetPiece = this.board[toRow][toCol];
      if (targetPiece && targetPiece.player === this.currentPlayer) return false;
      
      // 检查移动规则
      return this.isValidMove(fromRow, fromCol, toRow, toCol, piece);
    },

    // 检查移动是否有效
    isValidMove(fromRow, fromCol, toRow, toCol, piece) {
      const rowDiff = Math.abs(toRow - fromRow);
      const colDiff = Math.abs(toCol - fromCol);
      
      // 工兵可以沿铁路线任意移动
      if (piece.type === 0 && this.isRailwayMove(fromRow, fromCol, toRow, toCol)) {
        return true;
      }
      
      // 普通棋子只能移动一格
      return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    },

    // 检查是否沿铁路线移动
    isRailwayMove(fromRow, fromCol, toRow, toCol) {
      // 简化实现：检查起点和终点是否在同一条铁路线上
      for (const railway of this.specialPositions.railways) {
        const hasFrom = railway.some(pos => pos[0] === fromRow && pos[1] === fromCol);
        const hasTo = railway.some(pos => pos[0] === toRow && pos[1] === toCol);
        if (hasFrom && hasTo) return true;
      }
      return false;
    },

    // 移动棋子
    movePiece(fromRow, fromCol, toRow, toCol) {
      const movingPiece = this.board[fromRow][fromCol];
      const targetPiece = this.board[toRow][toCol];
      
      if (targetPiece) {
        // 攻击敌方棋子
        this.attackPiece(movingPiece, targetPiece, fromRow, fromCol, toRow, toCol);
      } else {
        // 普通移动
        this.board[toRow][toCol] = movingPiece;
        this.board[fromRow][fromCol] = 0;
        
        this.recordOperation({
          type: 'move',
          fromRow: fromRow,
          fromCol: fromCol,
          toRow: toRow,
          toCol: toCol,
          piece: movingPiece
        });
      }
      
      // 切换玩家
      this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    },

    // 攻击棋子
    attackPiece(attacker, defender, fromRow, fromCol, toRow, toCol) {
      let result = this.calculateBattleResult(attacker.type, defender.type);
      
      if (result === 'attacker_wins') {
        this.board[toRow][toCol] = attacker;
        this.board[fromRow][fromCol] = 0;
      } else if (result === 'defender_wins') {
        this.board[fromRow][fromCol] = 0;
      } else {
        // 同归于尽
        this.board[fromRow][fromCol] = 0;
        this.board[toRow][toCol] = 0;
      }
      
      this.recordOperation({
        type: 'attack',
        fromRow: fromRow,
        fromCol: fromCol,
        toRow: toRow,
        toCol: toCol,
        attacker: attacker,
        defender: defender,
        result: result
      });
      
      // 检查游戏结束条件
      this.checkGameEnd();
    },

    // 计算战斗结果
    calculateBattleResult(attackerType, defenderType) {
      // 军旗被攻击则攻击方获胜
      if (defenderType === 11) return 'attacker_wins';
      
      // 地雷特殊规则
      if (defenderType === 10) {
        return attackerType === 0 ? 'attacker_wins' : 'defender_wins'; // 只有工兵能排雷
      }
      
      // 炸弹同归于尽
      if (attackerType === 9 || defenderType === 9) return 'both_die';
      
      // 普通战斗比较等级
      if (attackerType > defenderType) return 'attacker_wins';
      if (attackerType < defenderType) return 'defender_wins';
      return 'both_die'; // 同级同归于尽
    },

    // 检查游戏结束
    checkGameEnd() {
      // 检查军旗是否被夺
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          const piece = this.board[row][col];
          if (piece && piece.type === 11) {
            // 军旗还存在
            return;
          }
        }
      }
      
      // 军旗被夺，游戏结束
      this.gameManager.setWin();
    },

    // 开始游戏（从布阵阶段进入对战阶段）
    startGame() {
      this.gamePhase = 'playing';
      this.selectedPiece = null;
      
      // 随机摆放乙方棋子（玩家2）
      this.randomPlacePlayerPieces(2);
    },

    // 重新开始
    goon() {
      this.init();
    },

    // 自动模式
    async stepFn() {
      if (this.gamePhase == "setup") {
        this.randomPlacePlayerPieces(1);
        this.startGame();
        return;
      }

      // 获取可用移动
      const availableMoves = this.getAvailableMoves();
      if (availableMoves.length > 0) {
        const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
        
        // 先选中源棋子，然后移动到目标位置
        this.selectedPiece = { row: randomMove.fromRow, col: randomMove.fromCol };
        this.clickCell(randomMove.toRow, randomMove.toCol);
      } else {
        console.log("没有可用的移动，游戏可能陷入死锁");
      }
    },

    // 获取可用移动
    getAvailableMoves() {
      const moves = [];
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          const piece = this.board[row][col];
          if (piece && piece.player === this.currentPlayer) {
            // 检查周围的移动
            const directions = [[-1,0], [1,0], [0,-1], [0,1]];
            for (const [dr, dc] of directions) {
              const newRow = row + dr;
              const newCol = col + dc;
              if (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
                if (this.canMovePiece(row, col, newRow, newCol)) {
                  moves.push({ fromRow: row, fromCol: col, toRow: newRow, toCol: newCol });
                }
              }
            }
          }
        }
      }
      return moves;
    },

    // 渲染文本视图（用于测试）
    renderTextView() {
      let result = `军棋棋盘 (${this.rows}x${this.cols})\n`;
      result += `当前玩家: ${this.currentPlayerName} (${this.currentPlayer})\n`;
      result += `游戏阶段: ${this.gamePhase === 'setup' ? '布阵' : '对战'}\n`;
      result += `步数: ${this.step}\n\n`;
      
      // 显示棋盘
      result += "棋盘状态:\n";
      for (let row = 0; row < this.rows; row++) {
        let rowStr = "";
        for (let col = 0; col < this.cols; col++) {
          const piece = this.board[row][col];
          if (piece === 0) {
            rowStr += ". ";
          } else {
            const player = piece.player === 1 ? "A" : "B"; // A=甲方, B=乙方
            const type = this.pieceNames[piece.type].charAt(0);
            rowStr += `${player}${type} `;
          }
        }
        result += `${row.toString().padStart(2)}: ${rowStr}\n`;
      }
      
      result += "\n特殊位置:\n";
      result += "行营: " + this.specialPositions.camps.map(pos => `(${pos[0]},${pos[1]})`).join(", ") + "\n";
      result += "大本营: " + this.specialPositions.bases.map(pos => `(${pos[0]},${pos[1]})`).join(", ") + "\n";
      
      console.log(result);
      return result;
    },

    // 记录操作
    recordOperation(operation) {
      this.gameManager.recordOperation(operation);
    },

    // 撤销操作
    handleUndo(operation) {
      switch (operation.type) {
        case 'place':
          this.board[operation.row][operation.col] = 0;
          break;
        case 'move':
          this.board[operation.fromRow][operation.fromCol] = operation.piece;
          this.board[operation.toRow][operation.toCol] = 0;
          break;
        case 'attack':
          // 恢复战斗前的状态
          if (operation.result === 'attacker_wins') {
            this.board[operation.fromRow][operation.fromCol] = operation.attacker;
            this.board[operation.toRow][operation.toCol] = operation.defender;
          } else if (operation.result === 'defender_wins') {
            this.board[operation.fromRow][operation.fromCol] = operation.attacker;
            this.board[operation.toRow][operation.toCol] = operation.defender;
          } else {
            // 同归于尽
            this.board[operation.fromRow][operation.fromCol] = operation.attacker;
            this.board[operation.toRow][operation.toCol] = operation.defender;
          }
          break;
      }
    }
  },
  
  // 初始化时创建游戏
//   created() {
//     this.init();
//   }
};

// 使用工厂函数创建增强的游戏组件
export default GameComponentPresets.strategyGame(Junqi);