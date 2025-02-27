class Monitor {
  constructor() {
    this.cpuProgress = document.getElementById("cpuProgress");
    this.memoryProgress = document.getElementById("memoryProgress");
    this.cpuValue = document.getElementById("cpuValue");
    this.memValue = document.getElementById("memValue");
    this.serviceStatus = document.getElementById("serviceStatus");
    this.toggleServiceBtn = document.getElementById("toggleService");
    this.logBtn = document.getElementById("logBtn");
    this.logPanel = document.getElementById("logPanel");
    this.logContent = document.getElementById("logContent");
    this.closeLogBtn = document.getElementById("closeLogBtn");

    this.isRunning = true;
    this.isViewingLogs = false;
    this.logInterval = null;

    // 保存上一次的CPU和内存值，用于动画
    this.lastCpuValue = 0;
    this.lastMemValue = 0;

    // 模拟日志数据
    this.logMessages = [
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

    this.init();
  }

  init() {
    this.updateStatus();
    this.setupEventListeners();
    this.startMonitoring();

    // 添加初始状态的日志
    if (this.isRunning) {
      this.addLogEntry("info", "服务已在运行中");
    }
  }

  setupEventListeners() {
    // 服务状态切换 - 确保按钮元素存在
    if (this.toggleServiceBtn) {
      this.toggleServiceBtn.addEventListener("click", () => {
        console.log("服务切换按钮被点击");
        this.toggleService();
      });
    } else {
      console.error("未找到服务切换按钮");
    }

    // 日志查看
    this.logBtn.addEventListener("click", () => this.viewLogs());
    this.closeLogBtn.addEventListener("click", () => this.closeLogs());
  }

  updateStatus() {
    const statusCircle = this.serviceStatus.querySelector(
      ".circular-progress-status"
    );
    const statusText = this.serviceStatus.querySelector(".status-text");
    const statusIcon = statusCircle.querySelector("i");

    if (this.isRunning) {
      statusCircle.classList.add("active");
      statusCircle.classList.remove("inactive");
      statusText.textContent = "运行中";
      statusIcon.style.color = "var(--success)";
    } else {
      statusCircle.classList.remove("active");
      statusCircle.classList.add("inactive");
      statusText.textContent = "已停止";
      statusIcon.style.color = "var(--danger)";
    }
  }

  startMonitoring() {
    setInterval(() => {
      if (this.isRunning) {
        this.updateMetrics();
      }
    }, 2000);
  }

  updateMetrics() {
    // 模拟获取CPU和内存使用率
    const cpuUsage = Math.floor(Math.random() * 100);
    const memoryUsage = Math.floor(Math.random() * 100);

    // 使用平滑动画更新数值
    this.animateProgress(
      this.cpuProgress,
      this.cpuValue,
      this.lastCpuValue,
      cpuUsage
    );
    this.animateProgress(
      this.memoryProgress,
      this.memValue,
      this.lastMemValue,
      memoryUsage
    );

    // 保存当前值用于下次比较
    this.lastCpuValue = cpuUsage;
    this.lastMemValue = memoryUsage;
  }

  // 平滑动画过渡到新值
  animateProgress(progressElement, valueElement, fromValue, toValue) {
    // 添加一个微小的缩放动画效果用于数值显示
    valueElement.classList.add("changing");

    // 计算角度值（360度对应100%）
    const angle = (toValue / 100) * 360;

    // 更新圆环的进度角度 - 使用CSS变量实现平滑过渡
    const circle = progressElement.querySelector(".circular-progress-circle");
    circle.style.setProperty("--progress-angle", `${angle}deg`);

    // 平滑更新数值显示
    this.animateValue(valueElement, fromValue, toValue, 800);

    // 根据数值设置颜色警告
    setTimeout(() => {
      if (toValue > 80) {
        valueElement.style.color =
          toValue > 90 ? "var(--danger)" : "var(--warning)";
      } else {
        valueElement.style.color = "var(--text-primary)";
      }

      // 移除动画类
      valueElement.classList.remove("changing");
    }, 150);
  }

  // 数值平滑过渡动画
  animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const value = Math.floor(progress * (end - start) + start);
      element.textContent = `${value}%`;
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }

  toggleService() {
    console.log("切换服务状态", this.isRunning ? "停止" : "启动");
    this.isRunning = !this.isRunning;
    this.updateStatus();

    // 添加启动/停止日志
    if (this.isRunning) {
      this.addLogEntry("success", "服务已启动");
    } else {
      this.addLogEntry("warning", "服务已停止");
    }
  }

  viewLogs() {
    this.isViewingLogs = true;
    this.logPanel.classList.add("active");
    document.body.style.overflow = "hidden"; // 防止背景滚动

    // 添加初始日志条目
    if (this.logContent.children.length === 0) {
      this.addLogEntry("info", "正在载入日志数据...");
      // 模拟载入一些历史日志
      setTimeout(() => {
        this.addLogEntry("info", "====== 历史日志记录 ======");
        this.addLogEntry("info", "服务启动中...");
        this.addLogEntry("success", "服务已成功启动");
        this.addLogEntry("info", "监听端口: 27015");
        this.addLogEntry("info", "地图加载中: c5m1_waterfront");
        this.addLogEntry("success", "地图加载完成");
      }, 300);
    }

    // 启动模拟日志更新
    this.startLogSimulation();
  }

  closeLogs() {
    this.isViewingLogs = false;
    this.logPanel.classList.remove("active");
    document.body.style.overflow = "auto"; // 恢复滚动

    // 停止日志模拟
    if (this.logInterval) {
      clearInterval(this.logInterval);
      this.logInterval = null;
    }
  }

  startLogSimulation() {
    // 停止之前的模拟
    if (this.logInterval) {
      clearInterval(this.logInterval);
    }

    // 每2-4秒随机添加一条日志
    this.logInterval = setInterval(() => {
      if (this.isRunning) {
        const randomLog =
          this.logMessages[Math.floor(Math.random() * this.logMessages.length)];
        this.addLogEntry(randomLog.type, randomLog.message);
      }
    }, Math.random() * 2000 + 2000);
  }

  addLogEntry(type, message) {
    const now = new Date();
    const timestamp = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

    const logEntry = document.createElement("div");
    logEntry.className = "log-entry";
    logEntry.innerHTML = `
      <span class="timestamp">[${timestamp}]</span>
      <span class="log-type ${type}">${type.toUpperCase()}</span>
      <span class="log-message">${message}</span>
    `;

    this.logContent.appendChild(logEntry);

    // 简单直接的滚动到底部方法
    this.logContent.scrollTop = this.logContent.scrollHeight;

    // 限制日志条目数量，防止过多
    if (this.logContent.children.length > 500) {
      this.logContent.removeChild(this.logContent.children[0]);
    }
  }
}

// 等待DOM完全加载后初始化
document.addEventListener("DOMContentLoaded", () => {
  // 初始化监控
  const monitor = new Monitor();

  // 添加一些初始化日志
  console.log("监控面板已初始化");

  // 在控制台输出按钮状态，用于调试
  console.log("服务切换按钮:", document.getElementById("toggleService"));
});
