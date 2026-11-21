// safety-exit.js — WAJIB aktif di semua scene.
// Trigger: pandangan ke bawah (pitch < -60°) selama 3 detik, ATAU tombol Esc (desktop).
// Aksi: pause sesi + tampilkan layar jeda.

import { replay } from '../scenes/scene-manager.js'
import { stop as stopAudio } from './audio-player.js'

let lookDownMs = 0
let paused = false
let lastT = 0

function showPause(show) {
  paused = show
  document.getElementById('screen-pause').classList.toggle('visible', show)
  // Kembaran in-VR: DOM tak terlihat di headset (aturan "info penting wajib punya a-plane + a-text").
  document.getElementById('vr-pause-wrap')?.setAttribute('visible', show)
  if (show) stopAudio()
}

export function isPaused() { return paused }

export function initSafetyExit() {
  const cam = document.querySelector('a-camera')

  // Polling pitch (cukup 10x/detik — hemat dan andal).
  setInterval(() => {
    if (paused) { lookDownMs = 0; return }
    const now = performance.now()
    const dt = lastT ? now - lastT : 100
    lastT = now
    const pitch = cam.getAttribute('rotation')?.x ?? 0
    if (pitch < -60) {
      lookDownMs += dt
      if (lookDownMs >= 3000) { lookDownMs = 0; showPause(true) }
    } else {
      lookDownMs = 0
    }
  }, 100)

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !paused) showPause(true)
  })

  const resume = () => { showPause(false); replay() } // ulangi scene aktif dari awal — paling aman secara terapi
  const quit = () => { showPause(false); document.dispatchEvent(new CustomEvent('pfa:quit')) }
  document.getElementById('btn-resume').addEventListener('click', resume)
  document.getElementById('btn-quit').addEventListener('click', quit)
  // Tombol in-VR: gaze-dwell/controller/pinch memancarkan 'click' ke target .clickable.
  document.getElementById('vr-btn-resume').addEventListener('click', resume)
  document.getElementById('vr-btn-quit').addEventListener('click', quit)
}
