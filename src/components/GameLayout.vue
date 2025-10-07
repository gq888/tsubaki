<template>
  <div class="Sum" :style="containerStyle">
    <!-- 游戏标题 -->
    <h1 v-if="title">{{ title }}</h1>
    
    <!-- 顶部游戏控制按钮 -->
    <GameControls
      v-if="showTopControls"
      v-bind="gameControlsProps"
      v-on="gameControlsEvents"
    />
    
    <!-- 游戏信息显示区域 -->
    <div v-if="hasGameInfo" class="row">
      <slot name="game-info">
        <span v-if="time !== undefined">TIME: {{ time }}</span>
        <br v-if="time !== undefined && step !== undefined" />
        <span v-if="step !== undefined">STEP: {{ step }}</span>
        <span v-if="score1 !== undefined || score2 !== undefined">
          {{ score1 !== undefined ? score1 : '' }}
          {{ score1 !== undefined && score2 !== undefined ? ' : ' : '' }}
          {{ score2 !== undefined ? score2 : '' }}
        </span>
      </slot>
    </div>
    
    <!-- 主游戏内容区域 -->
    <div class="row">
      <slot name="game-content"></slot>
    </div>
    
    <!-- 底部游戏控制按钮 -->
    <GameControls
      v-if="showBottomControls"
      v-bind="gameControlsProps"
      v-on="gameControlsEvents"
    />
    
    <!-- 底部按钮区域 -->
    <div v-if="hasBottomButtons" class="btns">
      <slot name="bottom-buttons">
        <GameControls
          v-bind="gameControlsProps"
          v-on="gameControlsEvents"
        />
      </slot>
    </div>
    
    <!-- 游戏结果模态框 -->
    <slot name="result-modals">
      <!-- 胜利模态框 -->
      <GameResultModal
        v-if="winflag"
        :title="winModal.title"
        :subtitle="winModal.subtitle"
        :buttons="winModal.buttons"
        :modalStyle="winModal.modalStyle"
        :customClass="winModal.customClass"
      >
        <template v-if="winModal.content" v-slot:content>
          <component :is="winModal.content" v-bind="winModal.contentProps" />
        </template>
      </GameResultModal>
      
      <!-- 失败模态框 -->
      <GameResultModal
        v-if="loseflag"
        :title="loseModal.title"
        :subtitle="loseModal.subtitle"
        :buttons="loseModal.buttons"
        :modalStyle="loseModal.modalStyle"
        :customClass="loseModal.customClass"
      >
        <template v-if="loseModal.content" v-slot:content>
          <component :is="loseModal.content" v-bind="loseModal.contentProps" />
        </template>
      </GameResultModal>
      
      <!-- 平局模态框 -->
      <GameResultModal
        v-if="drawflag"
        :title="drawModal.title"
        :subtitle="drawModal.subtitle"
        :buttons="drawModal.buttons"
        :modalStyle="drawModal.modalStyle"
        :customClass="drawModal.customClass"
      >
        <template v-if="drawModal.content" v-slot:content>
          <component :is="drawModal.content" v-bind="drawModal.contentProps" />
        </template>
      </GameResultModal>
    </slot>
  </div>
</template>

<script>
import GameControls from './GameControls.vue';
import GameResultModal from './GameResultModal.vue';

export default {
  name: 'GameLayout',
  components: {
    GameControls,
    GameResultModal
  },
  props: {
    // 基本配置
    title: {
      type: String,
      default: ''
    },
    containerStyle: {
      type: Object,
      default: () => ({})
    },
    
    // 游戏控制按钮配置
    showTopControls: {
      type: Boolean,
      default: true
    },
    showBottomControls: {
      type: Boolean,
      default: false
    },
    hasBottomButtons: {
      type: Boolean,
      default: false
    },
    
    // 游戏控制按钮属性
    showUndo: {
      type: Boolean,
      default: true
    },
    showRestart: {
      type: Boolean,
      default: true
    },
    undoDisabled: {
      type: Boolean,
      default: false
    },
    restartDisabled: {
      type: Boolean,
      default: false
    },
    stepDisabled: {
      type: Boolean,
      default: false
    },
    autoDisabled: {
      type: Boolean,
      default: false
    },
    
    // 游戏信息显示
    hasGameInfo: {
      type: Boolean,
      default: false
    },
    time: {
      type: Number,
      default: undefined
    },
    step: {
      type: Number,
      default: undefined
    },
    score1: {
      type: Number,
      default: undefined
    },
    score2: {
      type: Number,
      default: undefined
    },
    
    // 游戏状态标志
    winflag: {
      type: Boolean,
      default: false
    },
    loseflag: {
      type: Boolean,
      default: false
    },
    drawflag: {
      type: Boolean,
      default: false
    },
    
    // 模态框配置
    winModal: {
      type: Object,
      default: () => ({
        title: 'U WIN!',
        buttons: []
      })
    },
    loseModal: {
      type: Object,
      default: () => ({
        title: 'U LOSE',
        buttons: []
      })
    },
    drawModal: {
      type: Object,
      default: () => ({
        title: 'DRAW GAME',
        buttons: []
      })
    }
  },
  computed: {
    gameControlsProps() {
      return {
        showUndo: this.showUndo,
        showRestart: this.showRestart,
        undoDisabled: this.undoDisabled,
        restartDisabled: this.restartDisabled,
        stepDisabled: this.stepDisabled,
        autoDisabled: this.autoDisabled
      };
    },
    gameControlsEvents() {
      return {
        undo: () => this.$emit('undo'),
        goon: () => this.$emit('goon'),
        step: () => this.$emit('step'),
        auto: () => this.$emit('auto')
      };
    }
  }
};
</script>

<style scoped>
@import url("./sum.css");
</style>
