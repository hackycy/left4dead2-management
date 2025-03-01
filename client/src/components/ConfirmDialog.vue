<template>
  <div class="confirm-dialog" :class="{ active: show }">
    <div class="confirm-container" @click.stop>
      <div class="confirm-header">
        <h3><i class="fas fa-exclamation-triangle"></i> {{ title }}</h3>
      </div>
      <div class="confirm-body">
        <div class="confirm-message">{{ message }}</div>

        <!-- 密码输入框 - 简化版本 -->
        <div class="password-input-container">
          <div class="input-wrapper" :class="{ 'input-error': hasPasswordError }">
            <i class="fas fa-lock"></i>
            <input
              type="password"
              v-model="password"
              placeholder="请输入管理员密码"
              @keyup.enter="onConfirm"
              @input="hasPasswordError = false"
              ref="passwordInput"
            />
          </div>
          <!-- 移除了password-error显示 -->
        </div>
      </div>
      <div class="confirm-footer">
        <button class="confirm-btn cancel" @click="onCancel">
          <i class="fas fa-times"></i> 取消
        </button>
        <button class="confirm-btn confirm" @click="onConfirm">
          <i class="fas fa-check"></i> 确认
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: '确认操作',
  },
  message: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['confirm', 'cancel', 'passwordError'])

const password = ref('')
const hasPasswordError = ref(false)
const passwordInput = ref<HTMLInputElement | null>(null)

// 监听对话框显示状态，当显示时自动聚焦密码输入框
watch(
  () => props.show,
  (newValue) => {
    if (newValue) {
      // 重置状态
      password.value = ''
      hasPasswordError.value = false

      // 自动聚焦
      nextTick(() => {
        if (passwordInput.value) {
          passwordInput.value.focus()
        }
      })
    }
  }
)

const onConfirm = () => {
  if (!password.value.trim()) {
    hasPasswordError.value = true
    return
  }

  emit('confirm', password.value)
}

const onCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.confirm-dialog {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(10, 12, 20, 0.8);
  backdrop-filter: blur(10px) saturate(180%);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 2000;
}

.confirm-dialog.active {
  opacity: 1;
  visibility: visible;
}

.confirm-container {
  width: 90%;
  max-width: 450px;
  background: var(--panel-bg);
  border-radius: 16px;
  border: 1px solid var(--border);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transform: translateY(20px) scale(0.95);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.confirm-dialog.active .confirm-container {
  transform: translateY(0) scale(1);
}

.confirm-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.2);
}

.confirm-header h3 {
  font-size: 1.2rem;
  color: var(--text-primary);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.confirm-header h3 i {
  color: var(--warning);
}

.confirm-body {
  padding: 1.8rem 1.5rem;
}

.confirm-message {
  color: var(--text-secondary);
  font-size: 1.1rem;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

/* 密码输入框样式 */
.password-input-container {
  margin-top: 1.5rem;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0 1rem;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(100, 255, 218, 0.3);
}

/* 添加错误状态的样式 */
.input-wrapper.input-error {
  border-color: var(--danger);
  box-shadow: 0 0 0 2px rgba(255, 23, 68, 0.3);
}

.input-wrapper.input-error:focus-within {
  border-color: var(--danger);
  box-shadow: 0 0 0 2px rgba(255, 23, 68, 0.3);
}

.input-wrapper i {
  color: var(--text-secondary);
  margin-right: 0.8rem;
}

/* 改变错误状态下图标颜色 */
.input-wrapper.input-error i {
  color: var(--danger);
}

.input-wrapper input {
  width: 100%;
  background: transparent;
  border: none;
  color: var(--text-primary);
  padding: 0.8rem 0;
  font-size: 1rem;
  outline: none;
  font-family: inherit;
}

.input-wrapper input::placeholder {
  color: var(--text-secondary);
  opacity: 0.7;
}

.confirm-footer {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 1rem 1.5rem 1.8rem;
}

.confirm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.8rem 1.2rem;
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.confirm-btn.cancel {
  background: rgba(16, 18, 27, 0.6);
  color: var(--text-secondary);
}

.confirm-btn.confirm {
  background: rgba(255, 23, 68, 0.25);
  border-color: rgba(255, 23, 68, 0.5);
  color: var(--text-primary);
}

.confirm-btn.cancel:hover {
  background: rgba(255, 255, 255, 0.1);
}

.confirm-btn.confirm:hover {
  background: rgba(255, 23, 68, 0.35);
  box-shadow: 0 0 15px rgba(255, 23, 68, 0.4);
}

.confirm-btn:active {
  transform: scale(0.95);
}

.confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

@media (max-width: 768px) {
  .confirm-container {
    width: 95%;
  }

  .confirm-header,
  .confirm-body,
  .confirm-footer {
    padding: 1rem;
  }
}
</style>
