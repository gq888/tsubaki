<template>
  <div class="Sum">
    <h1>{{ title }}</h1>
    <div class="row center">
      <img class="avatar" :src="'./static/avatar/17.png'" />
      <span class="scrore">{{ score1 }}</span>
    </div>
    <div class="row">
      <div>
        <ul class="cardsul">
          <li v-for="item in arr1" :key="item.id" class="card">
            <img :src="'./static/' + item.id + '.jpg'" />
          </li>
        </ul>
      </div>
    </div>
    <div class="row" style="margin-top: 10px;">
      <div>
        <ul class="cardsul reverse">
          <li v-for="item in arr2" :key="item.id" class="card">
            <img :src="'./static/' + item.id + '.jpg'" />
          </li>
        </ul>
      </div>
    </div>
    <div class="row center">
      <img class="avatar" :src="'./static/avatar/32.png'" />
      <span class="scrore">{{ score2 }}</span>
    </div>
    <div class="btns">
      <GameControls
        :buttons="[
          {
            label: 'HIT',
            action: 'hitBtn',
            disabled: !hitflag
          },
          {
            label: 'PASS',
            action: 'passBtn',
            disabled: !hitflag
          }
        ]"
        @hitBtn="hit(cardsChg, arr2)"
        @passBtn="pass"
      />
    </div>
    <transition>
      <GameResultModal
        v-if="loseflag"
        :title="'U LOSE'"
        :buttons="[{ text: 'AGAIN', callback: goon }]"
        :modalStyle="{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }"
        :customClass="'lose'"
      />
      <GameResultModal
        v-if="winflag"
        :title="'U WIN!'"
        :buttons="[{ text: 'GO ON', callback: goon }]"
        :modalStyle="{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }"
        :customClass="'lose'"
      />
      <GameResultModal
        v-if="drawflag"
        :title="'DRAW GAME'"
        :buttons="[{ text: 'GO ON', callback: goon }]"
        :modalStyle="{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }"
        :customClass="'draw lose'"
      />
    </transition>
  </div>
</template>

<script>
import sum from "./sum.js";
import GameResultModal from "./GameResultModal.vue";
import GameControls from "./GameControls.vue";
import GameStateManager from "../utils/gameStateManager.js";

const componentConfig = {
  ...sum,
  components: {
    ...sum.components, // 保留原来的组件
    GameResultModal,
    GameControls
  },
  data() {
    return {
      ...sum.data.call(this),
      gameManager: new GameStateManager({
        autoStepDelay: 1000 // 设置自动模式每步的延迟时间
      })
    };
  },
  created() {
    // 创建游戏状态管理器实例
    this.gameManager.init();

    // 初始化游戏
    this.init(this.cardsChg);
  },
  beforeUnmount() {
    // 停止自动模式
    this.gameManager.stopAuto();
  },
  computed: {
    ...sum.computed,
    // 使用GameStateManager的默认计算属性
    ...GameStateManager.getDefaultComputedProperties()
  },
  methods: {
    ...sum.methods,

    // 重写pass方法
    pass() {
      this.gameManager.startAuto(() => {
        return new Promise(resolve => {
          this.compare();
          setTimeout(resolve, 1000); // 保持原来的1秒间隔
        });
      });
    },

    // 重写compare方法
    compare() {
      if (this.score1 === this.score2) {
        this.gameManager.setDraw();
      } else if (this.score1 < this.score2) {
        this.hit(this.cardsChg, this.arr1);
      } else if (this.score1 > this.score2) {
        this.gameManager.setLose();
      }
    },

    // 重写goon方法
    goon() {
      this.gameManager.reset(() => {
        this.cardsChg = [];
        this.init(this.cardsChg);
      });
    }
  },
  watch: {
    score2() {
      if (this.score2 === 0) {
        this.gameManager.setLose();
      }
    },
    score1() {
      if (this.score1 === 0) {
        this.gameManager.setWin();
      }
    }
  }
};

export default componentConfig;
</script>

<style scoped>
@import url("./sum.css");
</style>
