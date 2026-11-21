// main.js — boot, registrasi komponen, wiring UI, environment, hook pengujian dev.

import 'aframe'
import './components/gaze-dwell.js'
import './components/gaze-highlight.js'
import './components/breathing-orb.js'
import './components/raw-hands.js'
import { initSafetyExit } from './components/safety-exit.js'
import { setVoiceGender, setMuted } from './components/audio-player.js'
import { goTo, next, prev, stopAll, finish, fireCue, advanceFromUI, PLAYLIST } from './scenes/scene-manager.js'
import { buildEnvironment } from './environment/environment.js'
import { runSelfCheck } from './selfcheck.js'
import { initDiag } from './diag.js'
import { el, inVR } from './utils.js'
import { log, err } from './dev-log.js'
import { connectControl, log as slog } from './session-state.js'
import { getAutoAdvance, setAutoAdvance } from './scenes/scene-manager.js'
import { renderControl } from './control.js'

// Mode kontrol: halaman laptop (?role=control) — render UI kontrol & hentikan boot VR.
// Henti-muati sinkron via throw; import kontrol statis (bukan dynamic import) karena target
// build es2020 melarang top-level await, dan throw sinkron mencegah boot VR di bawah turut jalan.
const CONTROL_ONLY = 'PFA-CONTROL-ONLY'
if (new URLSearchParams(location.search).get('role') === 'control') {
  document.querySelector('a-scene')?.remove()
  renderControl()
  throw new Error(CONTROL_ONLY)
}

// Kolektor error untuk verifikasi (dibaca via WebBridge evaluate).
window.__errors = []
window.addEventListener('error', (e) => { if (e.message === CONTROL_ONLY) return; window.__errors.push(String(e.message)); err('window.error:', e.message, e.filename, e.lineno) })
window.addEventListener('unhandledrejection', (e) => { if (String(e.reason) === CONTROL_ONLY) return; window.__errors.push(String(e.reason)); err('unhandledrejection:', e.reason) })

log('boot: main.js loaded — A-Frame', typeof AFRAME?.version === 'string' ? AFRAME.version : '?')

// Font default a-text dilokalkan (T6.1 offline): default 'roboto' menunjuk ke CDN cdn.aframe.io.
AFRAME.components.text.Component.prototype.schema.font.default = '/fonts/Roboto-msdf.json'

runSelfCheck()

const sceneEl = document.querySelector('a-scene')
sceneEl.addEventListener('loaded', () => buildEnvironment(sceneEl))

// gaze-dwell dipasang di kamera.
document.querySelector('a-camera').setAttribute('gaze-dwell', '')

initSafetyExit()
initDiag()

// Hook pengujian dev (dipakai verifikasi WebBridge; aman dibiarkan — tidak tampil di UI).
window.__pfa = { goTo, next, stopAll, cue: fireCue }

// ---------- Mood check (pre/post, lokal saja) ----------
const MOOD_KEY = 'pfa-mood-log'
let moodPre = null
const loadLog = () => JSON.parse(localStorage.getItem(MOOD_KEY) || '[]')

for (const id of ['mood-pre', 'mood-post']) {
  const slider = document.getElementById(id)
  slider.addEventListener('input', () => {
    document.getElementById(`${id}-value`).textContent = slider.value
  })
}

document.getElementById('btn-save-mood').addEventListener('click', (e) => {
  const post = Number(document.getElementById('mood-post').value)
  const entry = {
    at: new Date().toISOString(),
    pre: moodPre,
    post,
    suara: document.querySelector('.voice-option.selected')?.dataset.voice,
  }
  const log = loadLog()
  log.push(entry)
  localStorage.setItem(MOOD_KEY, JSON.stringify(log))
  const summary = document.getElementById('mood-summary')
  summary.textContent = `Perasaan Anda: ${moodPre ?? '–'} → ${post} · tersimpan di perangkat`
  summary.hidden = false
  e.target.disabled = true
  e.target.textContent = 'Tersimpan ✓'
})

document.getElementById('btn-download-log').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(loadLog(), null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'pfa-mood-log.json'
  a.click()
  URL.revokeObjectURL(a.href)
})

// ---------- Onboarding ----------
const picker = document.querySelector('.voice-picker')
picker.addEventListener('click', (e) => {
  const btn = e.target.closest('.voice-option')
  if (!btn) return
  picker.querySelectorAll('.voice-option').forEach((o) => {
    o.classList.toggle('selected', o === btn)
    o.setAttribute('aria-checked', o === btn)
  })
  setVoiceGender(btn.dataset.voice)
})

document.getElementById('btn-start').addEventListener('click', () => {
  moodPre = Number(document.getElementById('mood-pre').value)
  log('btn-start clicked — muted=false, moodPre=' + moodPre)
  setMuted(false)
  showScreen(null)
  goTo(0)
})

document.getElementById('btn-start-muted').addEventListener('click', () => {
  moodPre = Number(document.getElementById('mood-pre').value)
  log('btn-start-muted clicked — muted=true, moodPre=' + moodPre)
  setMuted(true)
  showScreen(null)
  goTo(0)
})

// ---------- Done / Quit ----------
document.addEventListener('pfa:done', () => {
  // Reset tombol simpan untuk sesi berikutnya.
  const saveBtn = document.getElementById('btn-save-mood')
  saveBtn.disabled = false
  saveBtn.textContent = 'Simpan'
  document.getElementById('mood-summary').hidden = true
  showScreen('screen-done')
})
document.addEventListener('pfa:quit', () => { stopAll(); showScreen('screen-onboarding') })
document.getElementById('btn-restart').addEventListener('click', () => {
  showScreen(null)
  goTo(0)
})

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) =>
    s.classList.toggle('visible', s.id === id))
}

// ---------- Subtitle (mengikuti baris VO aktif) ----------
const subtitle = document.getElementById('subtitle')
// Panel dalam-VR (T5.4): DOM tidak terlihat di headset — duplikat subtitle & status di dalam scene.
const vrSubtitleWrap = document.getElementById('vr-subtitle-wrap')
const vrSubtitle = document.getElementById('vr-subtitle')
const vrSubtitleBg = document.getElementById('vr-subtitle-bg')
const VR_SUB_WRAP = 34 // karakter per baris (samakan dengan wrap-count di index.html)
// Plane tinggi tetap 0,18 hanya muat ~2 baris; baris VO terpanjang (S7 142 kar ≈ 5 baris)
// meluber keluar plate. Tumbuhkan tinggi bg sesuai jumlah baris agar teks selalu di dalam.
function sizeVrSubtitle(text) {
  const lines = text.split(/\s+/).reduce((acc, w) => {
    const last = acc[acc.length - 1]
    if (last && (last + ' ' + w).length <= VR_SUB_WRAP) acc[acc.length - 1] = last + ' ' + w
    else acc.push(w)
    return acc
  }, []).length
  vrSubtitleBg.setAttribute('height', Math.max(0.18, lines * 0.075 + 0.05).toFixed(3))
}
document.addEventListener('vo:line', (e) => {
  subtitle.textContent = e.detail
  subtitle.classList.add('visible')
  vrSubtitle.setAttribute('value', e.detail)
  sizeVrSubtitle(e.detail)
  vrSubtitleWrap.setAttribute('visible', inVR())
})
document.addEventListener('vo:clear', () => {
  subtitle.classList.remove('visible')
  vrSubtitleWrap.setAttribute('visible', false)
})
// Masuk/keluar VR di tengah sesi: segarkan visibilitas panel.
sceneEl.addEventListener('enter-vr', () => {
  log('enter-vr')
  if (subtitle.classList.contains('visible')) vrSubtitleWrap.setAttribute('visible', true)
  updateVrStatus()
  document.getElementById('vr-nav')?.setAttribute('visible', true)
  // Tinggi mata baru diketahui setelah pose headset masuk (butuh beberapa frame).
  setTimeout(positionVrNav, 600)
})
sceneEl.addEventListener('exit-vr', () => {
  log('exit-vr')
  vrSubtitleWrap.setAttribute('visible', false)
  updateVrStatus()
  document.getElementById('vr-nav')?.setAttribute('visible', false)
})
// Status scene dalam-VR (judul + progres) — dipanggil dari scene-manager.updateHud/hideHud.
const vrStatusWrap = document.getElementById('vr-status-wrap')
function updateVrStatus() {
  const hudVisible = document.getElementById('scene-hud').classList.contains('visible')
  vrStatusWrap.setAttribute('visible', inVR() && hudVisible)
}

// ---------- Tombol Lanjut DOM (cadangan desktop) ----------
document.getElementById('btn-next').addEventListener('click', advanceFromUI)

// ---------- Navigasi scene kapan saja ----------
document.getElementById('btn-prev').addEventListener('click', prev)
document.getElementById('btn-next-scene').addEventListener('click', () => next())

// ---------- Navigasi dalam-VR (sentuh ujung jari, ala webxr-samples immersive-hands) ----------
// Panel VERTIKAL di sisi KIRI pengguna, dalam jangkauan tangan, dihadapkan ke pengguna (yaw +).
// raw-hands mendeteksi ujung jari masuk volume tombol → warna berubah → aksi. Gaze/laser cadangan.
// Font: a-text merender ~ (width / wrap-count) per karakter. Agar label muat DI DALAM tombol,
// text width ≈ lebar tombol dan wrap-count ≈ jumlah karakter (JANGAN width > lebar tombol → font raksasa).
const BTN = {
  w: 0.22, h: 0.06, gap: 0.075, // lebar/tinggi/jarak-baris tombol aksi (kecil, muat di jangkauan)
  x: -0.62, z: -0.28,           // digeser lebih ke kiri agar tak menghalangi pandangan depan
  yaw: 52,                       // diputar lebih menghadap pengguna (panel makin ke samping)
  bg: '#12241f', bgAktif: '#2c5344',
}
const NAV_DROP = 0.12 // titik tengah panel sedikit di bawah mata → zona dada-atas

function vrButton(parent, { x, y, w, h, label, warna, ids, onSelect }) {
  const btn = el('a-plane', {
    class: 'clickable touchable', position: `${x} ${y} 0`, width: w, height: h,
    color: BTN.bg, opacity: 0.92, transparent: true,
  }, parent)
  btn.dataset.colorBase = BTN.bg
  btn.dataset.colorActive = BTN.bgAktif
  btn.__touch = { label, onSelect }
  if (ids?.btn) btn.setAttribute('id', ids.btn)
  // Teks SAUDARA plane (bukan anak): raycaster cursor recursive, teks-anak bisa menghadang gaze.
  // width = lebar tombol, wrap-count = panjang label → font kecil & muat, tak bertabrakan.
  const teks = el('a-text', {
    value: label, align: 'center', baseline: 'center', position: `${x} ${y} 0.01`,
    width: w, 'wrap-count': Math.max(label.length + 1, 7), color: warna,
  }, parent)
  if (ids?.teks) teks.setAttribute('id', ids.teks)
  btn.addEventListener('click', () => { log(`vr-nav: "${label}"`); onSelect() })
  return btn
}

function buildVrNav() {
  const nav = document.getElementById('vr-nav')
  if (!nav) return
  nav.setAttribute('rotation', `0 ${BTN.yaw} 0`)
  nav.setAttribute('position', `${BTN.x} 0 ${BTN.z}`)
  // Kolom aksi (kiri): 3 tombol bertumpuk vertikal (Bantuan dihapus atas permintaan owner).
  const aksi = [
    { label: 'Lanjut', on: advanceFromUI, ids: { btn: 'vr-act-advance', teks: 'vr-act-advance-text' } },
    { label: 'Selanjutnya', on: () => next(), ids: { btn: 'vr-act-next', teks: 'vr-act-next-text' } },
    { label: 'Sebelumnya', on: prev, ids: { btn: 'vr-act-prev', teks: 'vr-act-prev-text' } },
    { label: 'Akhiri Sesi', on: () => finish(), ids: { btn: 'vr-act-exit', teks: 'vr-act-exit-text' } },
  ]
  const topA = (aksi.length - 1) / 2 * BTN.gap
  aksi.forEach((a, i) => vrButton(nav, {
    x: 0, y: topA - i * BTN.gap, w: BTN.w, h: BTN.h,
    label: a.label, warna: '#a8d5ba', ids: a.ids, onSelect: a.on,
  }))
  // Angka scene 1–7: grid kecil di kanan kolom aksi, renggang agar tak bertabrakan.
  const jw = 0.06, jpitch = 0.08, cols = 4
  const startX = BTN.w / 2 + 0.09
  const topJ = jpitch / 2 // 2 baris → pusatkan
  // Tombol lompat = per entri PLAYLIST (alur aktif), bukan 7 scene gudang. Label = posisi 1..N.
  PLAYLIST.forEach((_, i) => vrButton(nav, {
    x: startX + (i % cols) * jpitch, y: topJ - Math.floor(i / cols) * jpitch, w: jw, h: jw,
    label: String(i + 1), warna: '#f4e8c3', ids: { btn: `vr-jump-${i}` }, onSelect: () => goTo(i),
  }))
  log(`buildVrNav: ${aksi.length} aksi + ${PLAYLIST.length} langkah (kolom kiri, yaw ${BTN.yaw})`)
  positionVrNav()
}

// Panel body-locked di rig (rig di lantai) — tinggi dihitung dari tinggi mata SEBENARNYA.
// Dipanggil saat boot (desktop) & 600ms setelah enter-vr (pose headset butuh stabil).
function positionVrNav() {
  const nav = document.getElementById('vr-nav')
  const cam = document.querySelector('a-camera')
  if (!nav || !cam) return
  const eye = new AFRAME.THREE.Vector3()
  cam.object3D.getWorldPosition(eye)
  const y = (eye.y || 1.2) - NAV_DROP
  nav.object3D.position.y = y
  log(`positionVrNav: tinggi mata=${eye.y.toFixed(2)} → nav y=${y.toFixed(2)}`)
}

buildVrNav()

// ---------- Panel bantuan ----------
let helpReturn // undefined = bantuan tidak terbuka
const vrHelpWrap = () => document.getElementById('vr-help-wrap')
function openHelp() {
  if (helpReturn !== undefined) return
  const visible = document.querySelector('.screen.visible')
  helpReturn = visible ? visible.id : null
  showScreen('screen-help')
  // Kembaran in-VR: DOM #screen-help tak terlihat di headset.
  vrHelpWrap()?.setAttribute('visible', inVR())
}
function closeHelp() {
  if (helpReturn === undefined) return
  showScreen(helpReturn)
  helpReturn = undefined
  vrHelpWrap()?.setAttribute('visible', false)
}
document.getElementById('btn-help-open').addEventListener('click', openHelp)
document.getElementById('btn-help-hud').addEventListener('click', openHelp)
document.getElementById('btn-help-close').addEventListener('click', closeHelp)
// Tombol Tutup in-VR (gaze/sentuh).
document.getElementById('vr-btn-help-close').addEventListener('click', closeHelp)

// Fade awal: hitam → terlihat.
requestAnimationFrame(() => document.getElementById('fade').classList.add('clear'))

// ---------- Kontrol sesi dari halaman laptop (?role=control) ----------
// Quest (role=vr) terhubung ke relay WS lokal; menerima perintah dari halaman kontrol.
connectControl((cmd) => {
  if (!cmd || !cmd.op) return
  slog('info', `perintah dari kontrol: ${cmd.op}${cmd.idx != null ? ' → scene ' + cmd.idx : ''}`)
  switch (cmd.op) {
    case 'stop': stopAll(); break
    case 'next': next(); break
    case 'prev': prev(); break
    case 'goto': if (typeof cmd.idx === 'number') goTo(cmd.idx); break
    case 'setAuto': setAutoAdvance(!!cmd.value); break
    default: err('perintah tak dikenal:', cmd.op)
  }
})
