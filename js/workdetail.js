/* ════════════════════════════════════════════════════════════════
   workdetail.js — 작업 상세 내용 (일일 교량 모니터링 상태표)
   ════════════════════════════════════════════════════════════════ */

const WD_CYCLE = ['○', '△', '✕', '-'];

// ── 교량 + IMS 기본 템플릿 ─────────────────────────────────────
// r: 원격접속, hdd: HDD (교량 단위)
// dam/daq/dat/mgt: IMS 단위 상태
const WD_TEMPLATE = [
  { b:'행주대교',        r:'○', hdd:'○', ims:[{n:'Qpac',            dam:'○',daq:'○',dat:'○',mgt:'○',note:''}]},
  { b:'행주대교-지진',   r:'○', hdd:'○', ims:[{n:'Guralp',          dam:'-', daq:'-', dat:'○',mgt:'○',note:''}]},
  { b:'가양대교',        r:'○', hdd:'○', ims:[
    {n:'CR10X',          dam:'-', daq:'○', dat:'○',mgt:'○',note:''},
    {n:'Qpac',           dam:'○', daq:'○', dat:'○',mgt:'○',note:''},
    {n:'Septentrio',     dam:'',  daq:'○', dat:'○',mgt:'○',note:''},
  ]},
  { b:'월드컵대교',      r:'○', hdd:'○', ims:[
    {n:'CR1000_SL01',    dam:'-', daq:'○', dat:'○',mgt:'○',note:''},
    {n:'CR1000_SL02',    dam:'-', daq:'○', dat:'○',mgt:'○',note:''},
    {n:'Q-gate_DL01',    dam:'○', daq:'○', dat:'○',mgt:'○',note:''},
    {n:'Q-gate_DL02',    dam:'○', daq:'○', dat:'○',mgt:'○',note:''},
    {n:'GNSS_GL01',      dam:'○', daq:'○', dat:'○',mgt:'○',note:''},
    {n:'GNSS_GL02',      dam:'○', daq:'○', dat:'○',mgt:'○',note:''},
    {n:'GNSS_GL03',      dam:'○', daq:'○', dat:'○',mgt:'○',note:''},
    {n:'PSMA_QL01',      dam:'○', daq:'○', dat:'○',mgt:'○',note:''},
    {n:'PSMA_QL02',      dam:'○', daq:'○', dat:'○',mgt:'○',note:''},
    {n:'PSMA_QL03',      dam:'○', daq:'○', dat:'○',mgt:'○',note:''},
    {n:'PSMA_QL04',      dam:'○', daq:'○', dat:'○',mgt:'○',note:''},
    {n:'PSMA_QL05',      dam:'○', daq:'○', dat:'○',mgt:'○',note:''},
  ]},
  { b:'성산대교',        r:'○', hdd:'○', ims:[{n:'Qpac',   dam:'○',daq:'○',dat:'○',mgt:'○',note:''}]},
  { b:'양화대교',        r:'○', hdd:'○', ims:[{n:'E.gate', dam:'○',daq:'○',dat:'○',mgt:'○',note:''}]},
  { b:'서강대교',        r:'○', hdd:'○', ims:[{n:'Qpac',   dam:'○',daq:'○',dat:'○',mgt:'○',note:''}]},
  { b:'서강대교_태풍',   r:'○', hdd:'',  ims:[{n:'Q.gate', dam:'○',daq:'○',dat:'○',mgt:'○',note:''}]},
  { b:'원효대교',        r:'○', hdd:'',  ims:[{n:'Qpac',   dam:'○',daq:'○',dat:'○',mgt:'○',note:''}]},
  { b:'한강대교',        r:'○', hdd:'',  ims:[{n:'Qpac',   dam:'○',daq:'○',dat:'○',mgt:'○',note:''}]},
  { b:'성수대교',        r:'○', hdd:'',  ims:[{n:'Qpac',   dam:'○',daq:'○',dat:'○',mgt:'○',note:''}]},
  { b:'청담대교',        r:'○', hdd:'',  ims:[{n:'Qpac',   dam:'○',daq:'○',dat:'○',mgt:'○',note:''}]},
  { b:'청담대교_태풍',   r:'○', hdd:'',  ims:[{n:'Q.gate', dam:'○',daq:'○',dat:'○',mgt:'○',note:''}]},
  { b:'올림픽대교',      r:'○', hdd:'',  ims:[{n:'Qpac',   dam:'○',daq:'○',dat:'○',mgt:'○',note:''}]},
  { b:'올림픽대교-지진', r:'○', hdd:'',  ims:[{n:'Guralp', dam:'-', daq:'-', dat:'○',mgt:'○',note:''}]},
  { b:'구리암사대교',    r:'○', hdd:'○', ims:[
    {n:'CR1000',         dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'E-gate_01',      dam:'○', daq:'○', dat:'○',mgt:'○',note:''},
    {n:'E-gate_02',      dam:'',  daq:'○', dat:'○',mgt:'○',note:''},
  ]},
  { b:'샛강문화다리',    r:'○', hdd:'○', ims:[
    {n:'Qpac',           dam:'○', daq:'○', dat:'○',mgt:'○',note:''},
    {n:'Septentrio_P1',  dam:'○', daq:'○', dat:'○',mgt:'○',note:''},
    {n:'Septentrio_1/2', dam:'',  daq:'○', dat:'○',mgt:'○',note:''},
    {n:'Septentrio_P2',  dam:'',  daq:'○', dat:'○',mgt:'○',note:''},
  ]},
  { b:'천호대교',        r:'○', hdd:'○', ims:[
    {n:'QPAC_01',        dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'QPAC_02',        dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'QPAC_03',        dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'JANET_P10P11',   dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'JANET_P11P12',   dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
  ]},
  { b:'영동대교',        r:'○', hdd:'○', ims:[
    {n:'IOT_GB_A1_17454',  dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'IOT_GB_P3_17452',  dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'IOT_GB_P6_17451',  dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'IOT_GB_P9_17456',  dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'IOT_GB_P12_17455', dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'IOT_GB_P15_17457', dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'IOT_GB_A2_17453',  dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
  ]},
  { b:'잠수교',          r:'○', hdd:'○', ims:[
    {n:'JANET_P22P23',   dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'JANET_P23P24',   dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'EPSON_P23',      dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'EPSON_P24',      dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
  ]},
  { b:'마포대교',        r:'○', hdd:'○', ims:[
    {n:'Nplus_01_MP',    dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'Nplus_02_MP',    dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'IOT_GB_MP',      dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
  ]},
  { b:'동작대교',        r:'○', hdd:'○', ims:[
    {n:'Nplus_01_DJ',    dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'Nplus_02_DJ',    dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'IOT_GB_DJ',      dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
  ]},
  { b:'한남대교',        r:'○', hdd:'○', ims:[
    {n:'Nplus_01_HN',    dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'Nplus_02_HN',    dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'IOT_GB_HN',      dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
  ]},
  { b:'동호대교',        r:'○', hdd:'○', ims:[
    {n:'Nplus_01_DH',    dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'Nplus_02_DH',    dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'IOT_GB_DH',      dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
  ]},
  { b:'광진교',          r:'○', hdd:'○', ims:[
    {n:'Nplus_01_GJ',    dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'Nplus_02_GJ',    dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'IOT_GB_GJ',      dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
  ]},
  { b:'잠실철교',        r:'○', hdd:'○', ims:[
    {n:'Nplus_01_JR',    dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'Nplus_02_JR',    dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'IOT_GB_JR',      dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
  ]},
  { b:'잠실대교',        r:'○', hdd:'○', ims:[
    {n:'Nplus_01_JS',    dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'Nplus_02_JS',    dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
    {n:'IOT_GB_JS',      dam:'○', daq:'-', dat:'○',mgt:'○',note:''},
  ]},
];

// ── 여수 동적/정적 계측 템플릿 ────────────────────────────────
// svr: 공구단위 서버/집선기, mgt: 관리기준, hdd: HDD, note: 내용 (모두 공구 단위)
// r: 원격접속 (교량 단위), dam/dat: IMS 단위
const YEOSU_DYN_TEMPLATE = [
  { g:'1공구', svr:'○', mgt:'○', hdd:'○', note:'', sites:[
    { b:'묘도대교', r:'○', ims:[
      {n:'정적-PY1',  dam:'-',dat:'○'}, {n:'동적-PY1',  dam:'○',dat:'○'},
      {n:'정적-PY2',  dam:'-',dat:'○'}, {n:'동적-PY2',  dam:'○',dat:'○'},
      {n:'GNSS-01',   dam:'-',dat:'○'},
    ]},
  ]},
  { g:'2공구', svr:'○', mgt:'△', hdd:'○', note:'SSG12, SSG27, SSG28, SSG38', sites:[
    { b:'접속B교', r:'', ims:[{n:'동적-접속B교', dam:'○',dat:'○'}]},
    { b:'묘도교',  r:'○', ims:[{n:'정적-묘도교', dam:'-',dat:'○'},{n:'동적-묘도교', dam:'○',dat:'○'}]},
    { b:'접속C교', r:'', ims:[{n:'정적-접속C교', dam:'-',dat:'○'}]},
  ]},
  { g:'3공구', svr:'○', mgt:'○', hdd:'○', note:'', sites:[
    { b:'이순신대교', r:'○', ims:[
      {n:'정적-AN1',      dam:'-',dat:'○'}, {n:'정적-PY1윈드슈', dam:'-',dat:'○'},
      {n:'동적-PY1윈드슈',dam:'○',dat:'○'}, {n:'광-PY1윈드슈',  dam:'○',dat:'○'},
      {n:'정적-PY1상부',  dam:'-',dat:'○'}, {n:'동적-PY1상부',  dam:'○',dat:'○'},
      {n:'GPS-PY1상부',   dam:'-',dat:'✕'}, {n:'GPS-거더1/4',   dam:'-',dat:'○'},
      {n:'정적-거더1/2',  dam:'-',dat:'○'}, {n:'동적-거더1/2',  dam:'○',dat:'○'},
      {n:'GPS-거더1/2',   dam:'-',dat:'○'}, {n:'정적-PY2윈드슈',dam:'-',dat:'○'},
      {n:'동적-PY2윈드슈',dam:'○',dat:'○'}, {n:'정적-PY2상부',  dam:'-',dat:'○'},
      {n:'동적-PY2상부',  dam:'○',dat:'○'}, {n:'GPS-PY2상부',   dam:'-',dat:'○'},
      {n:'정적-AN2',      dam:'-',dat:'○'}, {n:'동적-SP1링크슈', dam:'○',dat:'○'},
    ]},
  ]},
  { g:'4공구', svr:'○', mgt:'△', hdd:'○', note:'SSG04, SSG05, SSG08 ~ 13,\nSSG21 ~ SSG25, SSG30', sites:[
    { b:'접속D교', r:'', ims:[
      {n:'정적-접속D교',  dam:'-',dat:'○'},{n:'동적-접속D교',  dam:'○',dat:'○'},{n:'GNSS-접속D교',dam:'-',dat:'○'},
    ]},
    { b:'램프A교', r:'', ims:[
      {n:'정적-램프A교',  dam:'-',dat:'○'},{n:'동적-램프A교',  dam:'○',dat:'○'},{n:'PSMR-램프A교',dam:'-',dat:'○'},
    ]},
  ]},
  { g:'5공구', svr:'○', mgt:'○', hdd:'○', note:'', sites:[
    { b:'마동IC교', r:'○', ims:[{n:'동적-1',dam:'○',dat:'○'},{n:'PSMR-1',dam:'-',dat:'○'}]},
  ]},
  { g:'NAS', isNAS:true, nas:[
    {n:'INTELLINAS',   hdd:'○', note:'665GB / 5.37TB (8.0%)'},
    {n:'SYNOLOGY NAS', hdd:'○', note:'정상'},
  ]},
];

// ── 여수 지진 계측 템플릿 ─────────────────────────────────────
// svr: 교량단위 IMS 접속, dat: 데이터수집 (IMS 단위)
const YEOSU_SEI_TEMPLATE = [
  { g:'1공구', sites:[
    { b:'묘도대교', svr:'○', ims:[
      {n:'GURALP_기초_자유장',dat:'○',note:''}, {n:'GURALP_PY2주탑',dat:'○',note:''},
      {n:'GURALP_주경간',     dat:'○',note:''},
    ]},
  ]},
  { g:'3공구', sites:[
    { b:'이순신대교', svr:'○', ims:[
      {n:'GURALP_기초_자유장',dat:'○',note:''}, {n:'GURALP_앵커리지', dat:'○',note:''},
      {n:'GURALP_주탑상판',   dat:'○',note:''}, {n:'GURALP_주탑상부', dat:'○',note:''},
      {n:'GURALP_케이블',     dat:'○',note:''}, {n:'GURALP_주경간',   dat:'○',note:''},
    ]},
  ]},
];

// ── 상태 ───────────────────────────────────────────────────────
let wdDate = '';
let wdRows = [];

function wdTemplateClone() {
  return WD_TEMPLATE.map(b => ({ ...b, ims: b.ims.map(i => ({ ...i })) }));
}

function wdBlankClone() {
  return WD_TEMPLATE.map(b => ({
    ...b, r: '', hdd: '',
    ims: b.ims.map(i => ({ ...i, dam: '', daq: '', dat: '', mgt: '', note: '' }))
  }));
}

function wdBlankCloneYeosu() {
  return {
    dynamic: YEOSU_DYN_TEMPLATE.map(g => {
      if (g.isNAS) return { ...g, nas: g.nas.map(n => ({ ...n, hdd: '', note: '' })) };
      return { ...g, svr: '', mgt: '', hdd: '', note: '',
        sites: g.sites.map(s => ({ ...s, r: '',
          ims: s.ims.map(i => ({ ...i, dam: '', dat: '' }))
        }))
      };
    }),
    seismic: YEOSU_SEI_TEMPLATE.map(g => ({
      ...g, sites: g.sites.map(s => ({ ...s, svr: '',
        ims: s.ims.map(i => ({ ...i, dat: '', note: '' }))
      }))
    })),
    memo: '',
  };
}

// ── 모달 열기/닫기 ─────────────────────────────────────────────
async function openWorkDetail(date) {
  wdDate = date;
  const editable = date === todayStr();

  document.getElementById('wd-date-title').textContent = `작업 상세 내용 — ${date}`;
  const _tbody = document.getElementById('wd-tbody');
  if (_tbody) {
    _tbody.innerHTML = '<tr><td colspan="9" class="wd-loading">불러오는 중…</td></tr>';
  } else {
    const _wrap = document.querySelector('.wd-table-wrap');
    if (_wrap) _wrap.innerHTML = '<div class="wd-loading">불러오는 중…</div>';
  }

  // 읽기전용 배너
  const body = document.querySelector('.wd-modal-body');
  let banner = document.getElementById('wd-readonly-banner');
  if (!editable) {
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'wd-readonly-banner';
      banner.className = 'wd-readonly-banner';
      banner.textContent = '🔒 과거 날짜는 읽기 전용입니다.';
      body.insertBefore(banner, body.firstChild);
    }
  } else {
    if (banner) banner.remove();
  }

  // 저장 버튼
  const saveBtn = document.getElementById('wd-save-btn');
  if (saveBtn) saveBtn.style.display = editable ? '' : 'none';

  document.getElementById('wd-modal-overlay').classList.add('open');
  const { rows, fresh } = await wdLoad(date);
  wdRows = rows;
  renderWDTable();

  // 오늘 데이터가 없었으면(어제 데이터 또는 템플릿으로 초기화) 바로 저장
  if (editable && fresh) wdSilentSave();
}

function closeWorkDetail() {
  document.getElementById('wd-modal-overlay').classList.remove('open');
}

function handleWDOverlayClick(e) {
  if (e.target === document.getElementById('wd-modal-overlay')) closeWorkDetail();
}

// ── 데이터 로드 ────────────────────────────────────────────────
// 반환값: { rows, fresh } — fresh=true이면 어제/템플릿에서 초기화된 것 (오늘 데이터 없음)
async function wdLoad(date) {
  if (sbClient) {
    try {
      let q = sbClient.from('daily_work_details').select('data').eq('report_date', date);
      if (currentProject) q = q.eq('project_slug', currentProject.slug);
      const { data, error } = await q.maybeSingle();
      if (!error && data?.data) return { rows: data.data, fresh: false };
    } catch (e) { console.error('[wdLoad]', e); }
  }
  try {
    const cache = JSON.parse(localStorage.getItem('wd-cache') || '{}');
    if (cache[date]) return { rows: cache[date], fresh: false };
  } catch (e) {}

  // 오늘 데이터 없음 — 가장 최근 과거 레코드로 초기화 (주말 등 공백 대응)
  if (sbClient) {
    try {
      let q = sbClient.from('daily_work_details')
        .select('data')
        .lt('report_date', date)
        .order('report_date', { ascending: false })
        .limit(1);
      if (currentProject) q = q.eq('project_slug', currentProject.slug);
      const { data, error } = await q.maybeSingle();
      if (!error && data?.data) return { rows: data.data, fresh: true };
    } catch (e) {}
  }
  try {
    const cache = JSON.parse(localStorage.getItem('wd-cache') || '{}');
    const latest = Object.keys(cache).filter(d => d < date).sort().at(-1);
    if (latest) return { rows: cache[latest], fresh: true };
  } catch (e) {}

  return { rows: currentProject?.slug === 'yeosu' ? wdBlankCloneYeosu() : wdBlankClone(), fresh: false };
}

// ── 자동 저장 (버튼 UI 건드리지 않음) ─────────────────────────
async function wdSilentSave() {
  if (sbClient) {
    try {
      await sbClient.from('daily_work_details').upsert({
        report_date:  wdDate,
        project_slug: currentProject?.slug || null,
        data:         wdRows,
        updated_at:   new Date().toISOString(),
      }, { onConflict: 'report_date,project_slug' });
    } catch (e) { console.error('[wdSilentSave]', e); }
  }
  try {
    const cache = JSON.parse(localStorage.getItem('wd-cache') || '{}');
    cache[wdDate] = wdRows;
    localStorage.setItem('wd-cache', JSON.stringify(cache));
  } catch (e) {}
}

// ── 데이터 저장 ────────────────────────────────────────────────
async function saveWorkDetail() {
  const btn = document.getElementById('wd-save-btn');
  btn.textContent = '저장 중…';
  btn.disabled = true;

  if (sbClient) {
    try {
      const { error } = await sbClient.from('daily_work_details').upsert({
        report_date:  wdDate,
        project_slug: currentProject?.slug || null,
        data:         wdRows,
        updated_at:   new Date().toISOString(),
      }, { onConflict: 'report_date,project_slug' });
      if (error) throw error;
    } catch (e) {
      console.error('[saveWorkDetail]', e);
      alert('저장 실패: ' + e.message);
      btn.textContent = '저장';
      btn.disabled = false;
      return;
    }
  }

  try {
    const cache = JSON.parse(localStorage.getItem('wd-cache') || '{}');
    cache[wdDate] = wdRows;
    localStorage.setItem('wd-cache', JSON.stringify(cache));
  } catch (e) {}

  btn.textContent = '✓ 저장 완료';
  setTimeout(() => { btn.textContent = '저장'; btn.disabled = false; }, 1200);
}

// ── 테이블 렌더링 ──────────────────────────────────────────────
function scls(v) {
  if (v === '○') return 'wd-ok';
  if (v === '△') return 'wd-warn';
  if (v === '✕') return 'wd-ng';
  return 'wd-na';
}

function renderWDTable() {
  const wrap = document.querySelector('.wd-table-wrap');
  if (wrap) wrap.classList.toggle('wd-readonly', wdDate !== todayStr());
  if (currentProject?.slug === 'yeosu') { renderWDTableYeosu(wrap); return; }

  const tbody = document.getElementById('wd-tbody');
  let html = '';

  wdRows.forEach((br, bi) => {
    const span = br.ims.length;
    br.ims.forEach((im, ii) => {
      html += `<tr class="${ii % 2 === 0 ? '' : 'wd-row-alt'}">`;

      if (ii === 0) {
        html += `<td class="wd-site" rowspan="${span}">${br.b}</td>`;
        html += `<td class="wd-status ${scls(br.r)}" rowspan="${span}"
                    data-bi="${bi}" data-ii="-1" data-field="r"
                    onclick="wdCycle(this)">${br.r}</td>`;
      }

      html += `<td class="wd-ims-name">${im.n}</td>`;

      ['dam','daq','dat','mgt'].forEach(f => {
        html += `<td class="wd-status ${scls(im[f])}"
                    data-bi="${bi}" data-ii="${ii}" data-field="${f}"
                    onclick="wdCycle(this)">${im[f]}</td>`;
      });

      if (ii === 0) {
        html += `<td class="wd-status ${scls(br.hdd)}" rowspan="${span}"
                    data-bi="${bi}" data-ii="-1" data-field="hdd"
                    onclick="wdCycle(this)">${br.hdd}</td>`;
      }

      const noteVal = (im.note || '').replace(/"/g, '&quot;');
      html += `<td class="wd-note-cell">
        <input class="wd-note-input" value="${noteVal}"
               data-bi="${bi}" data-ii="${ii}"
               oninput="wdNoteInput(this)"
               placeholder="내용 입력">
      </td>`;

      html += `</tr>`;
    });
  });

  tbody.innerHTML = html;
}

// ── 상태 클릭 토글 ─────────────────────────────────────────────
function wdCycle(el) {
  if (currentProject?.slug === 'yeosu') { wdCycleYeosu(el); return; }
  const bi    = +el.dataset.bi;
  const ii    = +el.dataset.ii;
  const field = el.dataset.field;
  const obj   = ii < 0 ? wdRows[bi] : wdRows[bi].ims[ii];
  const cur   = obj[field] || '○';
  const idx   = WD_CYCLE.indexOf(cur);
  const next  = WD_CYCLE[(idx < 0 ? 0 : idx + 1) % WD_CYCLE.length];
  obj[field]  = next;
  el.textContent = next;
  el.className   = `wd-status ${scls(next)}`;
}

// ── 내용 입력 ──────────────────────────────────────────────────
function wdNoteInput(el) {
  if (currentProject?.slug === 'yeosu') { wdNoteInputYeosu(el); return; }
  const bi = +el.dataset.bi;
  const ii = +el.dataset.ii;
  wdRows[bi].ims[ii].note = el.value;
}

// ════════════════════════════════════════════════════════════════
// 여수 전용 렌더러
// ════════════════════════════════════════════════════════════════
function st(v, gi, si, ii, field, section) {
  return `<td class="wd-status ${scls(v)}" data-section="${section}" data-gi="${gi}" data-si="${si}" data-ii="${ii}" data-field="${field}" onclick="wdCycle(this)">${v}</td>`;
}

function renderWDTableYeosu(wrap) {
  const dyn = wdRows.dynamic || [];
  const sei = wdRows.seismic || [];
  const memo = wdRows.memo || '';

  // ── 동적/정적 계측 테이블 ──
  let h = `<div class="wd-section-title">동적/정적 계측</div>
  <table class="wd-table"><thead>
    <tr>
      <th rowspan="2" class="wd-th-site" style="min-width:48px">공구</th>
      <th rowspan="2" class="wd-th-site">사이트</th>
      <th rowspan="2" class="wd-th-sm">원격<br>접속</th>
      <th rowspan="2" class="wd-th-ims">IMS</th>
      <th rowspan="2" class="wd-th-sm">서버</th>
      <th colspan="2" class="wd-th-group">상태 정보</th>
      <th rowspan="2" class="wd-th-sm">관리<br>기준</th>
      <th rowspan="2" class="wd-th-sm">HDD</th>
      <th rowspan="2" class="wd-th-note">내용</th>
    </tr>
    <tr><th class="wd-th-sm">DAM</th><th class="wd-th-sm">데이터<br>수집</th></tr>
  </thead><tbody>`;

  dyn.forEach((grp, gi) => {
    if (grp.isNAS) {
      (grp.nas || []).forEach((nas, ni) => {
        h += `<tr>`;
        if (ni === 0) h += `<td class="wd-site" colspan="4" rowspan="${grp.nas.length}">NAS</td>`;
        h += `<td class="wd-ims-name" colspan="2">${nas.n}</td><td></td><td></td>`;
        h += st(nas.hdd, gi, -1, ni, 'hdd', 'dynamic-nas');
        h += `<td class="wd-note-cell"><input class="wd-note-input" value="${(nas.note||'').replace(/"/g,'&quot;')}" data-section="dynamic-nas" data-gi="${gi}" data-ni="${ni}" oninput="wdNoteInput(this)"></td>`;
        h += `</tr>`;
      });
      return;
    }

    const totalIms = grp.sites.reduce((s, site) => s + site.ims.length, 0);
    let grpDone = false;

    grp.sites.forEach((site, si) => {
      site.ims.forEach((ims, ii) => {
        h += `<tr>`;
        if (!grpDone) {
          h += `<td class="wd-site" rowspan="${totalIms}">${grp.g}</td>`;
          h += st(grp.svr, gi, -1, -1, 'svr', 'dynamic').replace('<td ', `<td rowspan="${totalIms}" `);
          h += st(grp.mgt, gi, -1, -1, 'mgt', 'dynamic').replace('<td ', `<td rowspan="${totalIms}" `);
          h += st(grp.hdd, gi, -1, -1, 'hdd', 'dynamic').replace('<td ', `<td rowspan="${totalIms}" `);
          const noteVal = (grp.note||'').replace(/</g,'&lt;');
          h += `<td class="wd-note-cell" rowspan="${totalIms}"><textarea class="wd-note-input wd-note-ta" data-section="dynamic" data-gi="${gi}" data-si="-1" oninput="wdNoteInput(this)">${noteVal}</textarea></td>`;
          grpDone = true;
        }
        if (ii === 0) {
          h += `<td class="wd-site" rowspan="${site.ims.length}">${site.b}</td>`;
          h += st(site.r, gi, si, -1, 'r', 'dynamic').replace('<td ', `<td rowspan="${site.ims.length}" `);
        }
        h += `<td class="wd-ims-name">${ims.n}</td>`;
        h += st(ims.dam, gi, si, ii, 'dam', 'dynamic');
        h += st(ims.dat, gi, si, ii, 'dat', 'dynamic');
        h += `</tr>`;
      });
    });
  });
  h += `</tbody></table>`;

  // ── 지진 계측 테이블 ──
  h += `<div class="wd-section-title" style="margin-top:18px">지진 계측</div>
  <table class="wd-table"><thead>
    <tr>
      <th class="wd-th-site" style="min-width:48px">공구</th>
      <th class="wd-th-site">사이트</th>
      <th class="wd-th-sm">서버</th>
      <th class="wd-th-ims">IMS</th>
      <th class="wd-th-sm">데이터<br>수집</th>
      <th class="wd-th-note">내용</th>
    </tr>
  </thead><tbody>`;

  sei.forEach((grp, gi) => {
    const totalIms = grp.sites.reduce((s, site) => s + site.ims.length, 0);
    let grpDone = false;
    grp.sites.forEach((site, si) => {
      site.ims.forEach((ims, ii) => {
        h += `<tr>`;
        if (!grpDone) { h += `<td class="wd-site" rowspan="${totalIms}">${grp.g}</td>`; grpDone = true; }
        if (ii === 0) {
          h += `<td class="wd-site" rowspan="${site.ims.length}">${site.b}</td>`;
          h += st(site.svr, gi, si, -1, 'svr', 'seismic').replace('<td ', `<td rowspan="${site.ims.length}" `);
        }
        h += `<td class="wd-ims-name">${ims.n}</td>`;
        h += st(ims.dat, gi, si, ii, 'dat', 'seismic');
        const noteVal = (ims.note||'').replace(/"/g,'&quot;');
        h += `<td class="wd-note-cell"><input class="wd-note-input" value="${noteVal}" data-section="seismic" data-gi="${gi}" data-si="${si}" data-ii="${ii}" oninput="wdNoteInput(this)"></td>`;
        h += `</tr>`;
      });
    });
  });
  h += `</tbody></table>`;

  // ── 전달사항 ──
  const memoVal = memo.replace(/</g,'&lt;');
  h += `<div class="wd-section-title" style="margin-top:18px">전달사항</div>
  <textarea class="wd-note-input wd-memo-ta" data-section="memo" oninput="wdNoteInput(this)">${memoVal}</textarea>`;

  wrap.innerHTML = h;
}

// ── 여수 상태 클릭 ─────────────────────────────────────────────
function wdCycleYeosu(el) {
  const { section, gi, si, ii, field } = { ...el.dataset, gi:+el.dataset.gi, si:+el.dataset.si, ii:+el.dataset.ii };
  const cur  = el.textContent.trim() || '○';
  const next = WD_CYCLE[(WD_CYCLE.indexOf(cur) + 1) % WD_CYCLE.length];
  el.textContent = next;
  el.className   = `wd-status ${scls(next)}`;

  if (section === 'dynamic-nas') { wdRows.dynamic[gi].nas[ii].hdd = next; return; }
  if (section === 'dynamic') {
    const grp = wdRows.dynamic[gi];
    if (si < 0)      grp[field] = next;
    else if (ii < 0) grp.sites[si][field] = next;
    else             grp.sites[si].ims[ii][field] = next;
  }
  if (section === 'seismic') {
    const grp = wdRows.seismic[gi];
    if (ii < 0) grp.sites[si][field] = next;
    else        grp.sites[si].ims[ii][field] = next;
  }
}

// ── 여수 내용 입력 ─────────────────────────────────────────────
function wdNoteInputYeosu(el) {
  const { section, gi, si, ii } = { ...el.dataset, gi:+el.dataset.gi, si:+el.dataset.si, ii:+el.dataset.ii };
  if (section === 'memo')        { wdRows.memo = el.value; return; }
  if (section === 'dynamic-nas') { wdRows.dynamic[gi].nas[el.dataset.ni].note = el.value; return; }
  if (section === 'dynamic') {
    if (si < 0) wdRows.dynamic[gi].note = el.value;
    else        wdRows.dynamic[gi].sites[si].ims[ii].note = el.value;
  }
  if (section === 'seismic') {
    wdRows.seismic[gi].sites[si].ims[ii].note = el.value;
  }
}
