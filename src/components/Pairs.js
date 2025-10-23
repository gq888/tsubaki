import { shuffleCards } from "../utils/help.js";
import { GameComponentPresets } from "../utils/gameComponentFactory.js";
import { getCardPlaceholderText } from "../utils/cardUtils.js";

const Pairs = {
  name: "Pairs",
  data() {
    return {
      title: "Pairs",
      // 存储牌的位置映射
      cardPositions: [],
      // 标记牌是否已配对
      matchedCards: [],
      // 标记牌是否已被查看过
      seenCards: [],
      // 当前选中的第一张牌索引
      selectedCard: -1,
      // 当前选中的第二张牌索引
      secondSelectedCard: -2,
      // 游戏时间（秒）
      time: 0,
      // 计时器引用
      _timer: 0,
      // 牌的总数
      totalCards: 48,
      // 未使用的变量
      n: 0,
    };
  },
  methods: {
    /**
     * 初始化游戏状态
     */
    init() {
      // 重置游戏计时器
      this.time = 0;
      clearInterval(this._timer);
      this._timer = 0;
      
      // 重置选中状态
      this.selectedCard = -1;
      this.secondSelectedCard = -1;
      
      // 清空数组
      this.cardPositions.splice(0);
      this.seenCards.splice(0);
      this.matchedCards.splice(0);
      
      // 创建牌并打乱顺序
      const cardPositions = this.cardPositions;
      for (let i = 0; i < this.totalCards; i++) {
        cardPositions.push(i);
        this.matchedCards.push(false);
      }
      
      shuffleCards(cardPositions, this.totalCards);
    },
    /**
     * 处理卡片点击事件
     * @param {number} [rowOrPositionIndex] - 行号(当第二个参数存在时)或位置索引
     * @param {number} [col] - 列号(可选)
     */
    async clickCard(rowOrPositionIndex, col) {
      let positionIndex;
      let cardId;
      
      // 处理不同参数情况
      if (rowOrPositionIndex === undefined) {
        // 不传参数时，选择一张未查看过的牌
        let found = false;
        
        // 遍历所有位置查找未查看过的牌
        for (positionIndex = 0; positionIndex < this.totalCards; positionIndex++) {
          cardId = this.cardPositions[positionIndex];
          if (!this.seenCards[cardId] && !this.matchedCards[cardId]) {
            found = true;
            break;
          }
        }
        
        // 如果所有牌都被看过，重置seen数组
        if (!found) {
          // 清空seen数组
          this.seenCards.splice(0);
          // 再次查找第一张未配对的牌
          for (positionIndex = 0; positionIndex < this.totalCards; positionIndex++) {
            cardId = this.cardPositions[positionIndex];
            if (!this.matchedCards[cardId]) {
              break;
            }
          }
        }
      } else if (col !== undefined) {
        // 传入两个参数时，视为行号和列号
        // 假设6行8列的布局
        const gridColumns = 8;
        positionIndex = rowOrPositionIndex * gridColumns + col;
        cardId = this.cardPositions[positionIndex];
      } else {
        // 传入一个参数时，视为位置索引
        positionIndex = rowOrPositionIndex;
        cardId = this.cardPositions[positionIndex];
      }
      
      // 启动游戏计时器（首次点击时）
      if (!this._timer) {
        this._timer = setInterval(() => {
          this.time++;
        }, 1000);
      }
      
      // 忽略已经选中的牌或已经配对的牌
      if (this.selectedCard === cardId || this.matchedCards[cardId]) {
        return;
      }
      
      // 标记牌为已查看
      this.seenCards[cardId] = true;
      
      // 记录操作
      this.gameManager.recordOperation();
      
      // 如果还没有选中第一张牌，将当前牌设为第一张
      if (this.selectedCard < 0) {
        this.selectedCard = cardId;
        return;
      }
      
      // 检查两张牌是否匹配（使用位运算判断是否属于同一组）
      const isMatched = (this.selectedCard >> 2) === (cardId >> 2);
      
      if (isMatched) {
        // 匹配成功，标记两张牌为已配对
        this.matchedCards.splice(cardId, 1, true);
        this.matchedCards.splice(this.selectedCard, 1, true);
        this.selectedCard = -1;
      }
      
      // 记录第二张选中的牌
      this.gameManager.hitflag = false;
      this.secondSelectedCard = cardId;
      
      // 等待一段时间让用户看到第二张牌
      await this.wait();
      
      // 重置选中状态
      this.selectedCard = -1;
      this.secondSelectedCard = -1;
      this.gameManager.hitflag = true;

      // 检查游戏是否结束
      const isGameOver = this.checkGameCompletion();

      if (isGameOver) {
        this.gameManager.setWin();
        clearInterval(this._timer);
        this._timer = 0;
      }
    },
    
    /**
     * 检查游戏是否完成
     * @returns {boolean} - 如果所有牌都已配对，返回true
     */
    checkGameCompletion() {
      for (let i = 0; i < this.totalCards; i++) {
        if (!this.matchedCards[i]) {
          return false;
        }
      }
      return true;
    },
    /**
     * 自动执行游戏步骤（AI模式）
     */
    async stepFn() {
      // 如果已经选中了第一张牌，尝试找出匹配的牌
      if (this.selectedCard >= 0) {
        // 查找同一组中的其他牌
        const groupStartIndex = this.selectedCard - (this.selectedCard % 4);
        for (let i = 0; i < 4; i++) {
          const targetCardId = groupStartIndex + i;
          // 跳过当前已选中的牌，选择已查看但未配对的牌
          if (targetCardId !== this.selectedCard && 
              this.seenCards[targetCardId] && 
              !this.matchedCards[targetCardId]) {
            // 找到对应牌ID的位置索引
            const positionIndex = this.cardPositions.indexOf(targetCardId);
            if (positionIndex !== -1) {
              return await this.clickCard(positionIndex);
            }
          }
        }
      } else {
        // 没有选中牌时，尝试找出已查看过的多张相同组的牌
        let seenInGroupCount;
        for (let i = 0; i < this.totalCards; i++) {
          // 每组牌开始时重置计数器
          if (i % 4 === 0) {
            seenInGroupCount = 0;
          }
          
          if (this.seenCards[i] && !this.matchedCards[i]) {
            seenInGroupCount++;
          }
          
          // 如果在同一组中看到多张未配对的牌，选择当前牌
          if (seenInGroupCount > 1) {
            // 找到对应牌ID的位置索引
            const positionIndex = this.cardPositions.indexOf(i);
            if (positionIndex !== -1) {
              return await this.clickCard(positionIndex);
            }
          }
        }
      }
      
      // 如果没有明确的匹配策略，调用不带参数的clickCard函数
      // 它会自动选择未查看过的牌，或在所有牌都看过时重置seen数组
      return await this.clickCard();
    },
    
    /**
     * 渲染文本视图 - 显示当前游戏状态
     * 用于终端交互式游戏
     */
    renderTextView() {
      // 打印游戏标题
      console.log('\n╔════════════════════════════════════════════════╗');
      console.log('║              配对游戏 (Pairs)                 ║');
      console.log('╚════════════════════════════════════════════════╝');
      
      // 显示统计信息
      const matchedCount = this.matchedCards.filter(m => m).length;
      console.log(`\n时间: ${this.time}秒 | 已配对: ${matchedCount}/${this.totalCards} 张\n`);
      
      // 显示图例
      console.log('\n图例:');
      console.log('  [?] = 未翻开  [✓] = 已看过  > = 第一张  * = 第二张');
      
      // 显示当前选中的牌
      if (this.selectedCard >= 0) {
        console.log(`\n当前选中: ${getCardPlaceholderText(this.selectedCard)} (需要配对)`);
      } else {
        console.log('\n');
      }
      
      // 按6x8网格显示 - 与Vue模板保持一致
      const gridColumns = 8;
      const gridRows = 6;
      
      for (let row = 0; row < gridRows; row++) {
        let line = '  ';
        for (let col = 0; col < gridColumns; col++) {
          const gridPosition = row * gridColumns + col;
          const cardId = this.cardPositions[gridPosition]; // 获取该位置的牌ID
          
          // 检查这张牌是否被翻开或选中
          const isFlipped = this.matchedCards[cardId] || 
                           cardId === this.selectedCard || 
                           cardId === this.secondSelectedCard;
          const isSeen = this.seenCards[cardId];
          
          if (isFlipped) {
            // 已翻开或当前选中
            const cardText = getCardPlaceholderText(cardId);
            const prefix = cardId === this.selectedCard ? '>' : 
                          (cardId === this.secondSelectedCard ? '*' : '');
            line += `${(prefix + cardText).padEnd(3)} `;
          } else if (isSeen) {
            line += '[✓] ';
          } else {
            // 未翻开
            line += '[?] ';
          }
        }
        console.log(line);
      }
      
      return '渲染完成';
    },
    
    /**
     * 获取当前可用的操作列表
     * 用于终端交互式游戏
     * 使用工厂函数中统一实现的方法
     */
  },
};

// 使用工厂函数创建增强的Pairs组件并导出
export default GameComponentPresets.pairGame(Pairs, 500);
