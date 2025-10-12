<template>
  <transition name="modal-fade">
    <div v-if="visible" class="settings-overlay" @click.self="close">
      <div class="settings-modal">
        <div class="settings-header">
          <h2>SETTING</h2>
          <button class="close-btn" @click="close">✕</button>
        </div>
        
        <div class="settings-body">
          <div class="setting-item">
            <label class="setting-label">SPEED</label>
            <input 
              type="range" 
              class="delay-slider"
              :value="localDelay"
              @input="handleDelayChange"
              min="0"
              max="100"
              step="1"
            />
            <div class="slider-labels">
              <span>FAST</span>
              <span>SLOW</span>
            </div>
          </div>

          <div class="setting-item">
            <label class="checkbox-container">
              <input 
                type="checkbox" 
                v-model="applyToAll"
              />
              <span class="checkbox-label">IS APPLY TO ALL GAMES</span>
            </label>
          </div>
        </div>

        <div class="settings-footer">
          <button class="btn btn-secondary" @click="reset">RESET</button>
          <button class="btn btn-primary" @click="save">SAVE</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import gameSettingsManager from '../utils/gameSettingsManager.js';

export default {
  name: 'GameSettings',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    currentGame: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      localDelay: 50, // 0-100 的滑动条值
      applyToAll: false,
      defaultDelay: 50
    };
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.loadSettings();
      }
    }
  },
  mounted() {
    this.loadSettings();
  },
  methods: {
    /**
     * 将滑动条值 (0-100) 转换为实际延迟时间 (100-2000ms)
     * 0 -> 100ms (最快)
     * 100 -> 2000ms (最慢)
     */
    sliderToDelay(sliderValue) {
      return Math.round(100 + sliderValue * 19);
    },

    /**
     * 将实际延迟时间转换为滑动条值
     */
    delayToSlider(delay) {
      return Math.round((delay - 100) / 19);
    },

    /**
     * 加载设置
     */
    loadSettings() {
      const globalDelay = localStorage.getItem('game-global-delay');
      const gameDelay = localStorage.getItem(`game-delay-${this.currentGame}`);
      
      if (gameDelay) {
        this.localDelay = this.delayToSlider(parseInt(gameDelay));
        this.applyToAll = false;
      } else if (globalDelay) {
        this.localDelay = this.delayToSlider(parseInt(globalDelay));
        this.applyToAll = true;
      } else {
        this.localDelay = this.defaultDelay;
        this.applyToAll = false;
      }
    },

    /**
     * 处理滑动条变化
     */
    handleDelayChange(event) {
      this.localDelay = parseInt(event.target.value);
    },

    /**
     * 保存设置
     */
    save() {
      const delayValue = this.sliderToDelay(this.localDelay);
      
      // 使用 gameSettingsManager 保存设置
      gameSettingsManager.saveDelay(this.currentGame, delayValue, this.applyToAll);

      this.$emit('settings-saved', {
        delay: delayValue,
        applyToAll: this.applyToAll,
        currentGame: this.currentGame
      });

      this.close();
    },

    /**
     * 重置到默认值
     */
    reset() {
      this.localDelay = this.defaultDelay;
      this.applyToAll = false;
    },

    /**
     * 关闭弹窗
     */
    close() {
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.settings-modal {
  background: white;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 28rem;
  box-shadow: 0 0.625rem 1.875rem rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 0.0625rem solid #e0e0e0;
}

.settings-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #888;
  cursor: pointer;
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.settings-body {
  padding: 1.5rem;
}

.setting-item {
  margin-bottom: 1.5rem;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.75rem;
  font-size: 0.9375rem;
}

.delay-slider {
  width: 100%;
  height: 0.375rem;
  border-radius: 0.3125rem;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
  background: linear-gradient(to right, #42b983, #f39c12, #e74c3c);
}

.delay-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: 0.125rem solid #42b983;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.delay-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.3);
}

.delay-slider::-moz-range-thumb {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: white;
  cursor: pointer;
  border: 0.125rem solid #42b983;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.delay-slider::-moz-range-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.3);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.875rem;
}

.checkbox-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.checkbox-container input[type="checkbox"] {
  margin: 0;
  margin-right: 0.5rem;
  width: 1.125rem;
  height: 1.125rem;
  cursor: pointer;
}

.checkbox-label {
  font-size: 0.9375rem;
  color: #2c3e50;
}

.settings-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 0.0625rem solid #e0e0e0;
  background: #f8f8f8;
}

.btn {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
  background: #d0d0d0;
}

.btn-primary {
  background: #42b983;
  color: white;
}

.btn-primary:hover {
  background: #35a372;
}

.btn:active {
  transform: scale(0.98);
}

/* 动画效果 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-active .settings-modal,
.modal-fade-leave-active .settings-modal {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .settings-modal {
  transform: scale(0.9) translateY(-1.25rem);
}

.modal-fade-leave-to .settings-modal {
  transform: scale(0.9) translateY(-1.25rem);
}
</style>
