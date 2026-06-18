/* ════════════════════════════════════════════════════════════════
   app.js — 전역 상수, 상태 변수, 유틸리티, 초기화
   ════════════════════════════════════════════════════════════════ */

// ── Supabase 설정 ──────────────────────────────────────────────
const SUPABASE_URL = 'https://aimurxmqzrgajsuvhllz.supabase.co';
const SUPABASE_KEY = 'sb_publishable_l7nSkAIL9W8dNonKauFQ4A_RpDA1JmU';
let sbClient       = null;
let currentProject = null;

// ── 스토리지 키 ────────────────────────────────────────────────
const STORAGE_KEY = 'hangang-report-v5';
const GEN_KEY     = 'hangang-gen-v1';

// ── 상태 색상 맵 ───────────────────────────────────────────────
const SC = {
  '대기중': { color: '#ff9500', bg: 'rgba(255,149,0,0.13)',    border: 'rgba(255,149,0,0.35)',  bar: '#ff9500' },
  '진행중': { color: '#5b8fd6', bg: 'rgba(91,143,214,0.11)',   border: 'rgba(91,143,214,0.35)', bar: '#3a6dbf' },
  '완료':   { color: '#00e676', bg: 'rgba(0,230,118,0.11)',    border: 'rgba(0,230,118,0.3)',   bar: '#00e676' },
  '보류':   { color: '#8899bb', bg: 'rgba(136,153,187,0.1)',   border: 'rgba(136,153,187,0.3)', bar: '#445566' },
};
const STATUS_LIST = ['대기중', '진행중', '완료', '보류'];
const DAY_LABELS  = ['일', '월', '화', '수', '목', '금', '토'];
const DAY_FULL    = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

// ── 전역 상태 ──────────────────────────────────────────────────
let issues          = [];
let selDate         = todayStr();
let calViewMonth    = todayStr().slice(0, 7);
let expandedId      = null;
let genDates        = {};
let bridgeFilter    = '';
let editingId       = null;
let currentUser     = '';
let dailyPersonnel  = {};
let acBridges       = [];
let acFocusIdx      = -1;
let HANGANG_BRIDGES = [];
let isAdmin         = false;

// ── 유틸리티 ───────────────────────────────────────────────────
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function prevDateStr(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function nextDateStr(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function goPrevDate() { selDate = prevDateStr(selDate); render(); }
function goNextDate()  { if (selDate >= todayStr()) return; selDate = nextDateStr(selDate); render(); }

function nowStr() { return new Date().toLocaleString('ko-KR'); }

function lastActionLine(text) {
  if (!text) return '';
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  return lines[lines.length - 1] || '';
}

function grouped(list) {
  return list.reduce((acc, i) => { (acc[i.bridge] = acc[i.bridge] || []).push(i); return acc; }, {});
}

function visibleIssues() {
  const CLOSED = new Set(['완료', '보류']);
  return issues.filter(i => {
    const reg = (i.regDate || i.reg_date || '').slice(0, 10);
    if (reg > selDate) return false;
    if (CLOSED.has(i.status)) {
      const closed = (i.closed_date || todayStr()).slice(0, 10);
      return closed >= selDate;
    }
    return true;
  });
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
}

function getAttachmentUrl(path) {
  if (!sbClient) return '#';
  const { data } = sbClient.storage.from('issue-attachments').getPublicUrl(path);
  return data.publicUrl;
}

// ── 테마 ───────────────────────────────────────────────────────
function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  applyTheme(next);
  localStorage.setItem('ui-theme', next);
}

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = t === 'light' ? '🌙 다크 모드' : '☀️ 라이트 모드';
}

function toggleUserMenu() {
  const dd = document.getElementById('user-dropdown');
  if (dd) dd.classList.toggle('open');
}

function closeUserMenu() {
  const dd = document.getElementById('user-dropdown');
  if (dd) dd.classList.remove('open');
}

// FOUC 방지: 스크립트 로드 즉시 테마 적용
(function () { applyTheme(localStorage.getItem('ui-theme') || 'light'); })();

// ── 전역 클릭 핸들러 ───────────────────────────────────────────
document.addEventListener('click', e => {
  if (!e.target.closest('.cal-wrap')) closeCalendar();
  if (!e.target.closest('#user-menu-wrap')) closeUserMenu();
});

// ── 앱 시작 (로그인 후 호출) ───────────────────────────────────
async function startApp() {
  if (sbClient && HANGANG_BRIDGES.length === 0) {
    let q = sbClient.from('bridges').select('name').order('name');
    if (currentProject) q = q.eq('project_slug', currentProject.slug);
    const { data } = await q;
    if (data) HANGANG_BRIDGES.push(...data.map(b => b.name));
  }

  await migrateFromLocalStorage();
  await loadGen();
  await load();
  await loadPersonnel();

  render();
  scheduleAutoGenerate();

  if (sbClient) {
    sbClient.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') window.location.href = 'login.html';
    });
  }
}

// ── 앱 진입점 ─────────────────────────────────────────────────
async function initApp() {
  if (window.supabase) {
    sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  await loadCurrentProject();

  const authed = await checkAuth();
  if (!authed) { window.location.href = 'login.html'; return; }

  // bypass 로그인: 실제 Supabase 세션 없이 바로 시작
  if (sessionStorage.getItem('bypass-auth')) {
    await startApp();
    return;
  }

  // 실제 Supabase 인증 확인
  const { data: { user } } = await sbClient.auth.getUser();
  if (!user) { window.location.href = 'login.html'; return; }

  const access = await checkProjectAccess(user.id);
  if (!access) { window.location.href = 'login.html'; return; }

  const name = await loadUserName(user.id);
  if (!name) { window.location.href = 'login.html'; return; }

  currentUser = name;
  if (isAdmin) {
    const btn = document.getElementById('monthly-report-btn');
    if (btn) btn.style.display = '';
    const kakaoBtn = document.getElementById('kakao-notify-btn');
    if (kakaoBtn) kakaoBtn.style.display = '';
  }
  const headerUser = document.getElementById('header-user');
  if (headerUser) headerUser.textContent = name;
  const udName = document.getElementById('ud-name');
  if (udName) udName.textContent = name;
  const udEmail = document.getElementById('ud-email');
  if (udEmail) udEmail.textContent = user.email || '';
  await startApp();
}

// initApp()은 index.html의 마지막 <script>에서 호출됨 (auth.js 등 전체 로드 후)
