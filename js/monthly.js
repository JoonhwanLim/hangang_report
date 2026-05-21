/* ════════════════════════════════════════════════════════════════
   monthly.js — 월간 보고서 생성 (어드민 전용)
   ════════════════════════════════════════════════════════════════ */

function openMonthlyModal() {
  const today = new Date();
  const curYear  = today.getFullYear();
  const curMonth = today.getMonth() + 1;

  const yearSel = document.getElementById('mr-year');
  yearSel.innerHTML = '';
  for (let y = curYear - 2; y <= curYear; y++) {
    yearSel.innerHTML += `<option value="${y}"${y === curYear ? ' selected' : ''}>${y}년</option>`;
  }

  updateMrMonths();
  document.getElementById('mr-status').textContent = '';
  document.getElementById('monthly-modal-overlay').classList.add('open');
}

function updateMrMonths() {
  const today    = new Date();
  const curYear  = today.getFullYear();
  const curMonth = today.getMonth() + 1;
  const selYear  = +document.getElementById('mr-year').value;
  const monSel   = document.getElementById('mr-month');
  const prevVal  = +monSel.value || curMonth;

  monSel.innerHTML = '';
  const maxMonth = selYear === curYear ? curMonth : 12;
  for (let m = 1; m <= maxMonth; m++) {
    monSel.innerHTML += `<option value="${m}"${m === Math.min(prevVal, maxMonth) ? ' selected' : ''}>${m}월</option>`;
  }
}

function closeMonthlyModal() {
  document.getElementById('monthly-modal-overlay').classList.remove('open');
}

function handleMonthlyOverlayClick(e) {
  if (e.target === document.getElementById('monthly-modal-overlay')) closeMonthlyModal();
}

async function generateMonthlyReport() {
  const year  = +document.getElementById('mr-year').value;
  const month = +document.getElementById('mr-month').value;
  const btn   = document.getElementById('mr-gen-btn');
  const stat  = document.getElementById('mr-status');

  btn.disabled = true;
  btn.textContent = '생성 중…';
  stat.textContent = '데이터 로드 중…';

  try {
    const html = await buildMonthlyHTML(year, month, s => { stat.textContent = s; });
    const win  = window.open('', '_blank');
    if (!win) { alert('팝업이 차단되었습니다. 브라우저 팝업 차단을 해제해주세요.'); return; }
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 900);
    stat.textContent = '✓ 완료';
  } catch (e) {
    console.error('[generateMonthlyReport]', e);
    stat.textContent = '오류: ' + e.message;
  } finally {
    btn.textContent = '생성';
    btn.disabled = false;
  }
}

// ── 월간 HTML 빌드 ─────────────────────────────────────────────
async function buildMonthlyHTML(year, month, onStatus) {
  const pad   = n => String(n).padStart(2, '0');
  const start = `${year}-${pad(month)}-01`;
  const end   = `${year}-${pad(month)}-${new Date(year, month, 0).getDate()}`;
  const slug  = currentProject?.slug || null;

  onStatus?.('이슈 / 작업상세 / 투입인력 로드 중…');
  const [allIssues, wdMap, personnelMap] = await Promise.all([
    mrFetchIssues(start, end, slug),
    mrFetchWorkDetails(start, end, slug),
    mrFetchPersonnel(start, end, slug),
  ]);

  const today       = todayStr();
  const daysInMonth = new Date(year, month, 0).getDate();
  const DAY_KO      = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const CLOSED      = new Set(['완료', '보류']);
  const projName    = currentProject?.name || '교량 안전감시 시스템';

  let pagesHtml = '';
  let dayCount  = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${pad(month)}-${pad(d)}`;
    if (dateStr > today) break;
    dayCount++;
    onStatus?.(`${month}월 ${d}일 렌더링 중… (${dayCount}일)`);

    const vis = allIssues.filter(i => {
      const reg = (i.regDate || i.reg_date || '').slice(0, 10);
      if (reg > dateStr) return false;
      if (CLOSED.has(i.status)) return (i.closed_date || dateStr).slice(0, 10) >= dateStr;
      return true;
    });

    const total  = vis.length;
    const counts = { '대기중': 0, '진행중': 0, '완료': 0, '보류': 0 };
    vis.forEach(i => { if (i.status in counts) counts[i.status]++; });

    const dt        = new Date(dateStr + 'T00:00:00');
    const dateLabel = `${year}년 ${pad(month)}월 ${pad(d)}일 (${DAY_KO[dt.getDay()]})`;
    const personnel = personnelMap[dateStr] || '';

    const grouped = {};
    vis.forEach(i => { (grouped[i.bridge] = grouped[i.bridge] || []).push(i); });

    let issHtml = '';
    Object.entries(grouped).forEach(([bridge, list]) => {
      issHtml += `<div class="bb"><div class="bn">${bridge}<span class="bcnt"> ${list.length}건</span></div>`;
      list.forEach(iss => {
        const isNew  = (iss.regDate || iss.reg_date || '').slice(0, 10) === dateStr;
        const SC_COL = { '대기중': '#e67e00', '진행중': '#3a6dbf', '완료': '#00a844', '보류': '#8899bb' };
        const col    = SC_COL[iss.status] || '#888';
        const act    = lastActionLine(iss.action);
        issHtml += `<div class="ii">
          <div class="ibar" style="background:${col}"></div>
          <div class="ic">
            <div class="ip">${isNew ? '<span class="bnew">NEW</span>' : ''}${iss.problem}${iss.ongoing ? '<span class="burg">긴급</span>' : ''}<span class="bcat">${iss.category || ''}</span></div>
            <div class="im">등록: ${(iss.regDate || iss.reg_date || '').slice(0, 10)}${iss.assignee ? ` · 담당: ${iss.assignee}` : ''}</div>
            ${act ? `<div class="ia">🔧 ${act}</div>` : ''}
          </div>
          <div class="sp" style="color:${col};border-color:${col}">${iss.status}</div>
        </div>`;
      });
      issHtml += `</div>`;
    });
    if (!issHtml) issHtml = '<div class="noiss">이슈 없음</div>';

    const wdData = wdMap[dateStr];
    const wdHtml = wdData ? mrBuildWD(wdData, slug) : '';

    pagesHtml += `<div class="dp">
      <div class="rh">
        <div class="rt">${projName} — 일일 운영 보고서</div>
        <div class="rr">
          <span class="rd">${dateLabel}</span>
          ${personnel ? `<span class="rp">투입인력: ${personnel}</span>` : ''}
        </div>
      </div>
      <div class="sr">
        <div class="sb"><span class="sl">전체</span><span class="sv">${total}</span></div>
        <div class="sb w"><span class="sl">대기중</span><span class="sv sw">${counts['대기중']}</span></div>
        <div class="sb p"><span class="sl">진행중</span><span class="sv sp2">${counts['진행중']}</span></div>
        <div class="sb d"><span class="sl">완료</span><span class="sv sd">${counts['완료']}</span></div>
      </div>
      <div class="iw">${issHtml}</div>
      ${wdHtml ? `<div class="ww">${wdHtml}</div>` : ''}
    </div>`;
  }

  return `<!DOCTYPE html><html lang="ko"><head>
  <meta charset="UTF-8">
  <title>${projName} ${year}년 ${month}월 월간보고서</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pretendard@latest/dist/web/static/pretendardgov.css">
  <style>${mrCSS()}</style>
</head><body>${pagesHtml}</body></html>`;
}

// ── 데이터 페치 ────────────────────────────────────────────────
async function mrFetchIssues(start, end, slug) {
  if (!sbClient) return [];
  try {
    let q = sbClient.from('issues').select('*').lte('reg_date', end).order('reg_date');
    if (slug) q = q.eq('project_slug', slug);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).map(r => ({
      ...r, regDate: r.reg_date, comments: r.comments || [],
    }));
  } catch (e) { console.error('[mrFetchIssues]', e); return []; }
}

async function mrFetchWorkDetails(start, end, slug) {
  if (!sbClient) return {};
  try {
    let q = sbClient.from('daily_work_details')
      .select('report_date, data')
      .gte('report_date', start).lte('report_date', end);
    if (slug) q = q.eq('project_slug', slug);
    const { data, error } = await q;
    if (error) throw error;
    const map = {};
    (data || []).forEach(r => { map[r.report_date] = r.data; });
    return map;
  } catch (e) { console.error('[mrFetchWorkDetails]', e); return {}; }
}

async function mrFetchPersonnel(start, end, slug) {
  if (!sbClient) return {};
  try {
    let q = sbClient.from('generated_reports')
      .select('report_date, personnel')
      .gte('report_date', start).lte('report_date', end)
      .not('personnel', 'is', null);
    if (slug) q = q.eq('project_slug', slug);
    const { data, error } = await q;
    if (error) throw error;
    const map = {};
    (data || []).forEach(r => { if (r.personnel) map[r.report_date] = r.personnel; });
    return map;
  } catch (e) { console.error('[mrFetchPersonnel]', e); return {}; }
}

// ── 작업상세 HTML ──────────────────────────────────────────────
function mrBuildWD(wdData, slug) {
  return slug === 'yeosu' ? mrBuildYeosuWD(wdData) : mrBuildHangangWD(wdData);
}

function sct(v) {
  const cls = v === '○' ? 'ok' : v === '△' ? 'wn2' : v === '✕' ? 'ng' : 'na';
  return `<td class="wsc ${cls}">${v || ''}</td>`;
}

function mrBuildHangangWD(rows) {
  if (!rows?.length) return '';
  let h = `<div class="wdt">작업 상세 내용</div>
  <table class="wt"><thead>
    <tr><th rowspan="2">사이트</th><th rowspan="2">원격</th><th rowspan="2">IMS</th>
      <th colspan="4">상태 정보</th><th rowspan="2">HDD</th><th rowspan="2">내용</th></tr>
    <tr><th>DAM</th><th>DAQ</th><th>데이터수집</th><th>관리기준</th></tr>
  </thead><tbody>`;

  rows.forEach(br => {
    const span = br.ims.length;
    br.ims.forEach((im, ii) => {
      h += `<tr>`;
      if (ii === 0) {
        h += `<td rowspan="${span}" class="ws">${br.b}</td>`;
        h += sct(br.r).replace('<td ', `<td rowspan="${span}" `);
      }
      h += `<td class="wi">${im.n}</td>`;
      ['dam', 'daq', 'dat', 'mgt'].forEach(f => { h += sct(im[f]); });
      if (ii === 0) h += sct(br.hdd).replace('<td ', `<td rowspan="${span}" `);
      h += `<td class="wno">${im.note || ''}</td></tr>`;
    });
  });
  return h + `</tbody></table>`;
}

function mrBuildYeosuWD(wdData) {
  const dyn  = wdData.dynamic  || [];
  const sei  = wdData.seismic  || [];
  const memo = wdData.memo     || '';

  let h = `<div class="wdt">작업 상세 내용</div>
  <table class="wt"><thead>
    <tr><th colspan="2" rowspan="2">사이트</th><th rowspan="2">원격</th>
      <th colspan="2">IMS</th><th colspan="3">상태 정보</th><th rowspan="2">HDD</th><th rowspan="2">내용</th></tr>
    <tr><th>명칭</th><th>서버</th><th>DAM</th><th>데이터수집</th><th>관리기준</th></tr>
  </thead><tbody>`;

  dyn.forEach((grp) => {
    if (grp.isNAS) {
      (grp.nas || []).forEach((nas, ni) => {
        h += `<tr>`;
        if (ni === 0) h += `<td colspan="3" rowspan="${grp.nas.length}" class="ws" style="text-align:center">NAS</td>`;
        h += `<td class="wi" colspan="5">${nas.n}</td>`;
        h += sct(nas.hdd);
        h += `<td class="wno">${nas.note || ''}</td></tr>`;
      });
      return;
    }
    const totalIms = grp.sites.reduce((s, site) => s + site.ims.length, 0);
    let grpDone = false;
    grp.sites.forEach((site) => {
      site.ims.forEach((ims, ii) => {
        h += `<tr>`;
        if (!grpDone) h += `<td class="ws" rowspan="${totalIms}">${grp.g}</td>`;
        if (ii === 0) {
          h += `<td class="ws" rowspan="${site.ims.length}">${site.b}</td>`;
          h += sct(site.r).replace('<td ', `<td rowspan="${site.ims.length}" `);
        }
        h += `<td class="wi">${ims.n}</td>`;
        if (!grpDone) h += sct(grp.svr).replace('<td ', `<td rowspan="${totalIms}" `);
        h += sct(ims.dam) + sct(ims.dat);
        if (!grpDone) {
          h += sct(grp.mgt).replace('<td ', `<td rowspan="${totalIms}" `);
          h += sct(grp.hdd).replace('<td ', `<td rowspan="${totalIms}" `);
          h += `<td class="wno" rowspan="${totalIms}">${(grp.note || '').replace(/\n/g, '<br>')}</td>`;
          grpDone = true;
        }
        h += `</tr>`;
      });
    });
  });
  h += `</tbody></table>`;

  if (sei.length) {
    h += `<div class="wds">지진 계측</div>
    <table class="wt"><thead>
      <tr><th colspan="2">사이트</th><th>서버</th><th>IMS 명칭</th><th>데이터수집</th><th>내용</th></tr>
    </thead><tbody>`;
    sei.forEach(grp => {
      const totalIms = grp.sites.reduce((s, site) => s + site.ims.length, 0);
      let grpDone = false;
      grp.sites.forEach(site => {
        site.ims.forEach((ims, ii) => {
          h += `<tr>`;
          if (!grpDone) { h += `<td class="ws" rowspan="${totalIms}">${grp.g}</td>`; grpDone = true; }
          if (ii === 0) {
            h += `<td class="ws" rowspan="${site.ims.length}">${site.b}</td>`;
            h += sct(site.svr).replace('<td ', `<td rowspan="${site.ims.length}" `);
          }
          h += `<td class="wi">${ims.n}</td>` + sct(ims.dat);
          h += `<td class="wno">${ims.note || ''}</td></tr>`;
        });
      });
    });
    h += `</tbody></table>`;
  }

  if (memo) h += `<div class="wds">전달사항</div><div class="wmemo">${memo.replace(/\n/g, '<br>')}</div>`;
  return h;
}

// ── 인쇄용 CSS ────────────────────────────────────────────────
function mrCSS() {
  return `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'PretendardGOV','Pretendard',sans-serif;font-size:11px;color:#111;background:#fff}
@page{size:A4;margin:12mm 14mm}
@media print{.dp{page-break-before:always}.dp:first-child{page-break-before:auto}}
.dp{padding-bottom:10px}

.rh{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #1a2740;padding-bottom:6px;margin-bottom:8px}
.rt{font-size:13px;font-weight:700;color:#1a2740}
.rr{display:flex;flex-direction:column;align-items:flex-end;gap:3px}
.rd{font-size:11px;color:#333}
.rp{font-size:10px;color:#555;background:#f0f4fa;padding:2px 8px;border-radius:10px}

.sr{display:flex;gap:5px;margin-bottom:8px}
.sb{flex:1;border:1px solid #ddd;border-radius:5px;padding:4px 8px;display:flex;justify-content:space-between;align-items:center}
.sb.w{border-color:#ff9500;background:rgba(255,149,0,.05)}
.sb.p{border-color:#5b8fd6;background:rgba(91,143,214,.05)}
.sb.d{border-color:#00c853;background:rgba(0,200,83,.05)}
.sl{font-size:10px;color:#777}
.sv{font-size:17px;font-weight:700;color:#1a2740}
.sw{color:#e67e00}.sp2{color:#3a6dbf}.sd{color:#00a844}

.bb{margin-bottom:5px;border:1px solid #dce4f0;border-radius:5px;overflow:hidden}
.bn{font-weight:700;font-size:11px;background:#eef2fa;padding:4px 9px;border-bottom:1px solid #dce4f0}
.bcnt{font-weight:400;font-size:10px;color:#888}
.ii{display:flex;align-items:stretch}
.ibar{width:3px;flex-shrink:0}
.ic{flex:1;padding:4px 8px;border-top:1px solid #f0f0f0}
.ip{font-size:11px;font-weight:600;margin-bottom:2px}
.im{font-size:10px;color:#888;margin-bottom:2px}
.ia{font-size:10px;color:#444}
.sp{align-self:center;margin:4px 8px 4px 0;padding:2px 7px;border:1px solid;border-radius:10px;font-size:10px;font-weight:600;white-space:nowrap}
.bnew{display:inline-block;background:#e74c3c;color:#fff;font-size:8px;font-weight:700;padding:1px 4px;border-radius:3px;margin-right:3px;vertical-align:middle}
.burg{display:inline-block;background:#ff9500;color:#fff;font-size:8px;font-weight:700;padding:1px 4px;border-radius:3px;margin-left:3px;vertical-align:middle}
.bcat{display:inline-block;background:#e8ecf5;color:#555;font-size:9px;padding:1px 5px;border-radius:3px;margin-left:3px;vertical-align:middle}
.noiss{padding:8px;text-align:center;color:#bbb;font-size:11px}

.ww{margin-top:8px}
.wdt{font-size:11px;font-weight:700;color:#1a2740;padding:5px 0 3px;border-top:2px solid #1a2740;margin-top:10px;margin-bottom:3px}
.wds{font-size:10px;font-weight:700;color:#333;margin:6px 0 2px}
.wmemo{font-size:10px;color:#333;background:#f8f9fb;border:1px solid #ddd;border-radius:3px;padding:5px 8px;white-space:pre-wrap;margin-bottom:4px}
.wt{width:100%;border-collapse:collapse;font-size:9px;margin-bottom:4px}
.wt th{background:#253550;color:#fff;padding:3px;text-align:center;border:1px solid #3a4f70;white-space:nowrap}
.wt td{border:1px solid #cdd6e8;padding:2px 4px;vertical-align:middle}
.ws{font-weight:600;color:#2d5ca8;background:rgba(91,143,214,.04);text-align:center;white-space:nowrap}
.wi{text-align:left}.wsc{text-align:center;font-weight:600}.wno{text-align:left;font-size:8.5px;color:#444}
.ok{color:#00a844}.wn2{color:#e67e00}.ng{color:#e74c3c;font-weight:700}.na{color:#aaa}`;
}
