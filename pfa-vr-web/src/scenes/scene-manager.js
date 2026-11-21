// scene-manager.js — urutan S1→S7 linear, fade hitam 1 detik, bersih-bersih entity per scene.
// Scene = modul { build(root, data), onCue?(cue), playVo?(data), destroy?() }.
// Scene dengan playVo kustom (S2) mengatur alur VO sendiri; lainnya pakai audio.playScene.

import { SCENES, PLAYLIST } from './script-data.js'
import * as audio from '../components/audio-player.js'
import { resetEnvironment } from '../environment/environment.js'
import { inVR } from '../utils.js'
import { log, warn } from '../dev-log.js'
import { setState, getState, log as slog } from '../session-state.js'

export { SCENES, PLAYLIST }
// ORDER = urutan main aktif (referensi id di PLAYLIST). SCENES = gudang semua scene.
// s2 muncul 2× di PLAYLIST → SCENE_MODS['./s2.js'] dimuat ulang, modul & data sama (aman).
const ORDER = PLAYLIST
const SCENE = (id) => SCENES.find((s) => s.id === id)
// import.meta.glob: dinamis tapi statis-analisis oleh Vite → chunk scene ikut di-build
// & ter-cache PWA (import variabel polos gagal offline di build produksi, T6.1).
const SCENE_MODS = import.meta.glob('./s*.js')
let current = null
let currentIdx = -1
let sceneModule = null

const fade = () => document.getElementById('fade')
const root = () => document.getElementById('scene-root')

function fadeTo(black) {
  return new Promise((r) => {
    fade().classList.toggle('clear', !black)
    setTimeout(r, 1000)
  })
}

function cleanup() {
  audio.stop()
  if (sceneModule?.destroy) sceneModule.destroy()
  armAdvance = null
  document.getElementById('btn-next').hidden = true
  const el = root()
  while (el.firstChild) el.removeChild(el.firstChild)
}

function updateHud() {
  const hud = document.getElementById('scene-hud')
  const title = document.getElementById('hud-title')
  const dots = document.getElementById('hud-dots')
  title.textContent = current.judul
  dots.innerHTML = ORDER.map((_, i) =>
    `<span class="dot${i < currentIdx ? ' done' : i === currentIdx ? ' active' : ''}"></span>`,
  ).join('')
  hud.classList.add('visible')
  // Status dalam-VR (T5.4): judul + progres — DOM HUD tidak terlihat di headset.
  const vrStatus = document.getElementById('vr-status')
  if (vrStatus) vrStatus.setAttribute('value', `${current.judul} · ${currentIdx + 1}/${ORDER.length}`)
  document.getElementById('vr-status-wrap')?.setAttribute('visible', inVR())
}

// Tombol nav in-VR/DOM bisa ditekan dua kali cepat. Tanpa guard, dua goTo() berjalan
// tumpang-tindih di sela `await fadeTo` → build() dua scene dua-duanya jalan, sementara
// `sceneModule` cuma menyimpan satu → destroy() scene yang kalah tak pernah dipanggil.
let transitioning = false

export async function goTo(idx, { silent = false } = {}) {
  if (idx < 0 || idx >= ORDER.length) { warn(`goTo(${idx}) out of range`); return }
  if (transitioning) { warn(`goTo(${idx}) diabaikan — transisi sedang jalan`); return }
  transitioning = true
  try {
    log(`goTo(${idx}) "${SCENE(PLAYLIST[idx]).judul}" silent=${silent}`)
    await fadeTo(true)
    cleanup()
    if (idx === 0) resetEnvironment() // ulangi dari awal = lingkungan kembali ke kondisi S1
    currentIdx = idx
    current = SCENE(PLAYLIST[idx])
    setState({ currentIdx: idx, sceneTitle: current.judul, running: true })
    slog('info', `scene → ${idx} "${current.judul}"`)
    updateHud()
    updateNav()
    sceneModule = await SCENE_MODS[`./${current.id}.js`]()
    sceneModule.build(root(), current)
    audio.playAmbience(current.ambience) // T5.3: crossfade ke ambience scene ini
    await fadeTo(false)
  } finally {
    transitioning = false
  }
  if (!silent) runVo()
}

function handleCue(cue) {
  sceneModule?.onCue?.(cue)
}

export function fireCue(cue) { handleCue(cue) } // hook pengujian

export function advanceFromUI() { log('advanceFromUI'); armAdvance?.() } // tombol DOM cadangan

export function setAutoAdvance(v) {
  setState({ autoAdvance: !!v })
  slog('info', `auto-lanjut ${v ? 'ON' : 'OFF'}`)
}
export function getAutoAdvance() { return getState().autoAdvance }

async function runVo() {
  audio.begin()
  const vo = sceneModule.playVo
    ? sceneModule.playVo(current)
    : audio.playScene(current, handleCue)
  const startIdx = currentIdx // s2 muncul 2× di PLAYLIST → banding indeks, bukan objek scene
  await vo
  // Lanjut otomatis (default ON) — bisa dimatikan dari halaman kontrol (setAutoAdvance).
  if (startIdx !== currentIdx) return // scene berubah di tengah VO → jangan nerusin
  if (getState().autoAdvance) {
    slog('info', `VO selesai scene ${currentIdx} — auto-lanjut`)
    await new Promise((r) => setTimeout(r, 1500)) // jeda nyaman sebelum pindah scene
    next()
  } else {
    showNextButton()
  }
}

// Tombol "Lanjut": panel in-VR (dwell/klik) + tombol DOM cadangan (desktop pasti bisa diklik).
// Keduanya lewat satu guard agar next() tidak terpanggil dua kali.
let armAdvance = null

function showNextButton() {
  const isLast = currentIdx + 1 >= ORDER.length
  const label = isLast ? 'Selesai' : 'Lanjut'
  log(`showNextButton: "${label}" at scene ${currentIdx}`)

  let used = false
  armAdvance = () => {
    if (used) return
    used = true
    armAdvance = null
    next()
  }

  // Panel hijau in-VR DIHILANGKAN (permintaan owner 2026-08-04: menutupi pemandangan).
  // Jalur lanjut = tombol DOM di baris navigasi bawah.
  const domBtn = document.getElementById('btn-next')
  domBtn.textContent = `${label} ›`
  domBtn.hidden = false
}

export function next() {
  log(`next() from scene ${currentIdx}`)
  if (currentIdx + 1 < ORDER.length) goTo(currentIdx + 1)
  else finish()
}

export function prev() { log(`prev() from scene ${currentIdx}`); if (currentIdx > 0) goTo(currentIdx - 1) }

// Navigasi kapan saja: tombol prev/next selalu tersedia selama sesi berjalan.
function updateNav() {
  document.getElementById('scene-nav').hidden = false
  document.getElementById('btn-prev').disabled = currentIdx <= 0
  document.getElementById('btn-next-scene').textContent =
    currentIdx + 1 >= ORDER.length ? 'Selesai ›' : 'Selanjutnya ›'
  updateVrNav()
}

// Navigasi dalam-VR: tombol dibangun sekali di main.js (buildVrNav).
// Di sini hanya memperbarui label "Lanjut/Selesai", penanda scene aktif, dan visibilitas.
function updateVrNav() {
  const vrNav = document.getElementById('vr-nav')
  if (!vrNav) return
  const isLast = currentIdx + 1 >= ORDER.length
  document.getElementById('vr-act-advance-text')?.setAttribute('value', isLast ? 'Selesai' : 'Lanjut')
  // "Selanjutnya" tidak berguna di scene terakhir; "Sebelumnya" tidak berguna di scene pertama.
  document.getElementById('vr-act-next')?.setAttribute('visible', !isLast)
  document.getElementById('vr-act-next-text')?.setAttribute('visible', !isLast)
  document.getElementById('vr-act-prev')?.setAttribute('visible', currentIdx > 0)
  // "Akhiri Sesi" hanya di scene terakhir.
  document.getElementById('vr-act-exit')?.setAttribute('visible', isLast)
  document.getElementById('vr-act-exit-text')?.setAttribute('visible', isLast)
  // Teks label = saudara plane (bukan anak), jadi sembunyikan terpisah — kalau tidak, di Scene 1
  // tulisan "Sebelumnya" tetap tampak walau tombolnya hilang.
  document.getElementById('vr-act-prev-text')?.setAttribute('visible', currentIdx > 0)
  ORDER.forEach((_, i) =>
    document.getElementById(`vr-jump-${i}`)?.setAttribute('color', i === currentIdx ? '#2c5344' : '#12241f'))
  log(`updateVrNav: scene=${currentIdx} inVR=${inVR()} advance="${isLast ? 'Selesai' : 'Lanjut'}"`)
  vrNav.setAttribute('visible', inVR())
}

export function replay() {
  if (currentIdx >= 0) goTo(currentIdx)
}

export function getCurrentIndex() { return currentIdx }

export function hideHud() {
  document.getElementById('scene-hud').classList.remove('visible')
  document.getElementById('vr-status-wrap')?.setAttribute('visible', false)
}

export function finish() {
  log('finish() — session complete')
  cleanup()
  audio.stopAmbience()
  hideHud()
  document.getElementById('scene-nav').hidden = true
  document.dispatchEvent(new CustomEvent('pfa:done'))
}

export function stopAll() {
  log('stopAll() — session terminated')
  cleanup()
  audio.stopAmbience()
  hideHud()
  document.getElementById('scene-nav').hidden = true
  current = null
  currentIdx = -1
}
