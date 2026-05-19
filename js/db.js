/* ════════════════════════════════════════════════════════════════
   db.js — Supabase 데이터 액세스 (load / save)
   ════════════════════════════════════════════════════════════════ */

async function load() {
  if (sbClient) {
    try {
      let q = sbClient.from('issues').select('*').order('reg_date');
      if (currentProject) q = q.eq('project_slug', currentProject.slug);
      const { data, error } = await q;
      if (!error) {
        issues = (data || []).map(r => ({
          ...r,
          regDate:      r.reg_date,
          registeredBy: r.registered_by || '',
          comments:     r.comments || [],
        }));
        return;
      }
    } catch (e) { console.error('[load]', e); }
  }
  try {
    const d = localStorage.getItem(STORAGE_KEY);
    issues = d ? JSON.parse(d) : [];
  } catch (e) { issues = []; }
}

async function loadGen() {
  if (sbClient) {
    try {
      let q = sbClient.from('generated_reports').select('report_date, generated_at');
      if (currentProject) q = q.eq('project_slug', currentProject.slug);
      const { data, error } = await q;
      if (!error && data) {
        data.forEach(r => { genDates[r.report_date] = new Date(r.generated_at).toLocaleString('ko-KR'); });
        return;
      }
    } catch (e) { console.error('[loadGen]', e); }
  }
  try {
    const g = localStorage.getItem(GEN_KEY);
    if (g) genDates = JSON.parse(g);
  } catch (e) { }
}

async function save() {
  if (sbClient) {
    try {
      const rows = issues.map(i => ({
        id:            i.id,
        bridge:        i.bridge,
        problem:       i.problem,
        action:        i.action || '',
        assignee:      i.assignee || '',
        category:      i.category || '',
        status:        i.status,
        reg_date:      i.regDate || i.reg_date,
        ongoing:       i.ongoing || false,
        registered_by: i.registeredBy || '',
        project_slug:  i.project_slug || currentProject?.slug || null,
        comments:      i.comments || [],
        attachments:   i.attachments || [],
        closed_date:   i.closed_date || null,
        updated_at:    new Date().toISOString(),
      }));
      const { error } = await sbClient.from('issues').upsert(rows, { onConflict: 'id' });
      if (error) console.error('[save]', error);
    } catch (e) { console.error('[save]', e); }
  }
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(issues)); } catch (e) { }
}

async function saveGen() {
  if (sbClient) {
    try {
      const rows = Object.keys(genDates).map(d => ({ report_date: d }));
      if (rows.length) {
        const { error } = await sbClient.from('generated_reports')
          .upsert(rows, { onConflict: 'report_date', ignoreDuplicates: true });
        if (error) console.error('[saveGen]', error);
      }
    } catch (e) { console.error('[saveGen]', e); }
  }
  try { localStorage.setItem(GEN_KEY, JSON.stringify(genDates)); } catch (e) { }
}

async function loadPersonnel() {
  if (sbClient) {
    try {
      const { data } = await sbClient.from('generated_reports').select('report_date, personnel');
      if (data) data.forEach(r => { if (r.personnel) dailyPersonnel[r.report_date] = r.personnel; });
      return;
    } catch (e) { }
  }
  try {
    const s = localStorage.getItem('hangang-personnel');
    if (s) dailyPersonnel = JSON.parse(s);
  } catch (e) { }
}

async function savePersonnel(date, val) {
  dailyPersonnel[date] = val;
  if (sbClient) {
    try {
      await sbClient.from('generated_reports')
        .upsert({ report_date: date, personnel: val, project_slug: currentProject?.slug || null }, { onConflict: 'report_date' });
    } catch (e) { console.error('[savePersonnel]', e); }
  }
  try { localStorage.setItem('hangang-personnel', JSON.stringify(dailyPersonnel)); } catch (e) { }
  updatePersonnelTitle(date, val);
}

async function migrateFromLocalStorage() {
  return; // Supabase 이전 완료 — localStorage 재업로드 방지
  if (!sbClient || localStorage.getItem('hangang-ls-migrated')) return;
  let migrated = false;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const localIssues = JSON.parse(raw);
      if (localIssues.length) {
        const rows = localIssues.map(i => ({
          id: i.id, bridge: i.bridge,
          problem: i.problem, action: i.action || '', assignee: i.assignee || '',
          category: i.category || '', status: i.status, reg_date: i.regDate || i.reg_date,
          ongoing: i.ongoing || false, comments: i.comments || [],
          attachments: i.attachments || [], closed_date: i.closed_date || null,
          updated_at: new Date().toISOString(),
        }));
        const { error } = await sbClient.from('issues').upsert(rows, { onConflict: 'id' });
        if (!error) migrated = true;
      }
    }
  } catch (e) { console.error('[migrate]', e); }

  try {
    const rawGen = localStorage.getItem(GEN_KEY);
    if (rawGen) {
      const rows = Object.keys(JSON.parse(rawGen)).map(d => ({ report_date: d }));
      if (rows.length) {
        await sbClient.from('generated_reports').upsert(rows, { onConflict: 'report_date', ignoreDuplicates: true });
        migrated = true;
      }
    }
  } catch (e) { }

  localStorage.setItem('hangang-ls-migrated', '1');
}
