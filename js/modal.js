/* ════════════════════════════════════════════════════════════════
   modal.js — 이슈 추가 / 수정 / 삭제 / 검색 모달
   ════════════════════════════════════════════════════════════════ */

// ── 이슈 추가 모달 ─────────────────────────────────────────────
function openAddModal() {
  const sel = document.getElementById('af-bridge');
  if (sel) {
    sel.innerHTML = '<option value="">교량 선택</option>' +
      HANGANG_BRIDGES.map(b => `<option value="${b}">${b}</option>`).join('') +
      '<option value="__custom__">직접 입력...</option>';
    sel.value = '';
  }
  const custom = document.getElementById('af-bridge-custom');
  if (custom) { custom.style.display = 'none'; custom.value = ''; }

  ['af-problem', 'af-action', 'af-assignee'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  const ck  = document.getElementById('af-ongoing'); if (ck)  ck.checked = false;
  const cat = document.getElementById('af-cat');     if (cat) cat.value  = '센서';

  document.getElementById('add-modal-overlay').classList.add('open');
}

function handleBridgeSelect(sel) {
  const custom = document.getElementById('af-bridge-custom');
  if (!custom) return;
  if (sel.value === '__custom__') {
    custom.style.display = '';
    custom.focus();
  } else {
    custom.style.display = 'none';
    custom.value = '';
  }
}

function closeAddModal() {
  document.getElementById('add-modal-overlay').classList.remove('open');
}

function handleModalOverlayClick(e) {
  // 바깥 클릭으로 닫기 비활성화
}

function toggleAddForm() { openAddModal(); }

function submitAddForm() {
  const selVal   =  document.getElementById('af-bridge')?.value || '';
  const bridge   = selVal === '__custom__'
    ? (document.getElementById('af-bridge-custom')?.value || '').trim()
    : selVal.trim();
  const problem  = (document.getElementById('af-problem')?.value  || '').trim();
  const action   = (document.getElementById('af-action')?.value   || '').trim();
  const category =  document.getElementById('af-cat')?.value      || '기타';
  const assignee = (document.getElementById('af-assignee')?.value || '').trim();
  const ongoing  =  document.getElementById('af-ongoing')?.checked || false;

  if (!bridge || !problem) { alert('교량명과 문제 내용은 필수입니다.'); return; }

  issues.unshift({
    id:           'MAN-' + Date.now().toString().slice(-4),
    bridge, code: '', icon: '🌉',
    problem, action,
    regDate:      todayStr(),
    status:       '대기중',
    assignee, category, ongoing,
    registeredBy: currentUser,
    project_slug: currentProject?.slug || null,
    comments:     [],
  });

  save();
  closeAddModal();
  render();
}

// ── 이슈 수정 모달 ─────────────────────────────────────────────
function startEdit(id) {
  editingId  = id;
  expandedId = null;
  openEditModal(id);
}

function openEditModal(id) {
  const iss = issues.find(i => i.id === id);
  if (!iss) return;
  document.getElementById('em-bridge').value    = iss.bridge;
  document.getElementById('em-cat').value       = iss.category || '기타';
  document.getElementById('em-problem').value   = iss.problem;
  document.getElementById('em-action').value    = iss.action || '';
  document.getElementById('em-assignee').value  = iss.assignee || '';
  document.getElementById('em-ongoing').checked = iss.ongoing || false;
  document.getElementById('edit-modal-overlay').classList.add('open');
  setTimeout(() => document.getElementById('em-problem')?.focus(), 80);
}

function closeEditModal() {
  document.getElementById('edit-modal-overlay').classList.remove('open');
  editingId = null;
}

function handleEditModalOverlayClick(e) {
  if (e.target === document.getElementById('edit-modal-overlay')) closeEditModal();
}

function saveEdit() {
  const iss = issues.find(i => i.id === editingId);
  if (!iss) return;
  iss.problem  = document.getElementById('em-problem')?.value?.trim()  || iss.problem;
  iss.action   = document.getElementById('em-action')?.value?.trim()   || '';
  iss.category = document.getElementById('em-cat')?.value              || iss.category;
  iss.assignee = document.getElementById('em-assignee')?.value?.trim() || '';
  iss.ongoing  = document.getElementById('em-ongoing')?.checked        || false;
  iss.comments.push({ id: Date.now(), type: 'status', text: '내용 수정됨', author: '담당자', date: nowStr() });
  closeEditModal();
  save();
  render();
}

function cancelEdit() { closeEditModal(); }

async function deleteIssue() {
  if (!editingId) return;
  const iss = issues.find(i => i.id === editingId);
  if (!iss) return;
  if (!confirm(`"${iss.problem.slice(0, 40)}" 이슈를 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`)) return;

  const targetId = editingId;
  closeEditModal();

  if (sbClient) {
    const { error } = await sbClient.from('issues').delete().eq('id', targetId);
    if (error) { alert('삭제 실패: ' + error.message); return; }
    await load();
  } else {
    issues = issues.filter(i => i.id !== targetId);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(issues)); } catch (e) {}
  }
  render();
}

// ── 지난이슈 검색 모달 ─────────────────────────────────────────
function openSearchModal() {
  document.getElementById('search-modal-overlay').classList.add('open');
  setTimeout(() => {
    const inp = document.getElementById('search-modal-input');
    if (inp) { inp.value = ''; inp.focus(); }
    renderSearchResults('');
  }, 80);
}

function closeSearchModal() {
  document.getElementById('search-modal-overlay').classList.remove('open');
}

function handleSearchModalOverlayClick(e) {
  if (e.target === document.getElementById('search-modal-overlay')) closeSearchModal();
}

function renderSearchResults(query) {
  const el = document.getElementById('search-modal-results');
  if (!el) return;
  const q    = query.trim().toLowerCase();
  const pool = issues.filter(iss => new Set(['완료', '보류']).has(iss.status));
  const results = q
    ? pool.filter(iss =>
        iss.problem.toLowerCase().includes(q)          ||
        (iss.action   || '').toLowerCase().includes(q) ||
        iss.bridge.toLowerCase().includes(q)           ||
        (iss.assignee || '').toLowerCase().includes(q) ||
        (iss.id       || '').toLowerCase().includes(q)
      )
    : pool;
  results.sort((a, b) => b.regDate.localeCompare(a.regDate));

  if (!results.length) {
    el.innerHTML = `<div class="search-empty">${q ? `"${query}"에 해당하는 완료/보류 이슈가 없습니다.` : '키워드를 입력하면 완료·보류 이슈를 검색합니다.'}</div>`;
    return;
  }

  function hl(text) {
    if (!q || !text) return text || '';
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(escaped, 'gi'), m => `<mark class="search-hl">${m}</mark>`);
  }

  el.innerHTML = results.map(iss => {
    const sc           = SC[iss.status];
    const actionPreview = lastActionLine(iss.action);
    const hasComments  = iss.comments.length > 0;
    const commentsHtml = hasComments
      ? iss.comments.map(c => `
          <div class="sri-comment">
            <span class="sri-c-dot" style="background:${c.type === 'status' ? '#445566' : '#00d4ff'}"></span>
            <div class="sri-c-body">
              <span class="sri-c-author" style="color:${c.type === 'status' ? '#8899bb' : '#00d4ff'}">${c.type === 'status' ? '🔄' : '💬'} ${c.author}</span>
              <span class="sri-c-date">${c.date}</span>
              <div class="sri-c-text ${c.type === 'status' ? 'tl-text-status' : 'tl-text-comment'}">${hl(c.text)}</div>
            </div>
          </div>`).join('')
      : '';

    return `
      <div class="search-result-item">
        <div class="sri-top">
          <span class="sri-bridge">${iss.icon || '🌉'} ${hl(iss.bridge)}</span>
          <span class="sri-status" style="color:${sc.color};background:${sc.bg};border:1px solid ${sc.border}">${iss.status}</span>
          <span class="sri-date">📅 ${iss.regDate}</span>
          ${iss.assignee ? `<span class="sri-who">👤 ${hl(iss.assignee)}</span>` : ''}
        </div>
        <div class="sri-problem">${hl(iss.problem)}</div>
        <div class="sri-action-footer">
          <span>🔧</span>
          <span class="sri-action-txt">${hl(actionPreview) || '(조치 내용 없음)'}</span>
          ${hasComments ? `<button class="followup-btn sri-followup-btn" onclick="toggleSriComment('${iss.id}')">조치사항 ▼</button>` : ''}
        </div>
        ${hasComments ? `<div class="sri-comments" id="sri-c-${iss.id}">${commentsHtml}</div>` : ''}
      </div>`;
  }).join('');
}

function toggleSriComment(id) {
  const panel = document.getElementById('sri-c-' + id);
  const btn   = panel?.previousElementSibling?.querySelector('.sri-followup-btn');
  if (!panel) return;
  const isOpen = panel.classList.toggle('open');
  if (btn) btn.textContent = isOpen ? '접기 ▲' : '조치사항 ▼';
}
