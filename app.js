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

// ===== ドーナツグラフ: SVG文字列をbase64でImage化 =====
function drawDonutSVG(remaining, size) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const strokeW = size * 0.14;
  const circ = 2 * Math.PI * radius;
  const elapsed = 1 - remaining;
  const dashElapsed = circ * elapsed;
  const dashRemain  = circ * remaining;

  const svg = \`<svg xmlns="http://www.w3.org/2000/svg" width="\${size}" height="\${size}">
  <circle cx="\${cx}" cy="\${cy}" r="\${radius}"
    fill="none" stroke="#2a2a4a" stroke-width="\${strokeW}"/>
  <circle cx="\${cx}" cy="\${cy}" r="\${radius}"
    fill="none" stroke="#ff6b00" stroke-width="\${strokeW}"
    stroke-dasharray="\${dashElapsed} \${dashRemain}"
    stroke-dashoffset="\${circ * 0.25}"
    stroke-linecap="round"/>
  <text x="\${cx}" y="\${cy - size*0.04}" text-anchor="middle"
    font-family="-apple-system,sans-serif" font-weight="bold"
    font-size="\${size*0.17}" fill="#ffffff">\${(remaining*100).toFixed(1)}%</text>
  <text x="\${cx}" y="\${cy + size*0.13}" text-anchor="middle"
    font-family="-apple-system,sans-serif"
    font-size="\${size*0.1}" fill="#aaaaaa">残り</text>
</svg>\`;

  const data = Data.fromString(svg);
  return Image.fromData(data);
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
const donutImg = drawDonutSVG(r.ratio, 160);
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
