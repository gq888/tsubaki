<template>
  <div v-if="visible" class="help-modal" @click="closeHelp">
    <div class="help-content" @click.stop>
      <h3>GUIDE</h3>
      <div class="button-help-list">
        <div v-for="(btn, index) in helpContent" :key="index" class="button-help-item">
          <span class="button-label">{{ btn.label }}</span>
          <span class="button-description">{{ btn.description }}</span>
        </div>
      </div>
      <button class="close-btn" @click="closeHelp">CLOSE</button>
    </div>
  </div>
</template>

<script>


export default {
  name: "GameHelp",
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    gameRule: {
      type: String,
      default: "",
    },
    gameControlsButtons: {
      type: Object,
      default: () => ({}),
    },
    gameControlsRefs: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      helpContent: [],
    };
  },
  
  watch: {
    visible(newVal) {
      if (newVal) {
        this.generateHelpContent();
      }
    },
  },
  
  methods: {
    generateHelpContent() {
      // 按钮说明映射
      const buttonDescriptions = {
        undo: "CANCEL THE LAST MOVE",
        goon: "RESTART THE GAME",
        restart: "RESTART THE GAME",
        hint: "GET A HINT",
        step: "EXECUTE THE NEXT MOVE",
        auto: "AUTO EXECUTE/STOP AUTO EXECUTE",
        hitBtn: "DRAW A NEW CARD",
        passBtn: "STOP DRAWING CARDS"
      };
      
      // 收集所有GameControls实例的按钮配置
      const uniqueButtons = new Map();
      
      // 从事件总线收集的按钮配置（优先使用）
      Object.values(this.gameControlsButtons).forEach(buttons => {
        if (buttons && Array.isArray(buttons)) {
          buttons.forEach(button => {
            if (button.action) {
              uniqueButtons.set(button.action, button);
            }
          });
        }
      });
      
      // 同时也检查命名的refs作为备用
      if (this.gameControlsRefs.gameControls && this.gameControlsRefs.gameControls.displayButtons) {
        this.gameControlsRefs.gameControls.displayButtons.forEach(button => {
          if (button.action && !uniqueButtons.has(button.action)) {
            uniqueButtons.set(button.action, button);
          }
        });
      }
      
      if (this.gameControlsRefs.bottomGameControls && this.gameControlsRefs.bottomGameControls.displayButtons) {
        this.gameControlsRefs.bottomGameControls.displayButtons.forEach(button => {
          if (button.action && !uniqueButtons.has(button.action)) {
            uniqueButtons.set(button.action, button);
          }
        });
      }
      
      // 初始化帮助内容
      this.helpContent = [];
      
      // 添加游戏规则说明（作为一个特殊的帮助项）
      if (this.gameRule) {
        this.helpContent.push({
          label: "📋",
          description: `RULE: ${this.gameRule}`
        });
      }
      
      // 添加按钮操作说明
      if (uniqueButtons.size > 0) {
        console.log("通过事件总线获取到的按钮配置:", Array.from(uniqueButtons.values()));
        // 从Map转换为数组并添加到帮助内容中
        const buttonItems = Array.from(uniqueButtons.values()).map(button => ({
          label: button.label || button.action.toUpperCase(),
          description: buttonDescriptions[button.action] || '未知功能'
        }));
        this.helpContent.push(...buttonItems);
      } else {
        console.log("未获取到游戏按钮配置，使用默认按钮说明");
        // 如果无法直接获取，使用默认的按钮说明
        const defaultButtonItems = [
          { label: "◀︎", description: buttonDescriptions.undo },
          { label: "RESTART", description: buttonDescriptions.restart },
          { label: "AUTO/STOP", description: buttonDescriptions.auto },
          { label: "►", description: buttonDescriptions.step }
        ];
        this.helpContent.push(...defaultButtonItems);
      }
    },
    
    closeHelp() {
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
.help-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.help-content {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  width: 90%;
  box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.2);
}

.help-content h3 {
  margin-top: 0;
  color: #2c3e50;
  text-align: center;
  font-size: 1.2em;
}

.button-help-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1rem 0;
}

.button-help-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 0.375rem;
  border: 0.0625rem solid #e9ecef;
}

.button-label {
  padding: 0.25rem 0.5rem;
  background: #dfcdc3;
  border-radius: 0.25rem;
  min-width: 3rem;
  text-align: center;
  color: #2c3e50;
}

.button-description {
  color: #666;
  font-size: 0.9em;
  text-align: right;
  flex: 1;
}

.close-btn {
  width: 100%;
  padding: 0.5rem 1rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.close-btn:hover {
  background-color: #35a372;
}
</style>