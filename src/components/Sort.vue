<template>
  <div class="Sum">
    <h1>{{ title }}</h1>
    <GameControls
      :undoDisabled="undoDisabled"
      :restartDisabled="restartDisabled"
      :stepDisabled="stepDisabled"
      :autoDisabled="autoDisabled"
      @undo="undo"
      @goon="goon"
      @step="stepFn"
      @auto="pass"
    />
    <div class="row">
      <div>
        <ul
          class="cardsul flex-col"
          :style="{ height: 150 * (number + 1) + 'px' }"
          style="padding-left: 0; width: 100%; max-width: 500px; margin: 0 auto; position: static"
        >
          <div
            v-for="(item, i) in cards1"
            :key="i"
            class="card m-0"
            style="width:25%; height: 150px"
          >
            <img
              :src="'./static/' + item + '.jpg'"
              v-if="item >= 0"
              @click="hitflag && lockflag && clickCard(item, i)"
              :class="{ shanshuo: cards1[cards1.indexOf(item + 4) + 1] < 0 }"
            />
            <div
              v-else-if="cards1[i - 1] >= 4"
              @click="hitflag && lockflag && clickSign(i)"
            >
              <span class="m-0">{{
                types[cards1[i - 1] % 4] + point[(cards1[i - 1] >> 2) - 1]
              }}</span>
            </div>
          </div>
        </ul>
      </div>
    </div>
    <div class="btns">
      <GameControls
        :undoDisabled="undoDisabled"
        :restartDisabled="restartDisabled"
        :stepDisabled="stepDisabled"
        :autoDisabled="autoDisabled"
        @undo="undo"
        @goon="goon"
        @step="stepFn"
        @auto="pass"
      />
    </div>
    <GameResultModal
      v-if="loseflag"
      title="U LOSE"
      :subtitle="n + '/' + number * 4"
      :buttons="[
        {
          text: 'RESTART',
          callback: goon,
          disabled: false
        },
        {
          text: 'UNDO',
          callback: undo,
          disabled: undoDisabled
        }
      ]"
      :modalStyle="{ backgroundColor: 'rgba(0,0,0,0.5)' }"
    />

    <GameResultModal
      v-if="winflag"
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
import Sort from "./Sort.js";
import GameResultModal from "./GameResultModal.vue";
import GameControls from "./GameControls.vue";
import GameStateManager from "../utils/gameStateManager.js";

// 扩展Sort组件以包含GameResultModal和GameControls
const sortWithModal = {
  ...Sort,
  components: {
    ...Sort.components, // 保留原来的组件
    GameResultModal,
    GameControls
  },
  data() {
    return {
      ...Sort.data.call(this),
      gameManager: new GameStateManager({
        autoStepDelay: 500 // 设置自动模式每步的延迟时间
      })
    };
  },
  created() {
    // 创建游戏状态管理器实例
    this.gameManager.init()

    // 初始化游戏
    this.init();

    // 注册游戏状态管理器的事件监听器
    this.gameManager.on("undo", this.handleUndo);
  },
  beforeUnmount() {
    // 移除事件监听器，防止内存泄漏
    this.gameManager.off("undo", this.handleUndo);

    // 停止自动模式
    this.gameManager.stopAuto();
  },
  computed: {
    ...Sort.computed,
    // 使用GameStateManager的默认计算属性，gameManager会自动映射到gameStateManager
    ...GameStateManager.getDefaultComputedProperties()
  },
  methods: {
    ...Sort.methods,

    // 记录移动操作
    recordMove(from, to, card, sign) {
      this.gameManager.recordOperation({
        type: "move",
        from: from,
        to: to,
        card: card,
        sign: sign,
        timestamp: Date.now()
      });
    },

    // 处理撤销操作
    handleUndo(operation) {
      // 根据操作类型执行相应的撤销逻辑
      switch (operation.type) {
        case "move":
          // 撤销移动操作
          this.$set(this.cards1, operation.to, operation.sign);
          this.$set(this.cards1, operation.from, operation.card);
          break;
      }
    },

    // 重写undo方法
    undo() {
      this.gameManager.undo();
    },
    // 重写clickCard方法，使用GameStateManager记录操作
    clickCard(card, i) {
      if (!Number.isFinite(i)) {
        i = this.cards1.indexOf(card);
      }
      let index = this.cards1.indexOf(card + 4);
      if (index >= 0) {
        if (this.cards1[index + 1] < 0) {
          let sign = this.cards1[index + 1];
          this.recordMove(i, index + 1, card, sign); // 使用GameStateManager记录操作
          this.$set(this.cards1, i, sign);
          this.$set(this.cards1, index + 1, card);
        }
      }
    },
    // 重写stepFn方法
    async stepFn() {
      await this.gameManager.step(async () => {
        this.clickSign(this.next[1]);
        await Sort.methods.wait(1000);
        this.clickCard(this.next[0]);
      });
    },

    // 重写pass方法（自动模式）
    pass() {
      this.gameManager.startAuto(async () => {
        await this.stepFn();
        await Sort.methods.wait(1000);
      });
    },
    // 重写goon方法（重置游戏）
    goon() {
      this.gameManager.reset(() => {
        this.cards1.splice(0);
        this.init();
      });
    },

    // 覆盖Sort.js中的autoCalc方法，使用GameStateManager设置游戏结果
    autoCalc() {
      // 先调用原始方法
      Sort.methods.autoCalc.call(this);
      
      // 然后使用gameManager设置结果
      if (this.state == 1) {
        this.gameManager.setWin();
      } else if (this.state == 2) {
        this.gameManager.setLose();
      }
    }
  }
};

export default sortWithModal;
</script>

<style scoped>
@import url("./sum.css");
</style>
