/* ════════════════════════════════════════════════════════════════
   render.js — UI 렌더링, 날짜 네비게이션, 이슈 상태, 코멘트
   ════════════════════════════════════════════════════════════════ */

function printReport() { window.print(); }

// ── 날짜 네비게이션 ────────────────────────────────────────────
function toggleCalendar() {
  const drop   = document.getElementById('cal-dropdown');
  const btn    = document.getElementById('cal-toggle-btn');
  const isOpen = drop.classList.toggle('open');
  if (isOpen) { calViewMonth = selDate.slice(0, 7); renderCalendar(); }
  btn?.classList.toggle('open', isOpen);
}

function closeCalendar() {
  document.getElementById('cal-dropdown')?.classList.remove('open');
  document.getElementById('cal-toggle-btn')?.classList.remove('open');
}

// ── 투입인력 표시 ──────────────────────────────────────────────
function updatePersonnelTitle(date, val) {
  if (date !== selDate) return;
  const el = document.getElementById('rpt-personnel-display');
  if (!el) return;
  const isPast = selDate < todayStr();
  if (isPast) {
    el.innerHTML = val
      ? `<span class="rpt-personnel-badge"><span class="rpb-label">투입인력:</span> ${val}</span>`
      : '';
  } else {
    el.innerHTML = `<span class="rpt-personnel-badge rpt-personnel-editable" onclick="openPersonnelEdit()" title="클릭하여 수정">
      <span class="rpb-label">투입인력:</span> ${val || '<span class="rpb-empty">미입력</span>'}
      <span class="rpb-edit-icon">✏️</span>
    </span>`;
  }
}

function openPersonnelEdit() {
  const el = document.getElementById('rpt-personnel-display');
  if (!el) return;
  const cur = dailyPersonnel[selDate] || '';
  el.innerHTML = `<input class="rpt-personnel-inline-input" id="rpt-personnel-input"
    value="${cur}" placeholder="투입인력 입력"
    onblur="commitPersonnelEdit(this.value)"
    onkeydown="if(event.key==='Enter')this.blur();if(event.key==='Escape'){this.value='${cur}';this.blur();}">`;
  const input = document.getElementById('rpt-personnel-input');
  input.focus();
  input.select();
}

function commitPersonnelEdit(val) { savePersonnel(selDate, val.trim()); }

// ── 첨부파일 ───────────────────────────────────────────────────
function updateAttPreview(issueId, input) {
  const el = document.getElementById(`att-preview-${issueId}`);
  if (el) el.textContent = input.files[0] ? `📎 ${input.files[0].name}` : '';
}

async function handleFileSelect(issueId, input) {
  const file = input.files[0];
  if (!file) return;
  const label = input.closest('label');
  if (label) label.classList.add('loading');
  try {
    const ext  = file.name.split('.').pop().replace(/[^a-zA-Z0-9]/g, '') || 'bin';
    const path = `${issueId}/${Date.now()}.${ext}`;
    const { error } = await sbClient.storage.from('issue-attachments').upload(path, file);
    if (error) throw error;
    const iss = issues.find(i => i.id === issueId);
    if (iss) {
      iss.attachments = [...(iss.attachments || []), { name: file.name, path, size: file.size }];
      save(); render(); expandedId = issueId;
    }
  } catch (e) { alert('업로드 실패: ' + e.message); }
  finally { input.value = ''; if (label) label.classList.remove('loading'); }
}

async function deleteAttachment(issueId, path) {
  if (!confirm('첨부파일을 삭제할까요?')) return;
  try {
    await sbClient.storage.from('issue-attachments').remove([path]);
    const iss = issues.find(i => i.id === issueId);
    if (iss) {
      iss.attachments = (iss.attachments || []).filter(a => a.path !== path);
      save(); expandedId = issueId; render();
    }
  } catch (e) { alert('삭제 실패: ' + e.message); }
}

// ── 검색/필터 ──────────────────────────────────────────────────
function setBridgeFilter(val) { bridgeFilter = val; render(); }

function openAcDropdown(query) {
  const drop = document.getElementById('ac-dropdown');
  const btn  = document.getElementById('ac-drop-btn');
  if (!drop) return;
  acFocusIdx = -1;
  drop.innerHTML = '';
  if (drop.parentElement !== document.body) document.body.appendChild(drop);
  const wrap = document.querySelector('.ac-wrap');
  if (wrap) {
    const r = wrap.getBoundingClientRect();
    drop.style.top   = (r.bottom + 6) + 'px';
    drop.style.left  = r.left + 'px';
    drop.style.width = Math.max(r.width, 220) + 'px';
  }
  const q         = (query || '').trim();
  const inReport  = q ? HANGANG_BRIDGES.filter(b => b.includes(q) && acBridges.includes(b))  : acBridges;
  const outReport = q ? HANGANG_BRIDGES.filter(b => b.includes(q) && !acBridges.includes(b)) : HANGANG_BRIDGES.filter(b => !acBridges.includes(b));

  function makeItem(b, dimmed) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'ac-item' + (dimmed ? ' ac-item-dim' : '');
    const nameSpan = document.createElement('span');
    nameSpan.className = 'ac-item-name';
    if (q && b.includes(q)) {
      const i = b.indexOf(q);
      nameSpan.appendChild(document.createTextNode(b.slice(0, i)));
      const mk = document.createElement('mark'); mk.textContent = q;
      nameSpan.appendChild(mk);
      nameSpan.appendChild(document.createTextNode(b.slice(i + q.length)));
    } else { nameSpan.textContent = b; }
    el.appendChild(nameSpan);
    if (!dimmed) {
      const cnt = document.createElement('span');
      cnt.className = 'ac-item-cnt';
      cnt.textContent = issues.filter(i => i.bridge === b && i.regDate.slice(0, 10) <= selDate).length + '건';
      el.appendChild(cnt);
    }
    el.addEventListener('mousedown', e => { e.preventDefault(); pickBridge(b); });
    return el;
  }

  if (inReport.length) {
    if (!q) { const lbl = document.createElement('div'); lbl.className = 'ac-section-lbl'; lbl.textContent = '이슈 있는 교량'; drop.appendChild(lbl); }
    inReport.forEach(b => drop.appendChild(makeItem(b, false)));
  }
  if (outReport.length) {
    if (!q || inReport.length) { const lbl = document.createElement('div'); lbl.className = 'ac-section-lbl'; lbl.textContent = q ? '기타 교량' : '이슈 없는 교량'; drop.appendChild(lbl); }
    outReport.forEach(b => drop.appendChild(makeItem(b, true)));
  }
  if (!inReport.length && !outReport.length) {
    const empty = document.createElement('div'); empty.className = 'ac-section-lbl'; empty.textContent = '검색 결과 없음'; drop.appendChild(empty);
  }
  drop.classList.add('open');
  if (btn) btn.classList.add('open');
}

function closeAcDropdown() {
  document.getElementById('ac-dropdown')?.classList.remove('open');
  document.getElementById('ac-drop-btn')?.classList.remove('open');
  acFocusIdx = -1;
}

function pickBridge(name) {
  const inp = document.getElementById('bridge-filter-input');
  if (inp) inp.value = name;
  setBridgeFilter(name);
  closeAcDropdown();
}

// ── 보고서 생성 ────────────────────────────────────────────────
function generateReport() {
  genDates[todayStr()] = nowStr();
  saveGen();
  renderGenBtn();
}

function renderGenBtn() {
  const area  = document.getElementById('gen-btn-area');
  const today = todayStr();
  if (selDate !== today) { area.innerHTML = ''; return; }
  const info = genDates[today];
  area.innerHTML = info
    ? `<span class="gen-done-txt">✓ 생성완료 · ${info}</span>`
    : `<button class="gen-btn" onclick="generateReport()">📋 오늘의 보고서 생성</button>`;
}

// ── 자동 생성 스케줄 ───────────────────────────────────────────
function autoGenerateIfNeeded() {
  const today = todayStr();
  const now   = new Date();
  const dow   = now.getDay();
  if (dow >= 1 && dow <= 5 && !genDates[today]) {
    genDates[today] = '00:00 자동생성';
    saveGen();
    renderGenBtn();
  }
}

function scheduleAutoGenerate() {
  autoGenerateIfNeeded();
  // 다음 자정에 재실행
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  setTimeout(autoGenerateIfNeeded, nextMidnight - now);
}

// ── 캘린더 ─────────────────────────────────────────────────────
function renderCalendar() {
  const drop = document.getElementById('cal-dropdown');
  if (!drop) return;
  drop.innerHTML = '';
  const today  = todayStr();
  const [year, month] = calViewMonth.split('-').map(Number);

  const hdr     = document.createElement('div');
  hdr.className = 'cal-grid-hdr';
  const prevBtn = document.createElement('button');
  prevBtn.className = 'cal-nav-btn';
  prevBtn.innerHTML = '&#8249;';
  prevBtn.addEventListener('click', e => { e.stopPropagation(); changeCalMonth(-1); });
  const nextBtn = document.createElement('button');
  nextBtn.className = 'cal-nav-btn';
  nextBtn.innerHTML = '&#8250;';
  nextBtn.addEventListener('click', e => { e.stopPropagation(); changeCalMonth(1); });
  const title = document.createElement('span');
  title.className = 'cal-grid-title';
  title.textContent = `${year}년 ${month}월`;
  hdr.append(prevBtn, title, nextBtn);
  drop.appendChild(hdr);

  const dowRow = document.createElement('div');
  dowRow.className = 'cal-dow-row';
  DAY_LABELS.forEach((lbl, i) => {
    const cell = document.createElement('span');
    cell.className = 'cal-dow-cell' + (i === 0 ? ' sun' : i === 6 ? ' sat' : '');
    cell.textContent = lbl;
    dowRow.appendChild(cell);
  });
  drop.appendChild(dowRow);

  const grid        = document.createElement('div');
  grid.className    = 'cal-days-grid';
  const firstDow    = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let i = 0; i < firstDow; i++) {
    const empty = document.createElement('span');
    empty.className = 'cal-day-cell empty';
    grid.appendChild(empty);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr  = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dow      = (firstDow + d - 1) % 7;
    const issN     = issues.filter(i => i.regDate.slice(0, 10) === dateStr).length;
    const isFuture = dateStr > today;
    const cell     = document.createElement('button');
    cell.className = ['cal-day-cell', dateStr === selDate ? 'active' : '', dateStr === today ? 'today' : '', isFuture ? 'future' : '', dow === 0 ? 'sun' : '', dow === 6 ? 'sat' : ''].filter(Boolean).join(' ');
    cell.disabled  = isFuture;
    cell.innerHTML = `<span class="cal-day-num">${d}</span>${issN > 0 ? '<span class="cal-day-dot"></span>' : ''}`;
    cell.onclick   = () => { selDate = dateStr; closeCalendar(); render(); };
    grid.appendChild(cell);
  }
  drop.appendChild(grid);
}

function changeCalMonth(delta) {
  const [y, m] = calViewMonth.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  calViewMonth = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  renderCalendar();
}

// ── 상태 변경 & 코멘트 ─────────────────────────────────────────
function changeStatus(id, newStatus) {
  const iss = issues.find(i => i.id === id);
  if (!iss) return;
  const old  = iss.status;
  iss.status = newStatus;
  const CLOSED = new Set(['완료', '보류']);
  if (CLOSED.has(newStatus) && !CLOSED.has(old)) iss.closed_date = todayStr();
  else if (!CLOSED.has(newStatus))                iss.closed_date = null;
  iss.comments.push({ id: Date.now(), type: 'status', text: `상태 변경: ${old} → ${newStatus}`, author: currentUser || '시스템', date: nowStr() });
  save();
  render();
}

function toggleExpand(id) {
  expandedId = expandedId === id ? null : id;
  render();
}

async function addComment(id) {
  const authEl = document.getElementById('auth-' + id);
  const txtEl  = document.getElementById('txt-'  + id);
  if (!txtEl) return;
  const text = txtEl.value.trim();
  if (!text) return;
  const author  = (authEl?.value.trim()) || currentUser || '담당자';
  const iss     = issues.find(i => i.id === id);
  if (!iss) return;
  const comment = { id: Date.now(), type: 'comment', text, author, date: nowStr() };

  const fileInput = document.getElementById(`att-file-${id}`);
  if (fileInput?.files[0] && sbClient) {
    const file = fileInput.files[0];
    try {
      const ext  = file.name.split('.').pop().replace(/[^a-zA-Z0-9]/g, '') || 'bin';
      const path = `${id}/${Date.now()}.${ext}`;
      const { error } = await sbClient.storage.from('issue-attachments').upload(path, file);
      if (!error) comment.attachment = { name: file.name, path, size: file.size };
    } catch (e) { console.error('[addComment]', e); }
  }

  iss.comments.push(comment);
  save();
  expandedId = id;
  render();
}

// ── 메인 렌더 ──────────────────────────────────────────────────
function render() {
  const today   = todayStr();
  const isToday = selDate === today;

  renderGenBtn();

  // 인쇄 전용 날짜 헤더
  const printDateEl = document.getElementById('print-date-line');
  if (printDateEl) {
    const d        = new Date(selDate + 'T00:00:00');
    const projName = currentProject?.name || '교량 안전감시 시스템';
    printDateEl.textContent = `${projName} — 일일 운영 보고서 (${d.getFullYear()}년 ${String(d.getMonth()+1).padStart(2,'0')}월 ${String(d.getDate()).padStart(2,'0')}일 ${DAY_FULL[d.getDay()]})`;
  }

  // 캘린더 버튼
  const d0        = new Date(selDate + 'T00:00:00');
  const mm        = String(d0.getMonth()+1).padStart(2,'0');
  const dd        = String(d0.getDate()).padStart(2,'0');
  const calTogBtn = document.getElementById('cal-toggle-btn');
  if (calTogBtn) {
    const isQuickDate = (selDate === today || selDate === prevDateStr(today));
    if (isQuickDate) {
      calTogBtn.innerHTML = `📅 날짜 선택 <span class="cal-caret">▾</span>`;
      calTogBtn.classList.remove('date-selected');
    } else {
      calTogBtn.innerHTML = `📅 ${mm}/${dd} ${DAY_LABELS[d0.getDay()]} <span class="cal-caret">▾</span>`;
      calTogBtn.classList.add('date-selected');
    }
  }

  // 빠른 날짜 탭
  const dateTabs = document.getElementById('date-tabs');
  if (dateTabs) {
    const yesterday = prevDateStr(today);
    dateTabs.innerHTML = [yesterday, today].map(dateStr => {
      const dt     = new Date(dateStr + 'T00:00:00');
      const mStr   = String(dt.getMonth()+1).padStart(2,'0');
      const dStr   = String(dt.getDate()).padStart(2,'0');
      const label  = dateStr === today ? '오늘' : '어제';
      return `<button class="date-btn${dateStr === selDate ? ' active' : ''}${dateStr === today ? ' today-btn' : ''}" onclick="selDate='${dateStr}';render()">
        <span class="date-btn-label">${label}</span>
        <span class="date-btn-date">${mStr}/${dStr}</span>
        <span class="date-btn-dow">${DAY_LABELS[dt.getDay()]}</span>
      </button>`;
    }).join('');
  }

  // 통계
  const vis    = visibleIssues();
  const total  = vis.length;
  const counts = {};
  STATUS_LIST.forEach(s => counts[s] = vis.filter(i => i.status === s).length);
  document.getElementById('s-total').textContent = total;
  document.getElementById('s-wait').textContent  = counts['대기중'];
  document.getElementById('s-prog').textContent  = counts['진행중'];
  document.getElementById('s-done').textContent  = counts['완료'];
  document.getElementById('sb-wait').style.width = total ? (counts['대기중'] / total * 100) + '%' : '0%';
  document.getElementById('sb-prog').style.width = total ? (counts['진행중'] / total * 100) + '%' : '0%';
  document.getElementById('sb-done').style.width = total ? (counts['완료']   / total * 100) + '%' : '0%';

  const newCount   = vis.filter(i => i.regDate.slice(0,10) === selDate).length;
  const carryCount = vis.filter(i => i.regDate.slice(0,10) <  selDate).length;
  const ncEl = document.getElementById('stat-newcarry');
  if (ncEl) ncEl.innerHTML = total
    ? `<span class="snc-new">신규 ${newCount}</span><span class="snc-sep">·</span><span class="snc-carry">이월 ${carryCount}</span>`
    : '';

  // 투입인력 자동 인계
  const prevDate = prevDateStr(selDate);
  if (!dailyPersonnel[selDate] && dailyPersonnel[prevDate]) {
    savePersonnel(selDate, dailyPersonnel[prevDate]);
  }
  updatePersonnelTitle(selDate, dailyPersonnel[selDate] || '');

  // 메인 초기화
  const main = document.getElementById('main');
  main.innerHTML = '';
  document.getElementById('notice-area').innerHTML = '';

  const g          = grouped(vis);
  acBridges        = Object.keys(g);

  // 검색 툴바 (최초 1회 생성)
  const filterArea = document.getElementById('filter-area');
  if (!document.getElementById('bridge-filter-input')) {
    filterArea.innerHTML = `
      <div class="ftb-wrap">
        <div class="ftb">
          <div class="ftb-search">
            <span class="ftb-icon">🔍</span>
            <input class="filter-input" id="bridge-filter-input" placeholder="이슈 내용 검색..." autocomplete="off">
            <button class="ftb-clear-btn" id="ftb-clear-btn" type="button" title="초기화" style="display:none">✕</button>
          </div>
        </div>
        <div id="add-issue-wrap"></div>
      </div>`;
    const inp = document.getElementById('bridge-filter-input');
    document.getElementById('ftb-clear-btn').addEventListener('click', () => { setBridgeFilter(''); inp.value = ''; inp.focus(); });
    inp.value = bridgeFilter;
    let composing = false;
    inp.addEventListener('compositionstart', () => { composing = true; });
    inp.addEventListener('compositionend',   e  => { composing = false; setBridgeFilter(e.target.value); });
    inp.addEventListener('input',            e  => { if (!composing) setBridgeFilter(e.target.value); });
    inp.addEventListener('keydown',          e  => { if (e.key === 'Escape') { setBridgeFilter(''); inp.value = ''; } });
  }
  const clrBtn = document.getElementById('ftb-clear-btn');
  if (clrBtn) clrBtn.style.display = bridgeFilter ? 'flex' : 'none';

  // 추가 / 검색 버튼
  const addWrap = document.getElementById('add-issue-wrap');
  if (addWrap) {
    if (!document.getElementById('past-search-btn')) {
      const sb = document.createElement('button');
      sb.id = 'past-search-btn'; sb.className = 'past-search-btn';
      sb.textContent = '🗂 지난이슈 검색'; sb.onclick = () => openSearchModal();
      addWrap.appendChild(sb);
    }
    if (isToday && !document.getElementById('add-issue-btn')) {
      const ab = document.createElement('button');
      ab.id = 'add-issue-btn'; ab.className = 'add-issue-btn';
      ab.textContent = '+ 이슈 추가'; ab.onclick = () => openAddModal();
      addWrap.appendChild(ab);
    }
    if (!isToday) { document.getElementById('add-issue-btn')?.remove(); }
  }

  // 교량 카드 목록
  const q        = bridgeFilter.toLowerCase();
  const filtered = Object.entries(g)
    .map(([bridge, list]) => [bridge, q ? list.filter(i => i.problem.toLowerCase().includes(q) || i.action.toLowerCase().includes(q) || bridge.toLowerCase().includes(q)) : list])
    .filter(([, list]) => list.length > 0);

  filtered.forEach(([bridge, list]) => {
    const card     = document.createElement('div');
    card.className = 'bridge-card';

    const leftEl     = document.createElement('div');
    leftEl.className = 'bridge-left';
    const dotsHtml   = list.map(i => `<span class="status-dot" title="${i.status}" style="background:${SC[i.status].color}"></span>`).join('');
    leftEl.innerHTML = `
      <div class="bridge-left-name">${bridge}</div>
      <div class="bridge-left-footer">
        <div class="status-dots">${dotsHtml}</div>
        <div class="bridge-left-cnt">${list.length}건</div>
      </div>`;
    card.appendChild(leftEl);

    const rightEl     = document.createElement('div');
    rightEl.className = 'bridge-issues';

    list.forEach((iss, idx) => {
      const sc           = SC[iss.status];
      const isExp        = expandedId === iss.id;
      const commentCount = iss.comments.filter(c => c.type === 'comment').length;

      const rowWrap     = document.createElement('div');
      if (idx < list.length - 1) rowWrap.style.borderBottom = '1px solid var(--bdr)';

      const row     = document.createElement('div');
      row.className = 'issue-row';

      const pillsHtml = STATUS_LIST.map(st => {
        const active = st === iss.status;
        const sc2    = SC[st];
        return `<button class="status-pill${active ? ' active' : ''}${!isToday ? ' frozen' : ''}"
          ${isToday ? `onclick="changeStatus('${iss.id}','${st}')"` : 'disabled'}
          style="${active ? `background:${sc2.bg};border-color:${sc2.border};color:${sc2.color}` : ''}">
          <span class="pill-dot" style="background:${sc2.color}"></span>${st}
        </button>`;
      }).join('');

      const isNew  = iss.regDate.slice(0,10) === selDate;
      const badges = [
        `<span class="badge badge-cat">${iss.category}</span>`,
        iss.ongoing ? '<span class="badge badge-ongoing">긴급</span>' : '',
      ].filter(Boolean).join('');

      const actionPreview   = lastActionLine(iss.action);
      const actionMultiLine = iss.action.trim().split('\n').filter(l => l.trim()).length > 1;

      row.innerHTML = `
        <div class="sev-bar" style="background:${sc.bar}"></div>
        <div class="issue-body">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
            <div class="problem-txt">
              ${isNew ? '<span class="new-badge">NEW</span>' : ''}${iss.problem}
            </div>
            <div class="cat-badges">${badges}</div>
          </div>
          <div class="meta-row">
            <span class="meta-item">📅 등록 <b>${iss.regDate}</b></span>
            ${iss.registeredBy ? `<span class="meta-item">🙋 ${iss.registeredBy}</span>` : ''}
            <span class="meta-item">💬 ${commentCount}개</span>
            ${isToday ? `<button class="edit-btn" onclick="startEdit('${iss.id}')">✏️ 수정</button>` : ''}
          </div>
          <div class="action-footer">
            ${iss.assignee ? `<span class="af-who">담당자: ${iss.assignee}</span><span class="af-sep">·</span>` : ''}
            <span class="af-fix-icon">🔧</span>
            <span class="af-txt">${actionMultiLine ? '<span class="action-more-mark">…</span>&nbsp;' : ''}${actionPreview || '(조치 내용 없음)'}</span>
            <button class="followup-btn" onclick="toggleExpand('${iss.id}')">${isExp ? '접기 ▲' : '조치사항 ▼'}</button>
          </div>
        </div>
        <div class="issue-right">
          <div class="status-pills">${pillsHtml}</div>
        </div>`;
      rowWrap.appendChild(row);

      // 코멘트 패널
      const panel     = document.createElement('div');
      panel.className = 'comment-panel' + (isExp ? ' open' : '');
      const tlHtml    = iss.comments.length === 0
        ? '<div class="no-comment">아직 코멘트가 없습니다.</div>'
        : iss.comments.map(c => `
          <div class="tl-item">
            <div class="tl-dot" style="background:${c.type === 'status' ? '#445566' : '#00d4ff'}"></div>
            <div>
              <span class="tl-author" style="color:${c.type === 'status' ? '#8899bb' : '#00d4ff'}">${c.type === 'status' ? '🔄' : '💬'} ${c.author}</span>
              <span class="tl-date">${c.date}</span>
              <div class="tl-text ${c.type === 'status' ? 'tl-text-status' : 'tl-text-comment'}">${c.text}</div>
              ${c.attachment ? `<a href="${getAttachmentUrl(c.attachment.path)}" target="_blank" class="tl-att-link">📎 ${c.attachment.name} <span class="tl-att-size">${formatFileSize(c.attachment.size)}</span></a>` : ''}
            </div>
          </div>`).join('');

      const inputHtml = isToday
        ? `<div class="comment-input">
             <input class="author-input" id="auth-${iss.id}" value="${currentUser || ''}" placeholder="작성자">
             <div class="comment-text-row">
               <input class="text-input" id="txt-${iss.id}" placeholder="팔로우업 내용 입력 후 Enter..." onkeydown="if(event.key==='Enter')addComment('${iss.id}')">
               <label class="att-inline-btn" title="파일 첨부">
                 📎<input type="file" id="att-file-${iss.id}" style="display:none" onchange="updateAttPreview('${iss.id}',this)">
               </label>
             </div>
             <div id="att-preview-${iss.id}" class="att-preview-strip"></div>
             <button class="send-btn" onclick="addComment('${iss.id}')">등록</button>
           </div>`
        : '';

      panel.innerHTML = `<div class="timeline">${tlHtml}</div>${inputHtml}`;
      rowWrap.appendChild(panel);
      rightEl.appendChild(rowWrap);
    });

    card.appendChild(rightEl);
    main.appendChild(card);
  });

  // 프로그레스 카드
  const prog     = document.createElement('div');
  prog.className = 'progress-card';
  const segs     = STATUS_LIST.map(st => {
    const p = total ? (counts[st] / total * 100) : 0;
    return p > 0 ? `<div class="progress-seg" style="width:${p}%;background:${SC[st].bar}" title="${st}: ${counts[st]}건"></div>` : '';
  }).join('');
  const legend = STATUS_LIST.map(st => `
    <div class="prog-item" style="color:${SC[st].color}">
      <span class="prog-dot" style="background:${SC[st].bar}"></span>${st} ${counts[st]}건
    </div>`).join('');
  prog.innerHTML = `<div class="progress-title">이슈 해결 현황</div><div class="progress-bar">${segs}</div><div class="progress-legend">${legend}</div>`;
  main.appendChild(prog);
}
