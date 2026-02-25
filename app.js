// ===== State =====
let birthDate = null;
let targetAge = 80;

// ===== Init =====
function init() {
  loadSettings();
  setMaxDate();
  updateSettingsForm();
  tick();
  setInterval(tick, 1000);
}

function setMaxDate() {
  const input = document.getElementById('birthInput');
  input.max = new Date().toISOString().split('T')[0];
}

function loadSettings() {
  const savedBirth = localStorage.getItem('birthDate');
  const savedAge = localStorage.getItem('targetAge');
  if (savedBirth) birthDate = new Date(savedBirth);
  if (savedAge) targetAge = parseInt(savedAge, 10);
  if (!birthDate) openSettings(); // 初回は設定を開く
}

function updateSettingsForm() {
  if (birthDate) {
    const iso = birthDate.toISOString().split('T')[0];
    document.getElementById('birthInput').value = iso;
  }
  const ageInput = document.getElementById('targetAgeInput');
  ageInput.value = targetAge;
  document.getElementById('targetAgeDisplay').textContent = targetAge;
}

// ===== Settings Modal =====
function openSettings() {
  updateSettingsForm();
  document.getElementById('settingsModal').classList.add('open');
}

function closeSettings() {
  document.getElementById('settingsModal').classList.remove('open');
}

function closeSettingsOnOverlay(e) {
  if (e.target === document.getElementById('settingsModal')) closeSettings();
}

function saveSettings() {
  const birthInput = document.getElementById('birthInput').value;
  const ageInput = parseInt(document.getElementById('targetAgeInput').value, 10);
  if (!birthInput) { alert('生年月日を入力してください'); return; }
  birthDate = new Date(birthInput);
  targetAge = ageInput;
  localStorage.setItem('birthDate', birthInput);
  localStorage.setItem('targetAge', targetAge);
  closeSettings();
}

// ===== Live preview in modal =====
document.addEventListener('DOMContentLoaded', () => {
  const birthInput = document.getElementById('birthInput');
  const ageInput = document.getElementById('targetAgeInput');
  function updatePreview() {
    const b = birthInput.value ? new Date(birthInput.value) : null;
    const age = parseInt(ageInput.value, 10);
    const preview = document.getElementById('modalPreview');
    if (!b) { preview.textContent = '生年月日を入力してください'; return; }
    const death = new Date(b);
    death.setFullYear(death.getFullYear() + age);
    const now = new Date();
    const remYears = Math.max(0, Math.floor((death - now) / (365.25 * 24 * 3600 * 1000)));
    preview.textContent = `目標日: ${death.toLocaleDateString('ja-JP', {year:'numeric',month:'long',day:'numeric'})}　残り約 ${remYears} 年`;
  }
  birthInput.addEventListener('input', updatePreview);
  ageInput.addEventListener('input', updatePreview);
});

// ===== Core Calculation =====
function calcStats(birth, targetAge) {
  const now = new Date();
  const death = new Date(birth);
  death.setFullYear(death.getFullYear() + targetAge);

  const totalMs = death - birth;
  const elapsedMs = now - birth;
  const remainingMs = Math.max(0, death - now);

  const progressRatio = Math.min(1, Math.max(0, elapsedMs / totalMs));
  const remainingRatio = 1 - progressRatio;

  // 内訳 (年・月・日・時・分・秒)
  const breakdown = diffBreakdown(now, death);

  // 年齢内訳
  const ageBD = diffBreakdown(birth, now);

  return {
    progressRatio,
    remainingRatio,
    breakdown,
    ageBD,
    remainingMs,
    totalMonths: Math.floor(remainingMs / (30.44 * 24 * 3600 * 1000)),
    totalWeeks:  Math.floor(remainingMs / (7 * 24 * 3600 * 1000)),
    totalDays:   Math.floor(remainingMs / (24 * 3600 * 1000)),
    totalHours:  Math.floor(remainingMs / (3600 * 1000)),
    totalMins:   Math.floor(remainingMs / (60 * 1000)),
    totalSecs:   Math.floor(remainingMs / 1000),
  };
}

// 2日時の差を年・月・日・時・分・秒に分解
function diffBreakdown(from, to) {
  if (to <= from) return { years:0, months:0, days:0, hours:0, minutes:0, seconds:0 };

  let years  = to.getFullYear()  - from.getFullYear();
  let months = to.getMonth()     - from.getMonth();
  let days   = to.getDate()      - from.getDate();
  let hours  = to.getHours()     - from.getHours();
  let minutes= to.getMinutes()   - from.getMinutes();
  let seconds= to.getSeconds()   - from.getSeconds();

  if (seconds < 0) { seconds += 60; minutes--; }
  if (minutes < 0) { minutes += 60; hours--; }
  if (hours   < 0) { hours   += 24; days--; }
  if (days    < 0) {
    const prevMonth = new Date(to.getFullYear(), to.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }
  if (months  < 0) { months  += 12; years--; }

  return { years, months, days, hours, minutes, seconds };
}

// ===== DOM Update =====
function tick() {
  if (!birthDate) return;

  const s = calcStats(birthDate, targetAge);

  // 年齢
  const a = s.ageBD;
  document.getElementById('ageString').textContent =
    `${a.years}歳 ${a.months}ヶ月 ${a.days}日`;

  // 残り %
  document.getElementById('remainingPercent').textContent =
    (s.remainingRatio * 100).toFixed(4) + '%';

  // 残り年数
  document.getElementById('remainingYears').textContent =
    `${s.breakdown.years} 年`;

  // プログレス円
  const circumference = 2 * Math.PI * 95; // ≈ 596.9
  const offset = circumference * (1 - s.progressRatio);
  document.getElementById('progressCircle').style.strokeDashoffset = offset;

  // カウントダウン内訳
  const b = s.breakdown;
  document.getElementById('cd-years').textContent   = b.years;
  document.getElementById('cd-months').textContent  = String(b.months).padStart(2,'0');
  document.getElementById('cd-days').textContent    = String(b.days).padStart(2,'0');
  document.getElementById('cd-hours').textContent   = String(b.hours).padStart(2,'0');
  document.getElementById('cd-minutes').textContent = String(b.minutes).padStart(2,'0');
  document.getElementById('cd-seconds').textContent = String(b.seconds).padStart(2,'0');

  // 合計換算
  document.getElementById('u-months').textContent  = s.totalMonths.toLocaleString();
  document.getElementById('u-weeks').textContent   = s.totalWeeks.toLocaleString();
  document.getElementById('u-days').textContent    = s.totalDays.toLocaleString();
  document.getElementById('u-hours').textContent   = s.totalHours.toLocaleString();
  document.getElementById('u-minutes').textContent = s.totalMins.toLocaleString();
  document.getElementById('u-seconds').textContent = s.totalSecs.toLocaleString();
}

// ===== Scriptable Widget Code =====
function getScriptableCode() {
  return `// Life Timer - Scriptable Widget
// 使い方: Scriptableアプリに貼り付けてウィジェットを追加

const BIRTH = "${birthDate ? birthDate.toISOString().split('T')[0] : '1990-01-01'}";
const TARGET_AGE = ${targetAge};

function calcRemaining(birth, targetAge) {
  const now = new Date();
  const death = new Date(birth);
  death.setFullYear(death.getFullYear() + targetAge);
  const totalMs = death - new Date(birth);
  const remainMs = Math.max(0, death - now);
  const ratio = Math.max(0, 1 - (now - new Date(birth)) / totalMs);
  const days = Math.floor(remainMs / 86400000);
  const months = Math.floor(remainMs / (30.44 * 86400000));
  const years = Math.floor(remainMs / (365.25 * 86400000));
  return { ratio, days, months, years };
}

const r = calcRemaining(BIRTH, TARGET_AGE);
const pct = (r.ratio * 100).toFixed(2);

// ===== DrawContext でドーナツグラフを描画 =====
// Scriptable は Path.addArc / SVG 非対応のため
// 細かい線分を並べてリング状の円を描く
function drawDonut(remaining, size) {
  const dc = new DrawContext();
  dc.size = new Size(size, size);
  dc.opaque = false;
  dc.respectScreenScale = true;

  const cx = size / 2;
  const cy = size / 2;
  const R  = size * 0.38;   // 円の半径
  const lw = size * 0.12;   // 線の太さ
  const STEPS = 120;        // 分割数（多いほど滑らか）
  const elapsed = 1 - remaining; // 経過割合

  for (let i = 0; i < STEPS; i++) {
    const t = i / STEPS;                        // 0〜1
    const ang0 = -Math.PI / 2 + t * 2 * Math.PI;
    const ang1 = -Math.PI / 2 + (i + 1) / STEPS * 2 * Math.PI;
    const mid  = (ang0 + ang1) / 2;

    // 経過分は赤〜オレンジ, 残り分はダーク
    let col;
    if (t < elapsed) {
      const p  = elapsed > 0 ? t / elapsed : 0;
      const rr = 255;
      const gg = Math.round(107 + (165 - 107) * p);
      const bb = Math.round(107 * (1 - p));
      const hex = (n) => n.toString(16).padStart(2, "0");
      col = new Color("#" + hex(rr) + hex(gg) + hex(bb));
    } else {
      col = new Color("#2a2a4a");
    }

    // 線分の始点・終点（外側〜内側）
    const x0 = cx + (R - lw / 2) * Math.cos(mid);
    const y0 = cy + (R - lw / 2) * Math.sin(mid);
    const x1 = cx + (R + lw / 2) * Math.cos(mid);
    const y1 = cy + (R + lw / 2) * Math.sin(mid);

    const path = new Path();
    path.move(new Point(x0, y0));
    path.addLine(new Point(x1, y1));
    dc.addPath(path);
    dc.setStrokeColor(col);
    dc.setLineWidth(size * 2 * Math.PI / STEPS + 1); // セグメント幅（隙間なし）
    dc.strokePath();
  }

  // 中央テキスト: %
  const pctStr = (remaining * 100).toFixed(1) + "%";
  dc.setFont(Font.boldSystemFont(size * 0.17));
  dc.setTextColor(new Color("#ffffff"));
  dc.setTextAlignedCenter();
  dc.drawTextInRect(pctStr, new Rect(0, cy - size * 0.14, size, size * 0.22));

  dc.setFont(Font.systemFont(size * 0.11));
  dc.setTextColor(new Color("#888888"));
  dc.drawTextInRect("残り", new Rect(0, cy + size * 0.06, size, size * 0.18));

  return dc.getImage();
}

// ===== ウィジェット構築 =====
const w = new ListWidget();
const grad = new LinearGradient();
grad.colors = [new Color("#1a1a2e"), new Color("#0f0f1a")];
grad.locations = [0, 1];
grad.startPoint = new Point(0, 0);
grad.endPoint = new Point(1, 1);
w.backgroundGradient = grad;
w.setPadding(8, 8, 8, 8);

// 円グラフ
const donutImg = drawDonut(r.ratio, 160);
const imgStack = w.addStack();
imgStack.layoutHorizontally();
imgStack.addSpacer();
const wImg = imgStack.addImage(donutImg);
wImg.imageSize = new Size(90, 90);
imgStack.addSpacer();

w.addSpacer(4);

// 残り年数
const yearStack = w.addStack();
yearStack.layoutHorizontally();
yearStack.addSpacer();
const yearTxt = yearStack.addText(r.years + " 年");
yearTxt.textColor = new Color("#ffa500");
yearTxt.font = Font.boldSystemFont(14);
yearStack.addSpacer();

// 残り日数
const dayStack = w.addStack();
dayStack.layoutHorizontally();
dayStack.addSpacer();
const dayTxt = dayStack.addText(r.days.toLocaleString() + " 日");
dayTxt.textColor = new Color("#cccccc");
dayTxt.font = Font.systemFont(11);
dayStack.addSpacer();

Script.setWidget(w);
Script.complete();
`;
}

function copyScriptable(statusId = 'copyStatus') {
  const code = getScriptableCode();
  const showStatus = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = '✅ コピーしました！Scriptable に貼り付けてください';
      setTimeout(() => el.textContent = '', 4000);
    }
  };
  navigator.clipboard.writeText(code).then(() => {
    showStatus(statusId);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = code;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showStatus(statusId);
  });
}

// ===== Start =====
document.addEventListener('DOMContentLoaded', init);
