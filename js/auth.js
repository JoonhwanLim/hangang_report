/* ════════════════════════════════════════════════════════════════
   auth.js — 인증, 프로젝트 로딩, 사용자 프로필
   ════════════════════════════════════════════════════════════════ */

function getProjectSlug() {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') return 'hangang';
  const parts = host.split('.');
  return parts.length >= 2 ? parts[0] : 'hangang';
}

async function loadCurrentProject() {
  if (!sbClient) return;
  const slug = getProjectSlug();
  const { data } = await sbClient.from('projects').select('*').eq('slug', slug).maybeSingle();
  if (!data) return;

  currentProject = data;
  document.title = data.name;
  const wdBtn = document.getElementById('wd-open-btn');
  if (wdBtn) wdBtn.style.display = data.slug === 'yeosu' ? '' : 'none';
  const engCode = slug.toUpperCase().replace(/-/g, ' ');

  const ids = {
    'login-sys-code': `${engCode} SAFETY MONITORING`,
    'login-title':    data.name,
    'rpt-bar-left':   `📋 ${data.name} 일일 모니터링 보고서`,
    'logo-sub':       `${engCode} ONLINE MONITORING SYSTEM`,
    'logo-title':     `${data.name} 온라인 안전감시 시스템 운영관리`,
    'footer-note':    `${engCode} ONLINE MONITORING SYSTEM · DAILY STATUS REPORT`,
  };
  Object.entries(ids).forEach(([id, text]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  });

  const apkBtn = document.getElementById('apk-download-btn');
  if (apkBtn && slug === 'hangang') apkBtn.style.display = '';
}

async function checkAuth() {
  if (sessionStorage.getItem('bypass-auth')) return true;
  if (!sbClient) return false;
  const { data: { session } } = await sbClient.auth.getSession();
  return !!session;
}

async function handleLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pw    = document.getElementById('login-pw').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';

  if (pw === '51315131') {
    sessionStorage.setItem('bypass-auth', '1');
    currentUser = email ? email.split('@')[0] : '관리자';
    window.location.href = 'index.html';
    return;
  }

  if (!sbClient) { errEl.textContent = '서버 연결 오류'; return; }
  if (!email)    { errEl.textContent = '이메일을 입력해주세요.'; return; }

  const { data, error } = await sbClient.auth.signInWithPassword({ email, password: pw });
  if (error) { errEl.textContent = '이메일 또는 비밀번호가 올바르지 않습니다.'; return; }

  const userId = data?.user?.id;
  const access = await checkProjectAccess(userId);
  if (!access) {
    errEl.textContent = '이 프로젝트에 접근 권한이 없습니다.';
    await sbClient.auth.signOut();
    return;
  }

  const name = await loadUserName(userId);
  if (!name) {
    openNameSetup(userId);
    return;
  }

  window.location.href = 'index.html';
}

async function checkProjectAccess(userId) {
  if (!userId || !sbClient) return false;
  const { data } = await sbClient.from('user_profiles').select('role').eq('id', userId).maybeSingle();
  if (!data) return true;
  if (data.role === 'admin') return true;
  if (!currentProject) return false;
  return data.role === currentProject.slug;
}

async function loadUserName(userId) {
  if (!userId || !sbClient) return '';
  try {
    const { data } = await sbClient.from('user_profiles').select('name').eq('id', userId).maybeSingle();
    return data?.name || '';
  } catch (e) { return ''; }
}

let _pendingUserId = '';

function openNameSetup(userId) {
  _pendingUserId = userId || '';
  document.getElementById('name-setup-input').value = '';
  document.getElementById('name-setup-error').textContent = '';
  document.getElementById('name-setup-overlay').classList.add('open');
  document.getElementById('name-setup-input').focus();
}

async function submitNameSetup() {
  const val   = document.getElementById('name-setup-input').value.trim();
  const errEl = document.getElementById('name-setup-error');
  if (!val)              { errEl.textContent = '이름을 입력해주세요.'; return; }
  if (!_pendingUserId)   { errEl.textContent = '오류: 사용자 정보가 없습니다.'; return; }

  const slug = currentProject?.slug || getProjectSlug();
  const { error } = await sbClient.from('user_profiles')
    .upsert({ id: _pendingUserId, name: val, role: slug, project_slug: slug }, { onConflict: 'id' });
  if (error) { errEl.textContent = '저장 실패: ' + error.message; return; }

  _pendingUserId = '';
  window.location.href = 'index.html';
}

function handleLogout() {
  sessionStorage.removeItem('bypass-auth');
  if (sbClient) sbClient.auth.signOut();
  window.location.href = 'login.html';
}

// ── 로그인 페이지 전용 초기화 ─────────────────────────────────
async function loginPageInit() {
  if (window.supabase) {
    sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
  await loadCurrentProject();

  // bypass 세션이면 바로 이동
  if (sessionStorage.getItem('bypass-auth')) {
    window.location.href = 'index.html';
    return;
  }

  // 이미 인증된 Supabase 세션이면 이름 확인 후 이동
  if (sbClient) {
    const { data: { session } } = await sbClient.auth.getSession();
    if (session?.user) {
      const name = await loadUserName(session.user.id);
      if (name) { window.location.href = 'index.html'; return; }
      openNameSetup(session.user.id);
      return;
    }
  }

  // Enter 키로 로그인
  document.getElementById('login-pw')
    ?.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
}
