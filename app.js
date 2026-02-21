// ==================== 全局状态管理 ====================
const STATE = {
  isLoggedIn: false,
  openedDays: {}, // { "2025-01-29": { gift: {...}, timestamp: ... } }
  usedExclusiveGifts: [], // 已使用的贵重礼物ID
  emptyCount: 0, // 连续空礼物计数（保底机制）
  expiredDays: {}, // 过期的日期 { "2025-01-29": true }
  unlockChances: 0 // 解锁过期礼物的机会次数
};

// ==================== 工具函数 ====================

// Base64解码密码
function decodePassword(encoded) {
  return atob(encoded.replace(/\s/g, ''));
}

// 获取今天的日期字符串 (YYYY-MM-DD)
function getTodayString() {
  const today = new Date();
  return formatDate(today);
}

// 格式化日期为 YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 计算两个日期之间的天数差
function daysBetween(date1Str, date2Str) {
  const d1 = new Date(date1Str);
  const d2 = new Date(date2Str);
  const diffTime = d2 - d1;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 从CloudBase和localStorage加载状态
async function loadState() {
  // 先从localStorage加载（作为备份）
  const saved = localStorage.getItem('giftCalendarState');
  if (saved) {
    const parsed = JSON.parse(saved);
    STATE.openedDays = parsed.openedDays || {};
    STATE.usedExclusiveGifts = parsed.usedExclusiveGifts || [];
    STATE.emptyCount = parsed.emptyCount || 0;
    STATE.expiredDays = parsed.expiredDays || {};
    STATE.unlockChances = parsed.unlockChances || 0;
  }

  // 尝试从CloudBase加载（优先使用云端数据）
  try {
    const cloudData = await CloudSync.loadState();
    if (cloudData) {
      STATE.openedDays = cloudData.openedDays || {};
      STATE.usedExclusiveGifts = cloudData.usedExclusiveGifts || [];
      STATE.emptyCount = cloudData.emptyCount || 0;
      STATE.expiredDays = cloudData.expiredDays || {};
      STATE.unlockChances = cloudData.unlockChances || 0;
      console.log('✅ 已从云端加载数据');
    }
  } catch (error) {
    console.warn('⚠️ 云端加载失败，使用本地数据', error);
  }
}

// 保存状态到CloudBase和localStorage
async function saveState() {
  const stateData = {
    openedDays: STATE.openedDays,
    usedExclusiveGifts: STATE.usedExclusiveGifts,
    emptyCount: STATE.emptyCount,
    expiredDays: STATE.expiredDays,
    unlockChances: STATE.unlockChances
  };

  // 保存到localStorage（作为备份）
  localStorage.setItem('giftCalendarState', JSON.stringify(stateData));

  // 保存到CloudBase
  try {
    await CloudSync.saveState(STATE);
    console.log('✅ 已同步到云端');
  } catch (error) {
    console.warn('⚠️ 云端同步失败', error);
  }
}

// ==================== 登录模块 ====================

function initLogin() {
  const loginBtn = document.getElementById('loginBtn');
  const passwordInput = document.getElementById('passwordInput');
  const loginError = document.getElementById('loginError');

  loginBtn.addEventListener('click', handleLogin);
  passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
}

async function handleLogin() {
  const passwordInput = document.getElementById('passwordInput');
  const loginError = document.getElementById('loginError');
  const loginBox = document.querySelector('.login-box');

  const inputPassword = passwordInput.value.trim();
  const correctPassword = decodePassword(CONFIG.passwordHash);

  console.log('输入的密码:', inputPassword);
  console.log('正确的密码:', correctPassword);
  console.log('密码匹配:', inputPassword === correctPassword);

  if (inputPassword === correctPassword) {
    // 初始化CloudSync
    await CloudSync.initUser(inputPassword);

    STATE.isLoggedIn = true;
    showScreen('calendarScreen');
    await initCalendar();
  } else {
    loginError.textContent = '🎅 圣诞老人摇了摇头...暗号不对哦！';
    loginBox.classList.add('shake');
    setTimeout(() => loginBox.classList.remove('shake'), 500);
  }
}

// ==================== 日历模块 ====================

async function initCalendar() {
  await loadState();
  markExpiredDays(); // 标记过期日期
  renderCalendar();
  updateSidebar(); // 更新侧边栏

  const logoutBtn = document.getElementById('logoutBtn');
  logoutBtn.addEventListener('click', () => {
    STATE.isLoggedIn = false;
    showScreen('loginScreen');
  });

  // 移动端侧边栏关闭按钮
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const sidebar = document.getElementById('sidebar');

  closeSidebarBtn.addEventListener('click', () => {
    sidebar.classList.remove('active');
  });

  // 管理员快捷键：Ctrl+Shift+R 打开记录面板
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
      e.preventDefault();
      showRecordModal();
    }
  });

  // 启动小兔子
  startBunnySpawner();
}

// 标记过期日期
function markExpiredDays() {
  const today = new Date(getTodayString());
  const startDate = new Date(CONFIG.startDate);

  // 遍历从开始日期到昨天的所有日期
  let currentDate = new Date(startDate);
  while (currentDate < today) {
    const dateStr = formatDate(currentDate);

    // 如果这一天没有开启，标记为过期
    if (!STATE.openedDays[dateStr]) {
      STATE.expiredDays[dateStr] = true;
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  saveState();
}

function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  const startDate = new Date(CONFIG.startDate);
  const today = new Date(getTodayString());
  const endDate = new Date('2026-12-25');

  // 按月份组织日期
  const monthsData = {};
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    // 使用补零的月份作为key，确保正确排序
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;

    if (!monthsData[monthKey]) {
      monthsData[monthKey] = {
        year: year,
        month: month,
        dates: []
      };
    }

    monthsData[monthKey].dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // 渲染每个月
  Object.keys(monthsData).sort().forEach(monthKey => {
    const monthData = monthsData[monthKey];
    const monthContainer = createMonthContainer(monthData, today);
    grid.appendChild(monthContainer);
  });
}

function createMonthContainer(monthData, today) {
  const container = document.createElement('div');
  container.className = 'month-container';

  // 月份标题
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
                      '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const monthTitle = document.createElement('div');
  monthTitle.className = 'month-title';
  monthTitle.textContent = `${monthData.year}年 ${monthNames[monthData.month]}`;
  container.appendChild(monthTitle);

  // 星期标题
  const weekHeader = document.createElement('div');
  weekHeader.className = 'week-header';
  const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  weekDays.forEach(day => {
    const dayLabel = document.createElement('div');
    dayLabel.className = 'week-day-label';
    dayLabel.textContent = day;
    weekHeader.appendChild(dayLabel);
  });
  container.appendChild(weekHeader);

  // 日期网格
  const daysGrid = document.createElement('div');
  daysGrid.className = 'days-grid';

  // 获取月份第一天是星期几（0=周日，1=周一...）
  const firstDate = monthData.dates[0];
  let firstDayOfWeek = firstDate.getDay();
  // 转换为周一开始（0=周一，6=周日）
  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  // 添加空白格子
  for (let i = 0; i < firstDayOfWeek; i++) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'calendar-day empty';
    daysGrid.appendChild(emptyDiv);
  }

  // 添加日期格子
  monthData.dates.forEach(date => {
    const dateStr = formatDate(date);
    const dayElement = createDayElement(dateStr, date, today);
    daysGrid.appendChild(dayElement);
  });

  container.appendChild(daysGrid);
  return container;
}

function createDayElement(dateStr, date, today) {
  const div = document.createElement('div');
  div.className = 'calendar-day';
  div.setAttribute('data-date', dateStr); // 添加日期属性

  const dayNumber = date.getDate();
  const monthNumber = date.getMonth() + 1;

  const isOpened = STATE.openedDays[dateStr];
  const isExpired = STATE.expiredDays[dateStr];
  const isToday = dateStr === getTodayString();
  const isPast = date < today;
  const isFuture = date > today;

  // 设置状态
  if (isOpened) {
    div.classList.add('opened');
  } else if (isExpired) {
    div.classList.add('expired');
  } else if (isToday || isPast) {
    div.classList.add('available');
  } else {
    div.classList.add('locked');
  }

  // 内容
  let icon = '🎁';
  let status = '点击开启';

  if (isOpened) {
    icon = '✅';
    status = '已开启';
  } else if (isExpired) {
    icon = '⏰';
    status = '已过期';
  } else if (isFuture) {
    icon = '🔒';
    status = '未解锁';
  }

  div.innerHTML = `
    <div class="day-number">${monthNumber}/${dayNumber}</div>
    <div class="day-icon">${icon}</div>
    <div class="day-status">${status}</div>
  `;

  // 点击事件
  div.addEventListener('click', () => handleDayClick(dateStr, div));

  return div;
}

// ==================== 礼物逻辑 ====================

function handleDayClick(dateStr, element) {
  const date = new Date(dateStr);
  const today = new Date(getTodayString());

  // 检查是否已开启
  if (STATE.openedDays[dateStr]) {
    showGift(STATE.openedDays[dateStr].gift);
    return;
  }

  // 检查是否已过期
  if (STATE.expiredDays[dateStr]) {
    alert('⏰ 这个礼物已经过期了，无法开启！');
    return;
  }

  // 检查是否可以开启
  if (date > today) {
    alert('🎅 还没到时间哦，再等等吧！');
    return;
  }

  // 获取礼物
  const gift = getGiftForDate(dateStr);

  // 保存状态
  STATE.openedDays[dateStr] = {
    gift: gift,
    timestamp: Date.now()
  };
  saveState();

  // 更新UI
  element.classList.remove('available');
  element.classList.add('opened');
  element.querySelector('.day-icon').textContent = '✅';
  element.querySelector('.day-status').textContent = '已开启';

  // 显示礼物
  showGift(gift);

  // 只有非空礼物才触发彩带纸屑
  if (!gift.isEmpty) {
    triggerConfetti();
  }

  // 更新侧边栏
  updateSidebar();
}

function getGiftForDate(dateStr) {
  // 1. 检查是否是特殊日期（特殊日期不计入保底机制）
  if (CONFIG.specialDays[dateStr]) {
    const special = CONFIG.specialDays[dateStr];
    const exclusiveGift = CONFIG.exclusiveGifts.find(g => g.id === special.giftId);

    if (exclusiveGift) {
      STATE.usedExclusiveGifts.push(exclusiveGift.id);
      return {
        title: special.title,
        message: special.message,
        content: exclusiveGift.content,
        image: exclusiveGift.image,
        isExclusive: true,
        isEmpty: false
      };
    }
  }

  // 2. 保底机制：连续6次空礼物后，第7次必中
  const isGuaranteed = STATE.emptyCount >= 6;

  // 3. 判断是否抽中礼物
  const random = Math.random();
  const shouldGetGift = isGuaranteed || random < 0.1; // 保底或10%概率

  if (shouldGetGift) {
    // 重置空礼物计数
    STATE.emptyCount = 0;

    // 优先从贵重礼物池抽取
    const availableExclusive = CONFIG.exclusiveGifts.filter(
      g => !STATE.usedExclusiveGifts.includes(g.id)
    );

    if (availableExclusive.length > 0 && Math.random() < 0.3) {
      // 30%概率抽取贵重礼物
      const gift = availableExclusive[Math.floor(Math.random() * availableExclusive.length)];
      STATE.usedExclusiveGifts.push(gift.id);

      return {
        title: isGuaranteed ? '🎊 保底触发！' : '🎉 恭喜抽中贵重礼物！',
        message: gift.name,
        content: gift.content,
        image: gift.image,
        isExclusive: true,
        isEmpty: false
      };
    }

    // 普通礼物
    const commonGift = CONFIG.commonGifts[Math.floor(Math.random() * CONFIG.commonGifts.length)];
    return {
      title: isGuaranteed ? '🎊 保底触发！' : '🎁 今日礼物',
      message: '',
      content: commonGift.content,
      image: commonGift.image,
      isExclusive: false,
      isEmpty: false
    };
  } else {
    // 空礼物
    STATE.emptyCount++;

    return {
      title: '💨 今天运气不太好',
      message: `已经连续${STATE.emptyCount}次空了，再坚持${7 - STATE.emptyCount}次就保底啦！`,
      content: '什么都没有抽到...',
      image: '📦',
      isExclusive: false,
      isEmpty: true
    };
  }
}

// ==================== UI交互 ====================

function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

// 更新侧边栏
function updateSidebar() {
  const openedDates = Object.keys(STATE.openedDays).sort().reverse();
  const exclusiveCount = STATE.usedExclusiveGifts.length;

  // 更新统计数据
  document.getElementById('sidebarOpenedCount').textContent = openedDates.length;
  document.getElementById('sidebarExclusiveCount').textContent = exclusiveCount;
  document.getElementById('sidebarPityCount').textContent = `${STATE.emptyCount}/7`;
  document.getElementById('sidebarUnlockChances').textContent = STATE.unlockChances;

  // 更新礼物列表
  const giftList = document.getElementById('sidebarGiftList');
  giftList.innerHTML = '';

  if (openedDates.length === 0) {
    giftList.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">还没有开启任何礼物哦</div>';
    return;
  }

  openedDates.forEach(dateStr => {
    const record = STATE.openedDays[dateStr];
    const gift = record.gift;

    const itemDiv = document.createElement('div');
    itemDiv.className = 'sidebar-gift-item';

    if (gift.isEmpty) {
      itemDiv.classList.add('empty');
    } else if (gift.isExclusive) {
      itemDiv.classList.add('exclusive');
    }

    const date = new Date(dateStr);
    const dateDisplay = `${date.getMonth() + 1}月${date.getDate()}日`;

    itemDiv.innerHTML = `
      <div class="sidebar-gift-date">${dateDisplay}</div>
      <div class="sidebar-gift-content">
        <div class="sidebar-gift-icon">${gift.image}</div>
        <div class="sidebar-gift-text">
          <div class="sidebar-gift-title">${gift.title}</div>
          <div class="sidebar-gift-message">${gift.content}</div>
        </div>
      </div>
    `;

    giftList.appendChild(itemDiv);
  });
}

function showGift(gift) {
  const modal = document.getElementById('giftModal');
  const giftIcon = document.getElementById('giftIcon');
  const giftTitle = document.getElementById('giftTitle');
  const giftMessage = document.getElementById('giftMessage');

  giftIcon.textContent = gift.image;
  giftTitle.textContent = gift.title;
  giftMessage.textContent = gift.content + (gift.message ? '\n' + gift.message : '');

  modal.classList.add('active');

  // 关闭按钮
  const closeBtn = modal.querySelector('.close-btn');
  closeBtn.onclick = () => modal.classList.remove('active');

  modal.onclick = (e) => {
    if (e.target === modal) modal.classList.remove('active');
  };
}

function showRecordModal() {
  const modal = document.getElementById('recordModal');
  const recordList = document.getElementById('recordList');
  const openedCountEl = document.getElementById('openedCount');
  const emptyCountDisplayEl = document.getElementById('emptyCountDisplay');
  const exclusiveCountEl = document.getElementById('exclusiveCount');

  // 统计数据
  const openedDates = Object.keys(STATE.openedDays).sort();
  const exclusiveCount = STATE.usedExclusiveGifts.length;

  openedCountEl.textContent = openedDates.length;
  emptyCountDisplayEl.textContent = `${STATE.emptyCount}/7`;
  exclusiveCountEl.textContent = exclusiveCount;

  // 生成记录列表
  recordList.innerHTML = '';

  if (openedDates.length === 0) {
    recordList.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">还没有开启任何礼物哦</p>';
  } else {
    openedDates.reverse().forEach(dateStr => {
      const record = STATE.openedDays[dateStr];
      const gift = record.gift;

      const itemDiv = document.createElement('div');
      itemDiv.className = 'record-item';

      if (gift.isEmpty) {
        itemDiv.classList.add('empty');
      } else if (gift.isExclusive) {
        itemDiv.classList.add('exclusive');
      }

      const date = new Date(dateStr);
      const dateDisplay = `${date.getMonth() + 1}月${date.getDate()}日`;

      itemDiv.innerHTML = `
        <div class="record-date">${dateDisplay}</div>
        <div class="record-gift">
          <div class="record-icon">${gift.image}</div>
          <div class="record-content">
            <div class="record-title">${gift.title}</div>
            <div class="record-message">${gift.content}</div>
            ${gift.message ? `<div class="record-message">${gift.message}</div>` : ''}
          </div>
        </div>
      `;

      recordList.appendChild(itemDiv);
    });
  }

  modal.classList.add('active');

  // 关闭按钮
  const closeBtn = modal.querySelector('.close-btn');
  closeBtn.onclick = () => modal.classList.remove('active');

  modal.onclick = (e) => {
    if (e.target === modal) modal.classList.remove('active');
  };
}

// ==================== 动画效果 ====================

// 雪花动画
function initSnowfall() {
  const canvas = document.getElementById('snowCanvas');
  const ctx = canvas.getContext('2d');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const snowflakes = [];
  const snowflakeCount = 100;

  for (let i = 0; i < snowflakeCount; i++) {
    snowflakes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 3 + 1,
      speed: Math.random() * 1 + 0.5,
      drift: Math.random() * 0.5 - 0.25
    });
  }

  function animateSnow() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

    snowflakes.forEach(flake => {
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
      ctx.fill();

      flake.y += flake.speed;
      flake.x += flake.drift;

      if (flake.y > canvas.height) {
        flake.y = 0;
        flake.x = Math.random() * canvas.width;
      }
    });

    requestAnimationFrame(animateSnow);
  }

  animateSnow();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// 彩带纸屑动画
function triggerConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  const ctx = canvas.getContext('2d');

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const particleCount = 150;
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe'];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10 - 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10
    });
  }

  function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((p, index) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.3; // 重力
      p.rotation += p.rotationSpeed;

      if (p.y > canvas.height) {
        particles.splice(index, 1);
      }
    });

    if (particles.length > 0) {
      requestAnimationFrame(animateConfetti);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  animateConfetti();
}

// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', () => {
  initSnowfall();
  initLogin();
});

// ==================== 管理员工具（控制台使用）====================

// 暴露管理员函数到全局
window.adminPanel = {
  // 查看记录
  showRecords: () => {
    if (STATE.isLoggedIn) {
      showRecordModal();
    } else {
      console.log('请先登录');
    }
  },

  // 清空所有记录
  clearAll: () => {
    if (confirm('确定要清空所有记录吗？')) {
      STATE.openedDays = {};
      STATE.usedExclusiveGifts = [];
      STATE.emptyCount = 0;
      saveState();
      console.log('已清空所有记录');
      if (STATE.isLoggedIn) {
        renderCalendar();
      }
    }
  },

  // 查看当前状态
  getState: () => {
    console.log('当前状态：', {
      已开启天数: Object.keys(STATE.openedDays).length,
      保底进度: `${STATE.emptyCount}/7`,
      已用贵重礼物: STATE.usedExclusiveGifts,
      详细记录: STATE.openedDays
    });
    return STATE;
  },

  // 重置保底计数
  resetPity: () => {
    STATE.emptyCount = 0;
    saveState();
    console.log('已重置保底计数');
  },

  // 预生成未来N天的礼物
  pregenerate: (days = 30) => {
    const today = new Date(getTodayString());
    const results = [];

    console.log(`开始预生成未来${days}天的礼物...`);

    for (let i = 0; i < days; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      const dateStr = formatDate(futureDate);

      // 跳过已经开启的日期
      if (STATE.openedDays[dateStr]) {
        results.push({
          date: dateStr,
          status: '已开启',
          gift: STATE.openedDays[dateStr].gift
        });
        continue;
      }

      // 生成礼物
      const gift = getGiftForDate(dateStr);

      // 保存到状态
      STATE.openedDays[dateStr] = {
        gift: gift,
        timestamp: Date.now(),
        pregenerated: true // 标记为预生成
      };

      results.push({
        date: dateStr,
        status: '新生成',
        gift: gift
      });
    }

    saveState();

    // 格式化输出
    console.log('\n=== 预生成结果 ===\n');
    results.forEach(r => {
      const date = new Date(r.date);
      const dateDisplay = `${date.getMonth() + 1}月${date.getDate()}日`;
      const giftType = r.gift.isEmpty ? '❌ 空' : (r.gift.isExclusive ? '⭐ 贵重' : '🎁 普通');
      console.log(`${dateDisplay} [${r.status}] ${giftType} - ${r.gift.content}`);
    });

    console.log(`\n当前保底进度: ${STATE.emptyCount}/7`);
    console.log(`已用贵重礼物: ${STATE.usedExclusiveGifts.length}/${CONFIG.exclusiveGifts.length}`);

    if (STATE.isLoggedIn) {
      renderCalendar();
    }

    return results;
  },

  // 查看未来N天的礼物（不保存）
  preview: (days = 30) => {
    const today = new Date(getTodayString());
    const results = [];

    // 备份当前状态
    const backupEmptyCount = STATE.emptyCount;
    const backupUsedGifts = [...STATE.usedExclusiveGifts];

    console.log(`预览未来${days}天的礼物（不会保存）...`);

    for (let i = 0; i < days; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      const dateStr = formatDate(futureDate);

      // 如果已经开启，显示已有结果
      if (STATE.openedDays[dateStr]) {
        results.push({
          date: dateStr,
          gift: STATE.openedDays[dateStr].gift
        });
        continue;
      }

      // 模拟生成礼物
      const gift = getGiftForDate(dateStr);
      results.push({
        date: dateStr,
        gift: gift
      });
    }

    // 恢复状态
    STATE.emptyCount = backupEmptyCount;
    STATE.usedExclusiveGifts = backupUsedGifts;

    // 格式化输出
    console.log('\n=== 预览结果（未保存）===\n');
    results.forEach(r => {
      const date = new Date(r.date);
      const dateDisplay = `${date.getMonth() + 1}月${date.getDate()}日`;
      const giftType = r.gift.isEmpty ? '❌ 空' : (r.gift.isExclusive ? '⭐ 贵重' : '🎁 普通');
      const status = STATE.openedDays[r.date] ? '[已开启]' : '[未开启]';
      console.log(`${dateDisplay} ${status} ${giftType} - ${r.gift.content}`);
    });

    return results;
  },

  // 帮助信息
  help: () => {
    console.log(`
管理员工具使用说明：
- adminPanel.showRecords()       : 打开记录面板（或按 Ctrl+Shift+R）
- adminPanel.getState()           : 查看当前状态
- adminPanel.pregenerate(30)      : 预生成未来30天的礼物（会保存）
- adminPanel.preview(30)          : 预览未来30天的礼物（不保存）
- adminPanel.restore("2025-02-17"): 恢复指定日期的过期礼物
- adminPanel.listExpired()        : 查看所有过期日期
- adminPanel.clearAll()           : 清空所有记录
- adminPanel.resetPity()          : 重置保底计数
- adminPanel.help()               : 显示此帮助信息
    `);
  },

  // 恢复过期日期
  restore: (dateStr) => {
    if (!dateStr) {
      console.log('请提供日期，格式：YYYY-MM-DD，例如：adminPanel.restore("2025-02-17")');
      return;
    }

    if (!STATE.expiredDays[dateStr]) {
      console.log(`${dateStr} 没有过期，无需恢复`);
      return;
    }

    delete STATE.expiredDays[dateStr];
    saveState();

    const date = new Date(dateStr);
    const dateDisplay = `${date.getMonth() + 1}月${date.getDate()}日`;
    console.log(`✅ 已恢复 ${dateDisplay} (${dateStr})，用户现在可以开启这个礼物了`);

    if (STATE.isLoggedIn) {
      renderCalendar();
    }
  },

  // 查看所有过期日期
  listExpired: () => {
    const expiredDates = Object.keys(STATE.expiredDays).sort();

    if (expiredDates.length === 0) {
      console.log('没有过期的日期');
      return;
    }

    console.log('\n=== 过期日期列表 ===\n');
    expiredDates.forEach(dateStr => {
      const date = new Date(dateStr);
      const dateDisplay = `${date.getMonth() + 1}月${date.getDate()}日`;
      console.log(`⏰ ${dateDisplay} (${dateStr})`);
    });

    console.log(`\n共 ${expiredDates.length} 个过期日期`);
    console.log('使用 adminPanel.restore("日期") 来恢复');

    return expiredDates;
  }
};

// 在控制台显示提示
console.log('%c🎄 管理员工具已加载', 'color: #0f4c3a; font-size: 16px; font-weight: bold;');
console.log('%c输入 adminPanel.help() 查看可用命令', 'color: #666; font-size: 12px;');
console.log('%c或按 Ctrl+Shift+R 打开记录面板', 'color: #666; font-size: 12px;');

// ==================== 小兔子功能 ====================

function startBunnySpawner() {
  const bunny = document.getElementById('bunny');
  let currentBunnyType = null; // 'running' 或 'dancing'
  let checkInterval = null;

  function checkAndSpawnBunny() {
    // 只在登录后才出现小兔子
    if (!STATE.isLoggedIn) return;

    // 找到所有过期的日期格子
    const expiredDates = Object.keys(STATE.expiredDays);
    if (expiredDates.length === 0) {
      // 没有过期日期，30秒后再检查
      return;
    }

    // 100%概率出现小兔子（调试模式）
    // if (Math.random() > 0.1) {
    //   return;
    // }

    // 决定兔子类型：90%奔跑，10%跳舞
    const isDancing = Math.random() < 0.1;
    currentBunnyType = isDancing ? 'dancing' : 'running';

    // 随机选择屏幕上的位置
    const maxY = window.innerHeight - 100;
    const randomY = Math.random() * maxY;

    // 将小兔子放到body上，而不是格子上
    document.body.appendChild(bunny);

    // 设置位置
    bunny.style.top = randomY + 'px';

    if (isDancing) {
      // 跳舞的兔子：随机出现在屏幕中间某个位置
      const maxX = window.innerWidth - 100;
      const randomX = Math.random() * maxX;
      bunny.style.left = randomX + 'px';
    } else {
      // 奔跑的兔子：从屏幕左侧开始
      bunny.style.left = '-100px';
    }

    // 添加动画类型
    bunny.classList.remove('running', 'dancing');
    bunny.classList.add('active', currentBunnyType);

    // 5秒后自动消失
    setTimeout(() => {
      if (bunny.classList.contains('active')) {
        bunny.classList.remove('active', 'running', 'dancing');
      }
    }, 5000);
  }

  // 点击小兔子
  bunny.addEventListener('click', (e) => {
    e.stopPropagation(); // 防止触发格子的点击事件

    if (!bunny.classList.contains('active')) return;

    // 播放捕获动画
    bunny.classList.remove('active', 'running', 'dancing');
    bunny.classList.add('caught');

    // 根据兔子类型增加解锁机会
    const isDancing = currentBunnyType === 'dancing';
    const chances = isDancing ? 2 : 1;
    STATE.unlockChances += chances;

    saveState();
    updateSidebar();

    // 显示提示
    showBunnyReward(isDancing);

    // 动画结束后重置
    setTimeout(() => {
      bunny.classList.remove('caught');
    }, 500);
  });

  // 每30秒检查一次是否出现小兔子
  checkInterval = setInterval(checkAndSpawnBunny, 30000);

  // 立即检查一次（测试用）
  setTimeout(checkAndSpawnBunny, 2000);
}

function showBunnyReward(isDancing) {
  // 创建临时提示元素
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 215, 0, 0.95);
    color: #333;
    padding: 30px 50px;
    border-radius: 20px;
    font-size: 1.5em;
    font-weight: bold;
    z-index: 10000;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    animation: bounceIn 0.5s;
    text-align: center;
  `;

  const chances = isDancing ? 2 : 1;
  const bunnyType = isDancing ? '💃 扭屁股兔子' : '🏃 奔跑兔子';

  notification.innerHTML = `
    🐰 抓到${bunnyType}！<br>
    <span style="font-size: 0.8em; color: #666;">获得${chances}次解锁机会</span>
  `;

  document.body.appendChild(notification);

  // 2秒后移除
  setTimeout(() => {
    notification.style.animation = 'fadeOut 0.5s';
    setTimeout(() => notification.remove(), 500);
  }, 2000);
}

// 修改handleDayClick，支持使用解锁机会
const originalHandleDayClick = handleDayClick;
function handleDayClick(dateStr, element) {
  const date = new Date(dateStr);
  const today = new Date(getTodayString());

  // 检查是否已开启
  if (STATE.openedDays[dateStr]) {
    showGift(STATE.openedDays[dateStr].gift);
    return;
  }

  // 检查是否已过期
  if (STATE.expiredDays[dateStr]) {
    // 如果有解锁机会，询问是否使用
    if (STATE.unlockChances > 0) {
      if (confirm(`这个礼物已经过期了。\n\n你有 ${STATE.unlockChances} 次解锁机会，是否使用一次来解锁这个礼物？`)) {
        // 使用解锁机会
        STATE.unlockChances--;
        delete STATE.expiredDays[dateStr];
        saveState();
        updateSidebar();
        renderCalendar();
        alert('✨ 解锁成功！现在可以开启这个礼物了。');
        return;
      }
    } else {
      alert('⏰ 这个礼物已经过期了，无法开启！\n\n💡 提示：抓住页面上随机出现的小兔子🐰可以获得解锁机会哦！');
    }
    return;
  }

  // 检查是否可以开启
  if (date > today) {
    alert('🎅 还没到时间哦，再等等吧！');
    return;
  }

  // 获取礼物
  const gift = getGiftForDate(dateStr);

  // 保存状态
  STATE.openedDays[dateStr] = {
    gift: gift,
    timestamp: Date.now()
  };
  saveState();

  // 更新UI
  element.classList.remove('available');
  element.classList.add('opened');
  element.querySelector('.day-icon').textContent = '✅';
  element.querySelector('.day-status').textContent = '已开启';

  // 显示礼物
  showGift(gift);

  // 只有非空礼物才触发彩带纸屑
  if (!gift.isEmpty) {
    triggerConfetti();
  }

  // 更新侧边栏
  updateSidebar();
}

