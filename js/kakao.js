function openKakaoModal() {
  document.getElementById('kakao-modal-overlay').classList.add('open');
  document.getElementById('kakao-status').textContent = '';
  document.getElementById('kakao-status').style.color = '#888';
  document.getElementById('kakao-to').value = '';
}

function closeKakaoModal() {
  document.getElementById('kakao-modal-overlay').classList.remove('open');
}

function handleKakaoOverlayClick(e) {
  if (e.target === document.getElementById('kakao-modal-overlay')) closeKakaoModal();
}

async function sendKakaoNotify() {
  const statusEl = document.getElementById('kakao-status');
  const to = document.getElementById('kakao-to').value.trim().replace(/-/g, '');
  if (!to) { statusEl.textContent = '수신 번호를 입력해주세요.'; return; }

  statusEl.style.color = '#888';
  statusEl.textContent = '발송 중...';

  const payload = {
    to,
    stdCount: 1, stdMsg: '테스트_관리기준치',
    netCount: 1, netMsg: '테스트_네트워크이상',
    dsdCount: 1, dsdMsg: '테스트_데이터수집지연',
    pgmCount: 1, pgmMsg: '테스트_프로그램이상',
    hddCount: 1, hddMsg: '테스트_디스크용량초과',
  };

  try {
    const res = await fetch('https://aimurxmqzrgajsuvhllz.supabase.co/functions/v1/kakao-notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sb_publishable_l7nSkAIL9W8dNonKauFQ4A_RpDA1JmU'
      },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.code === '1000') {
      statusEl.style.color = '#00c853';
      statusEl.textContent = '✅ 발송 완료!';
      setTimeout(closeKakaoModal, 1500);
    } else {
      statusEl.style.color = '#e74c3c';
      statusEl.textContent = '❌ 실패: ' + (result.message || JSON.stringify(result));
    }
  } catch (e) {
    statusEl.style.color = '#e74c3c';
    statusEl.textContent = '❌ 오류: ' + e.message;
  }
}
