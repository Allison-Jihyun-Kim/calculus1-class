const PAGE_COUNT = 6;
let currentPage = 0;
const stepState = {};
let jumpProbe = 45;
let bisectionStage = 0;

function scaleStage() {
  const stage = document.getElementById('stage');
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const scale = Math.min(vw / 1920, vh / 1080);
  stage.style.transform = `scale(${scale})`;
  stage.style.transformOrigin = 'center center';
}
window.addEventListener('resize', scaleStage);

function initDots() {
  const dots = document.getElementById('pageDots');
  dots.innerHTML = '';
  for (let i = 0; i < PAGE_COUNT; i++) {
    const dot = document.createElement('button');
    dot.className = 'page-dot' + (i === currentPage ? ' active' : '');
    dot.addEventListener('click', () => goToPage(i));
    dots.appendChild(dot);
  }
}

function updateHeader() {
  const pages = [...document.querySelectorAll('.page')];
  const activePage = pages[currentPage];
  document.getElementById('pageTitle').textContent = activePage.dataset.title;
  document.getElementById('pageIndicator').textContent = `${currentPage + 1} / ${PAGE_COUNT}`;
  [...document.querySelectorAll('.page-dot')].forEach((dot, i) => dot.classList.toggle('active', i === currentPage));
  document.getElementById('prevPageBtn').disabled = currentPage === 0;
  document.getElementById('nextPageBtn').disabled = currentPage === PAGE_COUNT - 1;
  updateStepButtons();
}

function goToPage(index) {
  const pages = [...document.querySelectorAll('.page')];
  currentPage = Math.max(0, Math.min(index, pages.length - 1));
  pages.forEach((p, i) => p.classList.toggle('active', i === currentPage));
  updateHeader();
  refreshAllCanvases();
}
window.goToPage = goToPage;

function initTabs() {
  document.querySelectorAll('.tabs').forEach(tabWrap => {
    tabWrap.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        tabWrap.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const pageSection = btn.closest('.page');
        pageSection.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        const target = pageSection.querySelector(`#${btn.dataset.target}`);
        target.classList.add('active');
        const groupEl = getActiveStepGroup();
        if (groupEl) setGroupStep(groupEl, 0);
        updateStepButtons();
        refreshAllCanvases();
      });
    });
  });
}

function getActiveStepGroup() {
  const activePage = document.querySelector('.page.active');
  if (!activePage) return null;
  const groups = [...activePage.querySelectorAll('[data-step-group]')].filter(el => el.offsetParent !== null);
  if (!groups.length) return null;
  return groups[0];
}

function getGroupSteps(groupEl) {
  return [...groupEl.querySelectorAll('.step-card')];
}

function setGroupStep(groupEl, index) {
  if (!groupEl) return;
  const groupName = groupEl.dataset.stepGroup;
  const steps = getGroupSteps(groupEl);
  if (!steps.length) return;
  const stepIndex = Math.max(0, Math.min(index, steps.length - 1));
  stepState[groupName] = stepIndex;
  steps.forEach((card, i) => card.classList.toggle('active', i === stepIndex));
  updateStepButtons();
  refreshAllCanvases();
}

function changeStep(delta) {
  const groupEl = getActiveStepGroup();
  if (!groupEl) return;
  const steps = getGroupSteps(groupEl);
  const groupName = groupEl.dataset.stepGroup;
  const current = stepState[groupName] || 0;
  setGroupStep(groupEl, current + delta);
}

function updateStepButtons() {
  const groupEl = getActiveStepGroup();
  const prevBtn = document.getElementById('prevStepBtn');
  const nextBtn = document.getElementById('nextStepBtn');
  if (!groupEl) {
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }
  const groupName = groupEl.dataset.stepGroup;
  const steps = getGroupSteps(groupEl);
  const current = stepState[groupName] || 0;
  prevBtn.disabled = current <= 0;
  nextBtn.disabled = current >= steps.length - 1;
}

function normalize(str) {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[.,。！!？?]/g, '')
    .replace(/<=/g, '≤')
    .replace(/>=/g, '≥');
}

function isCorrectInput(value, answerStr) {
  const answers = answerStr.split('|').map(a => normalize(a));
  const v = normalize(value);
  if (!v) return false;

  for (const ans of answers) {
    const numA = Number(ans);
    const numV = Number(v);
    if (!Number.isNaN(numA) && !Number.isNaN(numV) && Math.abs(numA - numV) < 1e-6) return true;
    if (v === ans) return true;
  }
  return false;
}

function initChecks() {
  document.querySelectorAll('.check-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const scope = btn.closest('.step-card') || btn.closest('.panel-card');
      if (!scope) return;
      const inputs = scope.querySelectorAll('.answer-input');
      let correct = 0;
      inputs.forEach(inp => {
        const ans = inp.dataset.answer || '';
        const oldHint = inp.parentElement?.querySelector(`.correct-answer-hint[data-for="${inp.dataset.answerId || ''}"]`);
        if (oldHint) oldHint.remove();

        if (!inp.dataset.answerId) {
          inp.dataset.answerId = `answer-${Math.random().toString(36).slice(2, 10)}`;
        }
        const existingHint = inp.parentElement?.querySelector(`.correct-answer-hint[data-for="${inp.dataset.answerId}"]`);
        if (existingHint) existingHint.remove();

        if (isCorrectInput(inp.value, ans)) {
          inp.classList.add('correct');
          inp.classList.remove('wrong');
          correct++;
        } else {
          inp.classList.add('wrong');
          inp.classList.remove('correct');
          const hint = document.createElement('span');
          hint.className = 'correct-answer-hint';
          hint.dataset.for = inp.dataset.answerId;
          hint.textContent = `정답: ${ans.split('|')[0]}`;
          inp.insertAdjacentElement('afterend', hint);
        }
      });
      if (inputs.length) {
        const msg = document.createElement('div');
        msg.className = 'save-status';
        msg.textContent = `${correct} / ${inputs.length}개 정답`;
        const old = scope.querySelector('.save-status.inline-temp');
        if (old) old.remove();
        msg.classList.add('inline-temp');
        scope.appendChild(msg);
        setTimeout(() => msg.remove(), 2500);
      }
    });
  });
}

function saveAssignment(id) {
  const map = {
    assignment1: ['assignment1a', 'assignment1b'],
    assignment2: ['assignment2a', 'assignment2b']
  };
  const values = (map[id] || []).map(key => ({ key, value: document.getElementById(key).value }));
  localStorage.setItem(id, JSON.stringify(values));
  const status = document.getElementById(id + 'Status');
  if (status) status.textContent = '임시 저장되었습니다.';
}
window.saveAssignment = saveAssignment;

function loadAssignments() {
  ['assignment1', 'assignment2'].forEach(id => {
    const raw = localStorage.getItem(id);
    if (!raw) return;
    try {
      const arr = JSON.parse(raw);
      arr.forEach(item => {
        const el = document.getElementById(item.key);
        if (el) el.value = item.value;
      });
    } catch (e) {
      console.error(e);
    }
  });
}

function downloadAssignment(id) {
  saveAssignment(id);
  const titles = {
    assignment1: '과제 1 - 주차 요금 함수',
    assignment2: '과제 2 - 해발고도와 사잇값 정리'
  };
  const fields = {
    assignment1: [
      ['① 30<x<90에서 불연속점이 45, 60, 75인 이유 설명', document.getElementById('assignment1a').value],
      ['② 천장함수를 이용하여 주차 요금의 계단함수를 하나의 식으로 표현할 수 있는지 설명', document.getElementById('assignment1b').value]
    ],
    assignment2: [
      ['① h(t)가 연속인 이유 설명', document.getElementById('assignment2a').value],
      ['② 사잇값 정리로 같은 해발고도의 순간이 있었음을 설명', document.getElementById('assignment2b').value]
    ]
  };
  let text = `${titles[id]}\n\n`;
  fields[id].forEach(([title, value]) => {
    text += `${title}\n${value || '(미작성)'}\n\n`;
  });
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
window.downloadAssignment = downloadAssignment;

function parkingFee(x) {
  if (x <= 10) return 0;
  if (x <= 30) return 1200;
  return Math.min(24000, 1200 + 600 * Math.ceil((x - 30) / 15));
}
function feeLeftAt(boundary) {
  return parkingFee(boundary - 0.001);
}
function feeRightAt(boundary) {
  return parkingFee(boundary + 0.001);
}

function drawAxes(ctx, opts) {
  const { xMin, xMax, yMin, yMax, width, height, padding } = opts;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#fcfeff';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#d8e4f2';
  ctx.lineWidth = 1;
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#58718d';

  for (let i = 0; i <= 5; i++) {
    const y = padding.top + ((height - padding.top - padding.bottom) / 5) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();
    const value = Math.round(yMax - ((y - padding.top) / (height - padding.top - padding.bottom)) * (yMax - yMin));
    ctx.fillText(String(value), 8, y + 5);
  }

  const xTicks = 6;
  for (let i = 0; i <= xTicks; i++) {
    const x = padding.left + ((width - padding.left - padding.right) / xTicks) * i;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();
    const value = Math.round(xMin + (i / xTicks) * (xMax - xMin));
    ctx.fillText(String(value), x - 8, height - 10);
  }

  ctx.strokeStyle = '#8aa3c0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding.left, height - padding.bottom);
  ctx.lineTo(width - padding.right, height - padding.bottom);
  ctx.moveTo(padding.left, padding.top);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.stroke();

  const toX = x => padding.left + ((x - xMin) / (xMax - xMin)) * (width - padding.left - padding.right);
  const toY = y => height - padding.bottom - ((y - yMin) / (yMax - yMin)) * (height - padding.top - padding.bottom);
  return { toX, toY };
}

function drawParking(canvasId, currentX = 40, focusBoundary = null) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width, height = canvas.height;
  const xMin = focusBoundary ? focusBoundary - 18 : 0;
  const xMax = focusBoundary ? focusBoundary + 18 : 180;
  const yMax = focusBoundary ? 4200 : 7200;
  const { toX, toY } = drawAxes(ctx, { xMin, xMax, yMin: 0, yMax, width, height, padding: { left: 52, right: 20, top: 20, bottom: 38 } });

  // boundaries
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = '#8cc3a0';
  const bds = focusBoundary ? [focusBoundary] : [10, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180];
  bds.forEach(b => {
    if (b < xMin || b > xMax) return;
    ctx.beginPath();
    ctx.moveTo(toX(b), toY(0));
    ctx.lineTo(toX(b), toY(yMax));
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // step graph
  ctx.strokeStyle = '#2b78d0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  let prevX = xMin;
  let prevY = parkingFee(Math.max(1, xMin + 0.001));
  ctx.moveTo(toX(prevX), toY(prevY));
  for (let x = Math.ceil(xMin); x <= xMax; x++) {
    const y = parkingFee(Math.max(1, x));
    ctx.lineTo(toX(x), toY(prevY));
    if (y !== prevY) {
      ctx.lineTo(toX(x), toY(y));
      prevY = y;
    }
  }
  ctx.stroke();

  // current point
  const y = parkingFee(currentX);
  ctx.strokeStyle = '#ff9f43';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(toX(currentX), toY(0));
  ctx.lineTo(toX(currentX), toY(y));
  ctx.stroke();
  ctx.fillStyle = '#ff9f43';
  ctx.beginPath();
  ctx.arc(toX(currentX), toY(y), 7, 0, Math.PI * 2);
  ctx.fill();
}

function updateParkingUI(x) {
  document.getElementById('parkingSlider').value = x;
  document.getElementById('parkingX').textContent = x;
  document.getElementById('parkingFee').textContent = parkingFee(x);
  document.getElementById('parkingX2').textContent = x;
  document.getElementById('parkingFee2').textContent = parkingFee(x);
  drawParking('parkingCanvas', x);
  drawParking('parkingCanvas2', x);
}

function setParkingExample(x) {
  updateParkingUI(x);
}
window.setParkingExample = setParkingExample;

function setJumpProbe(boundary) {
  jumpProbe = boundary;
  document.getElementById('jumpTarget').textContent = boundary;
  document.getElementById('jumpLeft').textContent = feeLeftAt(boundary);
  document.getElementById('jumpRight').textContent = feeRightAt(boundary);
  drawParking('jumpCanvas', boundary + 0.1, boundary);
}
window.setJumpProbe = setJumpProbe;

function fMountain(t) {
  return 100 + 180 * (t - 7);
}
function gMountain(t) {
  if (t <= 9.5) return 500 + 200 * (t - 7);
  return 1000 - 80 * (t - 9.5);
}
function hMountain(t) {
  return fMountain(t) - gMountain(t);
}

function drawMountainGraph(canvasId, mode = 'all') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width, height = canvas.height;
  const yMin = mode === 'h' ? -500 : 0;
  const yMax = mode === 'h' ? 300 : 1100;
  const { toX, toY } = drawAxes(ctx, { xMin: 7, xMax: 12, yMin, yMax, width, height, padding: { left: 54, right: 22, top: 18, bottom: 36 } });

  const plots = [];
  if (mode === 'all') {
    plots.push({ fn: fMountain, color: '#2b78d0' }, { fn: gMountain, color: '#df5a5a' }, { fn: hMountain, color: '#38a169' });
  } else {
    plots.push({ fn: hMountain, color: '#38a169' });
  }
  plots.forEach(plot => {
    ctx.strokeStyle = plot.color; ctx.lineWidth = 3; ctx.beginPath();
    let first = true;
    for (let t = 7; t <= 12.001; t += 0.02) {
      const x = toX(t), y = toY(plot.fn(t));
      if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
    }
    ctx.stroke();
  });

  const currentT = Number(document.getElementById('mountainSlider')?.value || 7);
  if (mode === 'all') {
    [['#2b78d0', fMountain(currentT)], ['#df5a5a', gMountain(currentT)], ['#38a169', hMountain(currentT)]].forEach(([color, value]) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(toX(currentT), toY(value), 6, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (mode === 'h') {
    ctx.strokeStyle = '#ff9f43';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(toX(9.5), toY(yMin));
    ctx.lineTo(toX(9.5), toY(yMax));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ff9f43';
    ctx.fillText('t=9.5', toX(9.5) + 8, toY(yMax) + 20);
  }

  if (mode === 'ivt') {
    // x-axis emphasize
    ctx.strokeStyle = '#9fb4ca'; ctx.lineWidth = 1;
  }
}

function updateMountainUI() {
  const t = Number(document.getElementById('mountainSlider').value);
  document.getElementById('mountainT').textContent = t.toFixed(1);
  document.getElementById('mountainF').textContent = Math.round(fMountain(t));
  document.getElementById('mountainG').textContent = Math.round(gMountain(t));
  document.getElementById('mountainH').textContent = Math.round(hMountain(t));
  drawMountainGraph('mountainCanvas', 'all');
}

function cubicIntro(x) { return x * x * x - x * x - 2; }
function cubicActivity(x) { return x * x * x - 3 * x - 3; }

function drawFunctionPlot(canvasId, fn, range, highlightIntervals = []) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.width, height = canvas.height;
  const xs = [];
  for (let x = range.xMin; x <= range.xMax; x += 0.01) xs.push(x);
  const ys = xs.map(fn);
  const yMin = range.yMin ?? Math.min(...ys) - 1;
  const yMax = range.yMax ?? Math.max(...ys) + 1;
  const { toX, toY } = drawAxes(ctx, { xMin: range.xMin, xMax: range.xMax, yMin, yMax, width, height, padding: { left: 52, right: 20, top: 20, bottom: 38 } });

  highlightIntervals.forEach(item => {
    ctx.fillStyle = item.color || 'rgba(255,159,67,0.16)';
    const x1 = toX(item.a);
    const x2 = toX(item.b);
    ctx.fillRect(Math.min(x1, x2), 20, Math.abs(x2 - x1), height - 58);
  });

  ctx.strokeStyle = '#2b78d0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  xs.forEach((x, i) => {
    const px = toX(x), py = toY(fn(x));
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.stroke();

  ctx.strokeStyle = '#839ab6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(toX(range.xMin), toY(0));
  ctx.lineTo(toX(range.xMax), toY(0));
  ctx.stroke();

  highlightIntervals.forEach(item => {
    const mid = (item.a + item.b) / 2;
    ctx.fillStyle = item.pointColor || '#ff9f43';
    [[item.a, fn(item.a)], [item.b, fn(item.b)], [mid, fn(mid)]].forEach(([x, y]) => {
      if (x < range.xMin || x > range.xMax) return;
      ctx.beginPath();
      ctx.arc(toX(x), toY(y), 5, 0, Math.PI * 2);
      ctx.fill();
    });
  });
}

function drawRootIntro() {
  const groupEl = document.querySelector('[data-step-group="root-intro"]');
  const step = stepState['root-intro'] || 0;
  const intervals = [
    [{ a: 0, b: 2 }],
    [{ a: 1, b: 2 }],
    [{ a: 1.5, b: 2 }]
  ];
  drawFunctionPlot('rootIntroCanvas', cubicIntro, { xMin: -0.2, xMax: 3.2, yMin: -5, yMax: 9 }, intervals[step]);
}

function showBisectionStage(stage) {
  bisectionStage = stage;
  const intervals = [
    { a: 2, b: 4 },
    { a: 2, b: 3 },
    { a: 2, b: 2.5 }
  ];
  document.getElementById('bisectionIntervalLabel').textContent = `(${intervals[stage].a}, ${intervals[stage].b})`;
  drawFunctionPlot('bisectionCanvas', cubicActivity, { xMin: 1.5, xMax: 4.2, yMin: -6, yMax: 50 }, [intervals[stage]]);
}
window.showBisectionStage = showBisectionStage;

function bisectionSequence(iterations, a = 2, b = 4) {
  const seq = [];
  let left = a, right = b;
  for (let i = 1; i <= iterations; i++) {
    const mid = (left + right) / 2;
    const value = cubicActivity(mid);
    const sign = value === 0 ? '0' : value > 0 ? '+' : '-';
    seq.push({ i, left, right, mid, value, sign });
    if (cubicActivity(left) * value <= 0) {
      right = mid;
    } else {
      left = mid;
    }
  }
  return seq;
}

function updateIterationUI() {
  const n = Number(document.getElementById('iterationSlider').value);
  const seq = bisectionSequence(n);
  const last = seq[seq.length - 1];
  const nextLeft = cubicActivity(last.left) * cubicActivity(last.mid) <= 0 ? last.left : last.mid;
  const nextRight = cubicActivity(last.left) * cubicActivity(last.mid) <= 0 ? last.mid : last.right;
  const approx = (nextLeft + nextRight) / 2;
  document.getElementById('iterValue').textContent = n;
  document.getElementById('iterRoot').textContent = approx.toFixed(6);
  document.getElementById('iterInterval').textContent = `(${nextLeft.toFixed(6)}, ${nextRight.toFixed(6)})`;

  const tbody = document.querySelector('#iterationTable tbody');
  tbody.innerHTML = '';
  seq.slice(0, Math.min(n, 6)).forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${row.i}</td><td>(${row.left.toFixed(4)}, ${row.right.toFixed(4)})</td><td>${row.mid.toFixed(6)}</td><td>${row.sign}</td>`;
    tbody.appendChild(tr);
  });
  if (n > 6) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>…</td><td>…</td><td>…</td><td>…</td>`;
    tbody.appendChild(tr);
    const r = seq[n - 1];
    const tr2 = document.createElement('tr');
    tr2.innerHTML = `<td>${r.i}</td><td>(${r.left.toFixed(6)}, ${r.right.toFixed(6)})</td><td>${r.mid.toFixed(6)}</td><td>${r.sign}</td>`;
    tbody.appendChild(tr2);
  }

  drawFunctionPlot('iterationCanvas', cubicActivity, { xMin: 1.9, xMax: 2.25, yMin: -2, yMax: 2 }, [{ a: nextLeft, b: nextRight, color: 'rgba(76,181,165,0.18)', pointColor: '#4cb5a5' }]);
}

function refreshAllCanvases() {
  drawParking('parkingCanvas', Number(document.getElementById('parkingSlider')?.value || 40));
  drawParking('parkingCanvas2', Number(document.getElementById('parkingSlider')?.value || 40));
  setJumpProbe(jumpProbe);
  drawMountainGraph('mountainCanvas', 'all');
  drawMountainGraph('continuityCanvas', 'h');
  drawMountainGraph('ivtCanvas', 'h');
  drawRootIntro();
  showBisectionStage(bisectionStage);
  updateIterationUI();
}

function initListeners() {
  document.getElementById('prevPageBtn').addEventListener('click', () => goToPage(currentPage - 1));
  document.getElementById('nextPageBtn').addEventListener('click', () => goToPage(currentPage + 1));
  document.getElementById('prevStepBtn').addEventListener('click', () => changeStep(-1));
  document.getElementById('nextStepBtn').addEventListener('click', () => changeStep(1));

  document.getElementById('parkingSlider').addEventListener('input', e => updateParkingUI(Number(e.target.value)));
  document.getElementById('mountainSlider').addEventListener('input', updateMountainUI);
  document.getElementById('iterationSlider').addEventListener('input', updateIterationUI);

  const modal = document.getElementById('teacherModal');
  document.getElementById('openTeacherNote').addEventListener('click', () => modal.classList.remove('hidden'));
  document.getElementById('closeTeacherNote').addEventListener('click', () => modal.classList.add('hidden'));
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.add('hidden'); });
}

function initDefaults() {
  document.querySelectorAll('[data-step-group]').forEach(group => setGroupStep(group, 0));
  updateParkingUI(40);
  updateMountainUI();
  setJumpProbe(45);
  showBisectionStage(0);
  updateIterationUI();
}



function getGoogleSheetWebAppUrl() {
  const cfg = window.CALCULUS_ACTIVITY_CONFIG || {};
  return String(cfg.GOOGLE_APPS_SCRIPT_WEB_APP_URL || '').trim();
}

function isGoogleSheetConfigured() {
  const url = getGoogleSheetWebAppUrl();
  return /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec(?:\?.*)?$/.test(url);
}

function getStudentInfoForAssignment(id) {
  const suffix = id === 'assignment1' ? '1' : '2';
  return {
    studentId: document.getElementById(`studentId${suffix}`)?.value.trim() || '',
    studentName: document.getElementById(`studentName${suffix}`)?.value.trim() || ''
  };
}

function syncStudentInfo(sourceSuffix) {
  const otherSuffix = sourceSuffix === '1' ? '2' : '1';
  const sourceId = document.getElementById(`studentId${sourceSuffix}`);
  const sourceName = document.getElementById(`studentName${sourceSuffix}`);
  const otherId = document.getElementById(`studentId${otherSuffix}`);
  const otherName = document.getElementById(`studentName${otherSuffix}`);
  if (sourceId && otherId) otherId.value = sourceId.value;
  if (sourceName && otherName) otherName.value = sourceName.value;
  sessionStorage.setItem('calculusStudentId', sourceId?.value || '');
  sessionStorage.setItem('calculusStudentName', sourceName?.value || '');
}

function initStudentInfo() {
  const savedId = sessionStorage.getItem('calculusStudentId') || '';
  const savedName = sessionStorage.getItem('calculusStudentName') || '';
  ['1', '2'].forEach(suffix => {
    const idEl = document.getElementById(`studentId${suffix}`);
    const nameEl = document.getElementById(`studentName${suffix}`);
    if (idEl) {
      idEl.value = savedId;
      idEl.addEventListener('input', () => syncStudentInfo(suffix));
    }
    if (nameEl) {
      nameEl.value = savedName;
      nameEl.addEventListener('input', () => syncStudentInfo(suffix));
    }
  });
}

function buildAssignmentPayload(id) {
  const info = getStudentInfoForAssignment(id);
  if (id === 'assignment1') {
    return {
      assignment: '과제1',
      studentId: info.studentId,
      studentName: info.studentName,
      question1: '30<x<90에서 불연속점이 45, 60, 75인 이유 설명',
      answer1: document.getElementById('assignment1a')?.value.trim() || '',
      question2: '천장함수를 이용하여 주차 요금의 계단함수를 하나의 식으로 표현할 수 있는지 설명',
      answer2: document.getElementById('assignment1b')?.value.trim() || ''
    };
  }
  return {
    assignment: '과제2',
    studentId: info.studentId,
    studentName: info.studentName,
    question1: 'h(t)가 연속인 이유 설명',
    answer1: document.getElementById('assignment2a')?.value.trim() || '',
    question2: '사잇값 정리로 같은 해발고도의 순간이 있었음을 설명',
    answer2: document.getElementById('assignment2b')?.value.trim() || ''
  };
}

function validateSubmission(id, payload) {
  const suffix = id === 'assignment1' ? '1' : '2';
  const idEl = document.getElementById(`studentId${suffix}`);
  const nameEl = document.getElementById(`studentName${suffix}`);
  const answerEls = id === 'assignment1'
    ? [document.getElementById('assignment1a'), document.getElementById('assignment1b')]
    : [document.getElementById('assignment2a'), document.getElementById('assignment2b')];

  [idEl, nameEl, ...answerEls].forEach(el => el?.classList.remove('invalid'));
  let ok = true;
  if (!payload.studentId) { idEl?.classList.add('invalid'); ok = false; }
  if (!payload.studentName) { nameEl?.classList.add('invalid'); ok = false; }
  if (!payload.answer1) { answerEls[0]?.classList.add('invalid'); ok = false; }
  if (!payload.answer2) { answerEls[1]?.classList.add('invalid'); ok = false; }
  return ok;
}

function submitAssignmentToGoogleSheet(id) {
  const status = document.getElementById(id + 'Status');
  const payload = buildAssignmentPayload(id);

  if (!validateSubmission(id, payload)) {
    if (status) {
      status.style.color = '#dd5a5a';
      status.textContent = '학번, 이름, 두 답안을 모두 입력해 주세요.';
    }
    return;
  }

  if (!isGoogleSheetConfigured()) {
    if (status) {
      status.style.color = '#dd5a5a';
      status.textContent = '교사용 설정이 아직 완료되지 않았습니다. config.js에 Google Apps Script 웹 앱 주소를 입력해 주세요.';
    }
    return;
  }

  saveAssignment(id);
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = getGoogleSheetWebAppUrl();
  form.target = 'googleSheetSubmitFrame';
  form.style.display = 'none';

  const fullPayload = {
    ...payload,
    clientSubmittedAt: new Date().toISOString(),
    pageUrl: window.location.href,
    submissionId: `${payload.studentId}-${id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  };

  Object.entries(fullPayload).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  form.remove();

  if (status) {
    status.style.color = '#2f855a';
    status.textContent = '구글 시트로 제출 요청을 전송했습니다.';
  }
}
window.submitAssignmentToGoogleSheet = submitAssignmentToGoogleSheet;

document.addEventListener('DOMContentLoaded', () => {
  scaleStage();
  initDots();
  initTabs();
  initChecks();
  initListeners();
  loadAssignments();
  initStudentInfo();
  initDefaults();
  updateHeader();
});
