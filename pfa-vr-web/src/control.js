// control.js — Halaman kontrol sesi (dimuat hanya saat ?role=control).
// Menampilkan status sesi yang dipublikasikan Quest (role=vr) lewat relay WS lokal,
// mengirim perintah (stop/next/prev/goto/auto), dan menampilkan log realtime.
import { getState, subscribe, connectControl, sendCommand, log } from './session-state.js'
import { SCENES, PLAYLIST } from './scenes/script-data.js'

// Judul per LANGKAH main aktif (PLAYLIST), bukan 7 scene gudang — samakan dengan navbar VR &
// dengan goTo() yang mengindeks PLAYLIST. s2 muncul 2× → judul "Latihan Pernapasan" tampil 2×.
const byId = (id) => SCENES.find((s) => s.id === id)
const TITLES = PLAYLIST.map((id) => byId(id).judul)

function css() {
  return `
  <style id="control-style">
    #screen-control { position: fixed; inset: 0; background: #0e2a25; color: #e9f2ec;
      font-family: system-ui, sans-serif; padding: 24px; box-sizing: border-box; overflow: auto; z-index: 9999;
      pointer-events: auto; /* #ui is pointer-events:none — control page must receive clicks */ }
    #screen-control h1 { font-size: 22px; margin: 0 0 4px; color: #a8d5ba; }
    #screen-control .sub { color: #9db8aa; font-size: 13px; margin-bottom: 16px; }
    #screen-control .panel { background: #14322b; border: 1px solid #1f463c; border-radius: 10px; padding: 14px 16px; margin-bottom: 14px; }
    #screen-control .row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    #screen-control .stat { flex: 1; min-width: 130px; }
    #screen-control .stat .k { font-size: 11px; color: #9db8aa; text-transform: uppercase; letter-spacing: .4px; }
    #screen-control .stat .v { font-size: 18px; font-weight: 600; margin-top: 2px; }
    #screen-control .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    #screen-control .badge.on { background: #2c5344; color: #b9e8c8; }
    #screen-control .badge.off { background: #5a2f2f; color: #f4c4c4; }
    #screen-control .badge.run { background: #2c5344; color: #b9e8c8; }
    #screen-control .badge.stop { background: #4a4a4a; color: #ddd; }
    #screen-control button { font: inherit; border: 0; border-radius: 8px; padding: 10px 14px; cursor: pointer; font-weight: 600; }
    #screen-control .btn-stop { background: #8a2f2f; color: #ffeaea; }
    #screen-control .btn-next { background: #2c5344; color: #dff2e4; }
    #screen-control .btn-prev { background: #2f4a3a; color: #dff2e4; }
    #screen-control .btn-auto { background: #3a3a3a; color: #eee; font-size: 13px; }
    #screen-control .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(64px, 1fr)); gap: 6px; }
    #screen-control .grid button { background: #1f463c; color: #dff2e4; padding: 8px 4px; font-size: 13px; }
    #screen-control .grid button.cur { background: #3c7d63; }
    #screen-control .loglist { max-height: 240px; overflow: auto; font-family: ui-monospace, Menlo, monospace; font-size: 12px; }
    #screen-control .loglist div { border-bottom: 1px solid #1c3a31; padding: 3px 0; color: #cfe8d6; }
    #screen-control .loglist .t { color: #7fa894; margin-right: 6px; }
    #screen-control .conn { font-size: 12px; color: #d9c26a; }
    #screen-control a { color: #a8d5ba; }
    hr { border: 0; border-top: 1px solid #1f463c; margin: 10px 0; }
    .muted { color: #9db8aa; font-size: 12px; }
  </style>`
}

export function renderControl() {
  document.head.insertAdjacentHTML('beforeend', css())
  const ui = document.getElementById('ui')
  const root = document.createElement('div')
  root.id = 'screen-control'
  ui.innerHTML = ''
  ui.appendChild(root)

  const connUrl = getState().controlUrl
  root.innerHTML = `
    <h1>Kontrol Sesi PFA-VR</h1>
    <div class="sub">Memantau & mengendalikan sesi yang berjalan (role=vr) lewat relay lokal.
      <br/>Relay: <span class="conn">${connUrl || '(belum terhubung)'}</span></div>

    <div class="panel">
      <div class="row">
        <div class="stat"><div class="k">Status</div><div id="ctl-status" class="v"><span class="badge stop">Menunggu sesi…</span></div></div>
        <div class="stat"><div class="k">Scene</div><div id="ctl-scene" class="v">—</div></div>
        <div class="stat"><div class="k">Auto-lanjut</div><div id="ctl-auto" class="v"><span class="badge off">OFF</span></div></div>
      </div>
    </div>

    <div class="panel">
      <div class="row">
        <button class="btn-stop" id="ctl-stop">⏹ Hentikan Sesi</button>
        <button class="btn-prev" id="ctl-prev">‹ Sebelumnya</button>
        <button class="btn-next" id="ctl-next">Selanjutnya ›</button>
        <button class="btn-auto" id="ctl-auto-btn">Auto-lanjut: ON/OFF</button>
      </div>
      <hr/>
      <div class="muted" style="margin-bottom:6px">Lompat ke scene:</div>
      <div class="grid" id="ctl-jump"></div>
    </div>

    <div class="panel">
      <div class="row" style="justify-content:space-between">
        <span class="k" style="font-size:12px;color:#9db8aa;text-transform:uppercase;letter-spacing:.4px">Log sesi</span>
        <button class="btn-auto" id="ctl-clear">Bersihkan</button>
      </div>
      <div class="loglist" id="ctl-log"></div>
    </div>
  `

  // tombol lompat
  const jump = root.querySelector('#ctl-jump')
  TITLES.forEach((t, i) => {
    const b = document.createElement('button')
    b.textContent = String(i + 1)
    b.title = t
    b.addEventListener('click', () => sendCommand({ op: 'goto', idx: i }))
    jump.appendChild(b)
  })

  // tombol aksi -> kirim perintah ke sesi VR lewat relay
  root.querySelector('#ctl-stop').addEventListener('click', () => sendCommand({ op: 'stop' }))
  root.querySelector('#ctl-prev').addEventListener('click', () => sendCommand({ op: 'prev' }))
  root.querySelector('#ctl-next').addEventListener('click', () => sendCommand({ op: 'next' }))
  root.querySelector('#ctl-auto-btn').addEventListener('click', () => {
    sendCommand({ op: 'setAuto', value: !getState().autoAdvance })
  })

  root.querySelector('#ctl-clear').addEventListener('click', () => {
    root.querySelector('#ctl-log').innerHTML = ''
  })

  // render state setiap perubahan
  subscribe((s) => {
    root.querySelector('#ctl-status').innerHTML =
      `<span class="badge ${s.running ? 'run' : 'stop'}">${s.running ? 'Sesi berjalan' : 'Menunggu sesi…'}</span>`
    root.querySelector('#ctl-scene').textContent =
      s.currentIdx >= 0 ? `${s.currentIdx + 1}/${TITLES.length} — ${TITLES[s.currentIdx]}` : '—'
    root.querySelector('#ctl-auto').innerHTML =
      `<span class="badge ${s.autoAdvance ? 'on' : 'off'}">${s.autoAdvance ? 'ON' : 'OFF'}</span>`
    const crowd = root.querySelectorAll('#ctl-jump button')
    crowd.forEach((b, i) => b.classList.toggle('cur', i === s.currentIdx))
  })

  // log realtime
  let lastLen = 0
  subscribe((s) => {
    if (s.logs.length === lastLen) return
    const logEl = root.querySelector('#ctl-log')
    const fresh = s.logs.slice(lastLen)
    lastLen = s.logs.length
    fresh.forEach((e) => {
      const d = document.createElement('div')
      const t = new Date(e.t).toLocaleTimeString('id-ID')
      d.innerHTML = `<span class="t">${t}</span>${escapeHtml(e.msg)}`
      logEl.appendChild(d)
    })
    logEl.scrollTop = logEl.scrollHeight
  })

  // hubungkan ke relay sebagai control
  connectControl((cmd) => {
    // response datang dari sisi vr; state akan dipublikasikan & tampil otomatis.
    log('info', `perintah terkirim: ${cmd.op}`)
  })
}

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
}
