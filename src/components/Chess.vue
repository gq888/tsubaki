<template>
  <div class="Sum" style="width:100%;">
  <h1>{{ title }}</h1>
<GameControls
  :undoDisabled="undoDisabled"
  :restartDisabled="restartDisabled"
  :stepDisabled="stepDisabled"
  :autoDisabled="autoDisabled"
  @undo="undo"
  @goon="goon"
  @step="stepTwiceFn"
  @auto="pass"
/>
  <div class="row center">
    <div>
      <div class="cardsul center"
       style="padding-left: 0; margin: 0; width: 100%; max-width: 600px; background-color: #719192; padding: 5px 0;">
        <div v-for="(item, i) in cards1" :key='i' class="m-0 center"
         style="width: 16%; border-radius: 50%; overflow: hidden;"
         @click="hitflag && lockflag && clickCard(i)">
          <div class="center" style="width: 100%; position: relative;"
           :style="{backgroundColor: item < 0 ? 'transparent' : !cards2[item] ? '#fff' : item == sign ? '#FFB800' : grades[item] == grade ? '#01AAED' : '#5FB878'}">
            <div class="shanshuo abso" v-show="validBoxes.indexOf(i) >= 0"
             style="width: 100%; height: 100%; background-color: #FF5722; top: 0; left: 0;"></div>
            <img
              :style="{transform: cards2[item] && grades[item] != grade ? 'rotate(180deg)' : 'rotate(0)', opacity: item < 0 ? 0 : 100}"
              :src="!cards2[item] ? './static/logo.png' : './static/avatar/' + item + '.png'" style="width: 100%;"
            >
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="row">
    <span class="m-0 scrore">{{lowCount + ' : ' + highCount}}</span>
  </div>
<GameControls
  :undoDisabled="undoDisabled"
  :restartDisabled="restartDisabled"
  :stepDisabled="stepDisabled"
  :autoDisabled="autoDisabled"
  @undo="undo"
  @goon="goon"
  @step="stepTwiceFn"
  @auto="pass"
/>
    <GameResultModal
      v-if="status == 3"
      title="DRAW GAME"
      :buttons="[
        {
          text: 'RESTART',
          callback: goon,
          disabled: false
        },
        {
          text: 'UNDO',
          callback: undo,
          disabled: step <= 0
        }
      ]"
      :modalStyle="{ backgroundColor: 'rgba(0,0,0,0.5)' }"
    />
    
    <GameResultModal
      v-if="status == 2"
      title="U LOSE"
      :buttons="[
        {
          text: 'RESTART',
          callback: goon,
          disabled: false
        },
        {
          text: 'UNDO',
          callback: undo,
          disabled: step <= 0
        }
      ]"
      :modalStyle="{ backgroundColor: 'rgba(0,0,0,0.5)' }"
    />
    
    <GameResultModal
      v-if="status == 1"
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
import Chess from './Chess.js'
import GameResultModal from './GameResultModal.vue'
import GameControls from './GameControls.vue'
import GameStateManager from '../utils/gameStateManager.js'

// 扩展Chess组件以包含GameResultModal和GameControls
const chessWithModal = {
  ...Chess,
  components: {
    ...Chess.components, // 保留原来的组件
    GameResultModal,
    GameControls
  },
  created() {
    // 创建游戏状态管理器实例
    this.gameManager = new GameStateManager({
      autoStepDelay: 500 // 设置自动模式每步的延迟时间
    });
    
    // 初始化游戏
    this.init();
    
    // 注册游戏状态管理器的事件监听器
    this.gameManager.on('win', this.handleWin);
    this.gameManager.on('lose', this.handleLose);
    this.gameManager.on('draw', this.handleDraw);
    this.gameManager.on('undo', this.handleUndo);
    this.gameManager.on('stateChange', this.handleStateChange);
  },
  beforeUnmount() {
    // 移除事件监听器，防止内存泄漏
    this.gameManager.off('win', this.handleWin);
    this.gameManager.off('lose', this.handleLose);
    this.gameManager.off('draw', this.handleDraw);
    this.gameManager.off('undo', this.handleUndo);
    this.gameManager.off('stateChange', this.handleStateChange);
    
    // 停止自动模式
    this.gameManager.stopAuto();
  },
  computed: {
    ...Chess.computed,
    // 计算属性，用于获取游戏状态
    gameState() {
      return this.gameManager.getState();
    },
    
    // 计算属性，用于判断按钮是否可用
    undoDisabled() {
      return !this.gameManager.canUndo();
    },
    
    restartDisabled() {
      return !this.gameManager.hitflag || !this.gameManager.lockflag;
    },
    
    stepDisabled() {
      return !this.gameManager.hitflag || !this.gameManager.lockflag || 
             this.gameManager.winflag || this.gameManager.loseflag;
    },
    
    autoDisabled() {
      return !this.gameManager.hitflag || !this.gameManager.lockflag || 
             this.gameManager.winflag || this.gameManager.loseflag || 
             this.gameManager.isAutoRunning;
    },
    
    // 覆盖原有的hitflag和lockflag
    hitflag() {
      return this.gameManager.hitflag;
    },
    
    lockflag() {
      return this.gameManager.lockflag;
    },
    
    // 覆盖原有的step计算属性
    step() {
      return this.gameManager.getStepCount() / 2; // 原来的arr中每两步对应一个完整操作
    }
  },
  methods: {
    ...Chess.methods,
    
    // 记录移动操作
    recordMove(from, to, card, sign, signIndex) {
      this.gameManager.recordOperation({
        type: 'move',
        from: from,
        to: to,
        card: card,
        sign: sign,
        signIndex: signIndex,
        timestamp: Date.now()
      });
    },
    
    // 记录翻转操作
    recordFlip(card) {
      this.gameManager.recordOperation({
        type: 'flip',
        card: card,
        timestamp: Date.now()
      });
    },
    
    // 处理游戏胜利
    handleWin() {
      this.status = 1;
    },
    
    // 处理游戏失败
    handleLose() {
      this.status = 2;
    },
    
    // 处理游戏平局
    handleDraw() {
      this.status = 3;
    },
    
    // 处理撤销操作
    handleUndo(operation) {
      // 根据操作类型执行相应的撤销逻辑
      switch (operation.type) {
        case 'move':
          // 撤销移动操作
          this.$set(this.cards1, operation.signIndex, operation.sign);
          this.$set(this.cards1, operation.to, operation.card >= 0 ? operation.card : -1);
          break;
        case 'flip':
          // 撤销翻转操作
          this.$set(this.cards2, operation.card, false);
          break;
      }
      this.status = 0;
    },
    
    // 处理游戏状态变化
    // handleStateChange(state) {
    // },
    
    // 重写undo方法
    undo() {
      // 原代码中每执行一次undo会弹出两个操作，这里也保持一致
      this.gameManager.undo();
      this.gameManager.undo();
    },
    
    // 重写clickCard方法，使用GameStateManager记录操作
    async clickCard(i, isAuto) {
      let card = this.cards1[i];
      if (this.grade < 0) {
        this.grade = this.grades[card];
      }
      if (card >= 0 && !this.cards2[card]) {
        this.$set(this.cards2, card, true);
        this.recordFlip(card); // 使用GameStateManager记录操作
        this.sign = -1;
        if (!isAuto) {
          this.gameManager.hitflag = false;
          await Chess.methods.wait(500);
          await this.stepFn();
          this.gameManager.hitflag = true;
        }
        return;
      }
      let grade = this.step % 2 == 0 ? this.grade : !this.grade;
      if (this.sign >= 0 && this.grades[this.sign] != grade) {
        this.sign = card != this.sign && card >= 0 && this.grades[card] != grade ? card : -1;
        return;
      }
      if (this.sign >= 0 && this.grades[this.sign] == grade) {
        if (card >= 0 && this.grades[card] == grade) {
          this.sign = this.sign == card ? -1 : card;
          return;
        }
        if (this.validBoxes.indexOf(i) >= 0) {
          let signIndex = this.cards1.indexOf(this.sign);
          this.$set(this.cards1, signIndex, -1);
          this.$set(this.cards1, i, this.sign);
          this.recordMove(signIndex, i, card, this.sign, signIndex); // 使用GameStateManager记录操作
          this.sign = -1;
          if (card >= 0) {
            if (this.lowCount <= 0) {
              if (this.grade == 1) {
                this.gameManager.setWin();
              } else {
                this.gameManager.setLose();
              }
            }
            if (this.highCount <= 0) {
              if (this.grade == 0) {
                this.gameManager.setWin();
              } else {
                this.gameManager.setLose();
              }
            }
            if (this.lowCount == 1 && this.highCount == 1) {
              this.gameManager.setDraw();
            }
          }
          if (!isAuto && this.status <= 0) {
            this.gameManager.hitflag = false;
            await Chess.methods.wait(500);
            await this.stepFn();
            this.gameManager.hitflag = true;
          }
          return;
        }
      }
      this.sign = card;
    },
    
    // 重写stepTwiceFn方法
    async stepTwiceFn() {
      await this.gameManager.step(async () => {
        await this.stepFn();
        await Chess.methods.wait(500);
        await this.stepFn();
      });
    },
    
    // 重写pass方法（自动模式）
    pass() {
      this.gameManager.startAuto(async () => {
        if (this.status <= 0) {
          await this.stepFn();
          await Chess.methods.wait(500);
        }
      });
    },
    
    // 重写goon方法（重置游戏）
    goon() {
      this.gameManager.reset(() => {
        this.sign = -1;
        this.grade = -1;
        this.cards1.splice(0);
        this.cards2.splice(0);
        this.status = 0;
        this.init();
      });
    }
  }
}

export default chessWithModal
</script>

<style scoped>
@import url("./sum.css");
</style>
