<template>
  <Teleport to="body">
    <div class="toast-container">
      <transition-group name="toast">
        <div v-for="toast in toasts" :key="toast.id" class="toast" :class="`toast-${toast.type}`">
          <div class="toast-icon">
            <i :class="getIconClass(toast.type)"></i>
          </div>
          <div class="toast-content">{{ toast.message }}</div>
        </div>
      </transition-group>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'

interface Toast {
  id: number
  message: string
  type: 'error' | 'success' | 'info' | 'warning'
  timer?: number
}

const toasts = ref<Toast[]>([])
let toastCounter = 0

// 图标类名映射
const getIconClass = (type: string) => {
  switch (type) {
    case 'success':
      return 'fas fa-check-circle'
    case 'error':
      return 'fas fa-exclamation-circle'
    case 'warning':
      return 'fas fa-exclamation-triangle'
    case 'info':
    default:
      return 'fas fa-info-circle'
  }
}

// 添加Toast方法
const addToast = (
  message: string,
  type: 'error' | 'success' | 'info' | 'warning' = 'info',
  duration: number = 5000
) => {
  const id = toastCounter++

  const toast: Toast = {
    id,
    message,
    type,
    timer: undefined,
  }

  // 添加到列表
  toasts.value.push(toast)

  // 设置自动移除计时器
  toast.timer = window.setTimeout(() => {
    removeToast(id)
  }, duration)
}

// 移除Toast方法
const removeToast = (id: number) => {
  const index = toasts.value.findIndex((t) => t.id === id)
  if (index !== -1) {
    // 清除定时器
    clearTimeout(toasts.value[index].timer)
    // 移除Toast
    toasts.value.splice(index, 1)
  }
}

// 组件卸载时清除所有定时器
onUnmounted(() => {
  toasts.value.forEach((toast) => {
    if (toast.timer) {
      clearTimeout(toast.timer)
    }
  })
})

// 导出方法供外部使用
defineExpose({
  add: addToast,
  remove: removeToast,
  success: (message: string, duration?: number) => addToast(message, 'success', duration),
  error: (message: string, duration?: number) => addToast(message, 'error', duration),
  warning: (message: string, duration?: number) => addToast(message, 'warning', duration),
  info: (message: string, duration?: number) => addToast(message, 'info', duration),
})
</script>

<style>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2500;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
  max-width: 100%;
  width: 350px;
}

.toast {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--panel-bg);
  backdrop-filter: blur(10px) saturate(180%);
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
  color: var(--text-primary);
  pointer-events: auto;
  transform-origin: top right;
  animation: toast-in 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-error {
  border-left: 4px solid var(--danger);
}

.toast-success {
  border-left: 4px solid var(--success);
}

.toast-warning {
  border-left: 4px solid var(--warning);
}

.toast-info {
  border-left: 4px solid var(--accent);
}

.toast-icon {
  margin-right: 12px;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.toast-error .toast-icon {
  color: var(--danger);
}

.toast-success .toast-icon {
  color: var(--success);
}

.toast-warning .toast-icon {
  color: var(--warning);
}

.toast-info .toast-icon {
  color: var(--accent);
}

.toast-content {
  flex: 1;
  font-size: 0.95rem;
  font-weight: 500;
  overflow: hidden;
  word-wrap: break-word;
}

/* Toast动画 */
.toast-enter-active {
  animation: toast-in 0.4s cubic-bezier(0.21, 1.02, 0.73, 1);
}

.toast-leave-active {
  animation: toast-out 0.4s forwards cubic-bezier(0.06, 0.71, 0.55, 1);
}

@keyframes toast-in {
  0% {
    transform: translateX(100%) scale(0.8);
    opacity: 0;
  }
  100% {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
}

@keyframes toast-out {
  0% {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateX(100%) scale(0.8);
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .toast-container {
    width: calc(100% - 40px);
    right: 20px;
    top: 10px;
  }

  .toast {
    padding: 10px 12px;
    font-size: 0.9rem;
  }
}
</style>
