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
const BG = "#141425";

// ===== WebView 経由で円グラフ画像を生成 =====
async function drawDonut(remaining, size) {
  const elapsed = 1 - remaining;
  const html = \`<html><body style="margin:0;background:transparent;">
<canvas id="c" width="\${size}" height="\${size}"></canvas>
<script>
  var c = document.getElementById("c");
  var ctx = c.getContext("2d");
  var cx = \${size}/2, cy = \${size}/2;
  var R = \${size}*0.38, lw = \${size}*0.13;
  // 背景リング
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI*2);
  ctx.strokeStyle = "#2a2a4a";
  ctx.lineWidth = lw;
  ctx.stroke();
  // 経過分リング
  var start = -Math.PI/2;
  var end = start + Math.PI*2 * \${elapsed};
  var grad = ctx.createConicGradient(start, cx, cy);
  grad.addColorStop(0, "#ff6b6b");
  grad.addColorStop(\${elapsed > 0 ? elapsed : 0.001}, "#ffa500");
  grad.addColorStop(\${elapsed > 0 ? elapsed + 0.001 : 0.002}, "transparent");
  grad.addColorStop(1, "transparent");
  ctx.beginPath();
  ctx.arc(cx, cy, R, start, end);
  ctx.strokeStyle = grad;
  ctx.lineWidth = lw;
  ctx.lineCap = "round";
  ctx.stroke();
  // 中央テキスト
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold " + (\${size}*0.17) + "px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("\${(remaining*100).toFixed(1)}%", cx, cy - \${size}*0.03);
  ctx.fillStyle = "#888888";
  ctx.font = (\${size}*0.11) + "px -apple-system, sans-serif";
  ctx.fillText("残り", cx, cy + \${size}*0.14);
  // base64 出力
  completion(c.toDataURL("image/png"));
<\/script></body></html>\`;

  const wv = new WebView();
  await wv.loadHTML(html);
  const b64 = await wv.evaluateJavaScript(html.includes("completion") ? "void 0" : "void 0", true);
  return b64;
}

// 安全なフォールバック: WebView なしでテキストウィジェット
function buildTextWidget(r, pct) {
  const w = new ListWidget();
  const grad = new LinearGradient();
  grad.colors = [new Color("#1a1a2e"), new Color("#0f0f1a")];
  grad.locations = [0, 1];
  grad.startPoint = new Point(0, 0);
  grad.endPoint = new Point(1, 1);
  w.backgroundGradient = grad;
  w.setPadding(12, 14, 12, 14);

  const title = w.addText("⏳ Life Timer");
  title.textColor = new Color("#ff6b6b");
  title.font = Font.boldSystemFont(12);

  w.addSpacer(6);

  const pctText = w.addText(pct + "%");
  pctText.textColor = new Color("#ffffff");
  pctText.font = Font.boldSystemFont(26);

  w.addSpacer(2);

  const yearText = w.addText("残り " + r.years + " 年");
  yearText.textColor = new Color("#ffa500");
  yearText.font = Font.boldSystemFont(14);

  const dayText = w.addText(r.days.toLocaleString() + " 日 / " + r.months.toLocaleString() + " ヶ月");
  dayText.textColor = new Color("#cccccc");
  dayText.font = Font.systemFont(11);

  return w;
}

// ===== WebView で円グラフ画像を生成する安定版 =====
async function createDonutImage(remaining, sz) {
  const elapsed = 1 - remaining;
  const pctLabel = (remaining * 100).toFixed(1) + "%";
  const js = \`
    const c = document.createElement("canvas");
    c.width = \${sz}; c.height = \${sz};
    document.body.appendChild(c);
    const ctx = c.getContext("2d");
    const cx = \${sz}/2, cy = \${sz}/2;
    const R = \${sz}*0.38, lw = \${sz}*0.13;
    // 背景リング
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI*2);
    ctx.strokeStyle = "#2a2a4a";
    ctx.lineWidth = lw;
    ctx.stroke();
    // 経過リング (赤→オレンジ)
    const segs = 60;
    const elapsedRatio = \${elapsed};
    for (let i = 0; i < segs; i++) {
      const t = i / segs;
      if (t >= elapsedRatio) break;
      const a0 = -Math.PI/2 + t * Math.PI*2;
      const a1 = -Math.PI/2 + (i+1)/segs * Math.PI*2;
      const p = elapsedRatio > 0 ? t / elapsedRatio : 0;
      const rr = 255;
      const gg = Math.round(107 + 58*p);
      const bb = Math.round(107 * (1-p));
      ctx.beginPath();
      ctx.arc(cx, cy, R, a0, a1 + 0.02);
      ctx.strokeStyle = "rgb("+rr+","+gg+","+bb+")";
      ctx.lineWidth = lw;
      ctx.lineCap = "round";
      ctx.stroke();
    }
    // テキスト
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold " + (\${sz}*0.17) + "px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("\${pctLabel}", cx, cy - \${sz}*0.02);
    ctx.fillStyle = "#888888";
    ctx.font = (\${sz}*0.11) + "px sans-serif";
    ctx.fillText("残り", cx, cy + \${sz}*0.15);
    c.toDataURL("image/png");
  \`;

  const wv = new WebView();
  await wv.loadHTML("<html><body></body></html>");
  const dataUrl = await wv.evaluateJavaScript(js, false);
  const b64 = dataUrl.replace(/^data:image\\/png;base64,/, "");
  const imgData = Data.fromBase64String(b64);
  return Image.fromData(imgData);
}

// ===== メイン (async) =====
async function main() {
  let w;
  try {
    const img = await createDonutImage(r.ratio, 200);
    w = new ListWidget();
    const grad = new LinearGradient();
    grad.colors = [new Color("#1a1a2e"), new Color("#0f0f1a")];
    grad.locations = [0, 1];
    grad.startPoint = new Point(0, 0);
    grad.endPoint = new Point(1, 1);
    w.backgroundGradient = grad;
    w.setPadding(8, 8, 8, 8);

    const imgStack = w.addStack();
    imgStack.layoutHorizontally();
    imgStack.addSpacer();
    const wImg = imgStack.addImage(img);
    wImg.imageSize = new Size(90, 90);
    imgStack.addSpacer();

    w.addSpacer(4);

    const yearStack = w.addStack();
    yearStack.layoutHorizontally();
    yearStack.addSpacer();
    const yearTxt = yearStack.addText(r.years + " 年");
    yearTxt.textColor = new Color("#ffa500");
    yearTxt.font = Font.boldSystemFont(14);
    yearStack.addSpacer();

    const dayStack = w.addStack();
    dayStack.layoutHorizontally();
    dayStack.addSpacer();
    const dayTxt = dayStack.addText(r.days.toLocaleString() + " 日");
    dayTxt.textColor = new Color("#cccccc");
    dayTxt.font = Font.systemFont(11);
    dayStack.addSpacer();
  } catch (e) {
    // WebView が失敗した場合はテキスト版にフォールバック
    w = buildTextWidget(r, pct);
  }

  Script.setWidget(w);
  Script.complete();
  w.presentSmall();
}

await main();
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
