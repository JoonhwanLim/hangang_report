const BIZPPURIO_ACCOUNT    = 'amiesoft'
const BIZPPURIO_PASSWORD   = 'dkalthvmxm!5131'
const BIZPPURIO_FROM       = '01091115131'
const BIZPPURIO_SENDER_KEY = 'b0ce1e7658df21e904249234686c78be1e2b86b7'

function openKakaoModal() {
  document.getElementById('kakao-modal-overlay').classList.add('open')
  document.getElementById('kakao-status').textContent = ''
  document.getElementById('kakao-status').style.color = '#888'
  document.getElementById('kakao-to').value = ''
}

function closeKakaoModal() {
  document.getElementById('kakao-modal-overlay').classList.remove('open')
}

function handleKakaoOverlayClick(e) {
  if (e.target === document.getElementById('kakao-modal-overlay')) closeKakaoModal()
}

async function getBizToken() {
  const basic = btoa(unescape(encodeURIComponent(`${BIZPPURIO_ACCOUNT}:${BIZPPURIO_PASSWORD}`)))
  const res = await fetch('https://api.bizppurio.com/v1/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      'Authorization': `Basic ${basic}`
    }
  })
  return await res.json()
}

async function sendKakaoNotify() {
  const statusEl = document.getElementById('kakao-status')
  const to = document.getElementById('kakao-to').value.trim().replace(/-/g, '')
  if (!to) { statusEl.textContent = '수신 번호를 입력해주세요.'; return }

  statusEl.style.color = '#888'
  statusEl.textContent = '토큰 발급 중...'

  try {
    const tokenData = await getBizToken()
    if (tokenData.code !== 1000) {
      statusEl.style.color = '#e74c3c'
      statusEl.textContent = '❌ 토큰 오류: ' + tokenData.description
      return
    }

    const token = tokenData.accesstoken
    const type  = tokenData.type || 'Bearer'

    statusEl.textContent = '발송 중...'

    const message =
`[선소대교 계측시스템 이벤트정보]

■ 관리기준치 초과 (1)
 테스트_관리기준치

■ 네트워크 상태 이상 (1)
 테스트_네트워크이상

■ 데이터 수집 지연 (1)
 테스트_데이터수집지연

■ 프로그램 상태 이상 (1)
 테스트_프로그램이상

■ 디스크 용량 초과 (1)
 테스트_디스크용량초과`

    const res = await fetch('https://api.bizppurio.com/v3/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'Authorization': `${type} ${token}`
      },
      body: JSON.stringify({
        account: BIZPPURIO_ACCOUNT,
        refkey: 'amiesoft' + Date.now(),
        type: 'at',
        from: BIZPPURIO_FROM,
        to,
        content: {
          at: {
            senderkey: BIZPPURIO_SENDER_KEY,
            templatecode: 'SSEVT01',
            message
          }
        },
        resend: { first: 'lms' },
        recontent: { lms: { message } }
      })
    })

    const result = await res.json()
    console.log('send response:', result)

    if (result.code === 1000) {
      statusEl.style.color = '#00c853'
      statusEl.textContent = '✅ 발송 완료!'
      setTimeout(closeKakaoModal, 1500)
    } else {
      statusEl.style.color = '#e74c3c'
      statusEl.textContent = '❌ 실패: ' + (result.description || JSON.stringify(result))
    }
  } catch (e) {
    statusEl.style.color = '#e74c3c'
    statusEl.textContent = '❌ 오류: ' + e.message
  }
}
