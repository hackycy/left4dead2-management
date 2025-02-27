<template>
  <div class="dashboard">
    <div class="metrics-panel">
      <!-- 第一行 -->
      <div class="metric-card">
        <div class="metric-header">
          <i class="fas fa-microchip"></i>
          <span>CPU 使用率</span>
        </div>
        <div class="metric-content">
          <div class="circular-progress">
            <div class="circular-progress-ring">
              <div
                class="circular-progress-circle"
                :style="{ '--progress-angle': `${(cpuUsage / 100) * 360}deg` }"
              ></div>
              <div class="circular-progress-mask"></div>
            </div>
            <div class="circular-progress-value">
              <div
                class="value-text"
                :class="{ changing: isChangingCpu }"
                :style="{ color: getCpuColor() }"
              >
                {{ cpuUsage }}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <i class="fas fa-memory"></i>
          <span>内存使用率</span>
        </div>
        <div class="metric-content">
          <div class="circular-progress">
            <div class="circular-progress-ring">
              <div
                class="circular-progress-circle"
                :style="{
                  '--progress-angle': `${(memoryUsage / 100) * 360}deg`,
                }"
              ></div>
              <div class="circular-progress-mask"></div>
            </div>
            <div class="circular-progress-value">
              <div
                class="value-text"
                :class="{ changing: isChangingMem }"
                :style="{ color: getMemoryColor() }"
              >
                {{ memoryUsage }}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 第二行 -->
      <div class="metric-card">
        <div class="metric-header">
          <i class="fas fa-server"></i>
          <span>运行状态</span>
        </div>
        <div class="metric-content">
          <div class="circular-progress">
            <div
              class="circular-progress-status clickable"
              :class="{ active: isRunning, inactive: !isRunning }"
              @click="showServiceConfirmation"
            >
              <i
                class="fas fa-power-off"
                :style="{
                  color: isRunning ? 'var(--success)' : 'var(--danger)',
                }"
              ></i>
            </div>
            <span class="status-text">
              {{ isRunning ? "运行中" : "已停止" }}
            </span>
          </div>
        </div>
      </div>

      <!-- 新的日志卡片，取代之前的按钮 -->
      <div class="metric-card log-card" @click="viewLogs">
        <div class="metric-header">
          <i class="fas fa-file-alt"></i>
          <span>运行日志</span>
        </div>
        <div class="metric-content">
          <div class="log-preview">
            <div class="log-icon">
              <i class="fas fa-terminal"></i>
            </div>
            <div class="log-status">查看日志</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 日志面板，初始隐藏 -->
  <div class="log-panel" :class="{ active: isViewingLogs }">
    <div class="log-container">
      <div class="log-header">
        <h3><i class="fas fa-file-alt"></i> 运行日志</h3>
        <button class="close-btn" @click="closeLogs">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="log-body">
        <div class="log-content" ref="logContent">
          <div v-for="(log, index) in logs" :key="index" class="log-entry">
            <span class="timestamp">[{{ log.timestamp }}]</span>
            <span class="log-type" :class="log.type">
              {{ log.type.toUpperCase() }}
            </span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 确认对话框组件 -->
  <ConfirmDialog
    :show="showConfirm"
    :title="confirmTitle"
    :message="confirmMessage"
    @confirm="confirmAction"
    @cancel="cancelAction"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import ConfirmDialog from "./components/ConfirmDialog.vue";

// 响应式数据
const cpuUsage = ref(0);
const memoryUsage = ref(0);
const isRunning = ref(true);
const isViewingLogs = ref(false);
const logs = ref<{ type: string; message: string; timestamp: string }[]>([]);
const logContent = ref<HTMLElement | null>(null);
const isChangingCpu = ref(false);
const isChangingMem = ref(false);

// 确认对话框状态
const showConfirm = ref(false);
const confirmTitle = ref("");
const confirmMessage = ref("");
const pendingAction = ref<(() => void) | null>(null);

// 模拟日志数据
const logMessages = [
  { type: "info", message: "服务启动中..." },
  { type: "success", message: "服务已成功启动" },
  { type: "info", message: "监听端口: 27015" },
  { type: "info", message: "地图加载中: c5m1_waterfront" },
  { type: "success", message: "地图加载完成" },
  { type: "info", message: "玩家连接: Player1 [76561198xxxxxxxx]" },
  { type: "info", message: "玩家连接: Player2 [76561198xxxxxxxx]" },
  { type: "warning", message: "内存使用率超过75%" },
  { type: "error", message: "无法连接到主服务器" },
  { type: "info", message: "尝试重新连接..." },
  { type: "success", message: "已恢复与主服务器的连接" },
  { type: "warning", message: "玩家已离开: Player1" },
  { type: "info", message: "剩余玩家数: 1" },
  { type: "info", message: "更换地图: c5m2_park" },
  { type: "info", message: "玩家连接: Player3 [76561198xxxxxxxx]" },
];

// 间隔定时器
let monitorInterval: number | null = null;
let logInterval: number | null = null;

// 颜色计算方法
const getCpuColor = () => {
  if (cpuUsage.value > 90) return "var(--danger)";
  if (cpuUsage.value > 80) return "var(--warning)";
  return "var(--text-primary)";
};

const getMemoryColor = () => {
  if (memoryUsage.value > 90) return "var(--danger)";
  if (memoryUsage.value > 80) return "var(--warning)";
  return "var(--text-primary)";
};

// 显示服务操作确认对话框
const showServiceConfirmation = () => {
  if (isRunning.value) {
    confirmTitle.value = "停止服务";
    confirmMessage.value = "确定要停止服务吗？这将断开所有当前连接。";
  } else {
    confirmTitle.value = "启动服务";
    confirmMessage.value = "确定要启动服务吗？";
  }

  pendingAction.value = performToggleService;
  showConfirm.value = true;
};

// 确认对话框确认操作
const confirmAction = () => {
  if (pendingAction.value) {
    pendingAction.value();
    pendingAction.value = null;
  }
  showConfirm.value = false;
};

// 确认对话框取消操作
const cancelAction = () => {
  pendingAction.value = null;
  showConfirm.value = false;
};

// 实际执行服务切换
const performToggleService = () => {
  isRunning.value = !isRunning.value;

  // 添加启动/停止日志
  if (isRunning.value) {
    addLogEntry("success", "服务已启动");
  } else {
    addLogEntry("warning", "服务已停止");
  }
};

// 显示日志面板
const viewLogs = () => {
  isViewingLogs.value = true;
  document.body.style.overflow = "hidden"; // 防止背景滚动

  // 添加初始日志条目（如果没有的话）
  if (logs.value.length === 0) {
    addLogEntry("info", "正在载入日志数据...");
    // 模拟载入一些历史日志
    setTimeout(() => {
      addLogEntry("info", "====== 历史日志记录 ======");
      addLogEntry("info", "服务启动中...");
      addLogEntry("success", "服务已成功启动");
      addLogEntry("info", "监听端口: 27015");
      addLogEntry("info", "地图加载中: c5m1_waterfront");
      addLogEntry("success", "地图加载完成");
    }, 300);
  }

  // 启动模拟日志更新
  startLogSimulation();
};

// 关闭日志面板
const closeLogs = () => {
  isViewingLogs.value = false;
  document.body.style.overflow = "auto"; // 恢复背景滚动

  // 停止日志模拟
  if (logInterval) {
    clearInterval(logInterval);
    logInterval = null;
  }
};

// 添加日志条目
const addLogEntry = (type: string, message: string) => {
  const now = new Date();
  const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

  logs.value.push({ type, message, timestamp });

  // 限制日志条目数量，防止过多
  if (logs.value.length > 500) {
    logs.value.shift();
  }

  // 滚动到底部
  nextTick(() => {
    if (logContent.value) {
      logContent.value.scrollTop = logContent.value.scrollHeight;
    }
  });
};

// 启动模拟监控
const startMonitoring = () => {
  monitorInterval = window.setInterval(() => {
    if (isRunning.value) {
      updateMetrics();
    }
  }, 2000);
};

// 更新指标数据
const updateMetrics = () => {
  // 模拟获取CPU和内存使用率
  const newCpuUsage = Math.floor(Math.random() * 100);
  const newMemoryUsage = Math.floor(Math.random() * 100);

  // 触发值变化的动画效果
  isChangingCpu.value = true;
  isChangingMem.value = true;

  // 更新值
  animateValue(cpuUsage, newCpuUsage);
  animateValue(memoryUsage, newMemoryUsage);

  // 动画完成后移除类
  setTimeout(() => {
    isChangingCpu.value = false;
    isChangingMem.value = false;
  }, 150);
};

// 开始日志模拟
const startLogSimulation = () => {
  // 停止之前的模拟
  if (logInterval) {
    clearInterval(logInterval);
  }

  // 每2-4秒随机添加一条日志
  logInterval = window.setInterval(() => {
    if (isRunning.value) {
      const randomLog =
        logMessages[Math.floor(Math.random() * logMessages.length)];
      addLogEntry(randomLog.type, randomLog.message);
    }
  }, Math.random() * 2000 + 2000);
};

// 数值平滑过渡动画
const animateValue = (
  target: { value: number },
  endValue: number,
  duration = 800
) => {
  const startValue = target.value;
  const startTime = Date.now();

  const updateValue = () => {
    const currentTime = Date.now();
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    target.value = Math.floor(startValue + progress * (endValue - startValue));

    if (progress < 1) {
      requestAnimationFrame(updateValue);
    }
  };

  requestAnimationFrame(updateValue);
};

// 生命周期钩子
onMounted(() => {
  // 初始化
  addLogEntry("info", "服务已在运行中");
  startMonitoring();
});

onBeforeUnmount(() => {
  // 清除定时器
  if (monitorInterval) clearInterval(monitorInterval);
  if (logInterval) clearInterval(logInterval);
});

// 监听日志面板状态，确保在关闭时清除定时器
watch(isViewingLogs, (newValue) => {
  if (!newValue && logInterval) {
    clearInterval(logInterval);
    logInterval = null;
  }
});
</script>
