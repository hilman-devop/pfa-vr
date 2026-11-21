// s2.js — Latihan Pernapasan: orb sinkron VO, 5 siklus, riak danau + cahaya hangat saat hembuskan.

import { el } from '../utils.js'
import { env } from '../environment/environment.js'
import * as audio from '../components/audio-player.js'

let orb = null
let timers = []

export function build(root) {
  // Orb di zona pandang bawah-tengah (bukan sejajar mata): panel subtitle/status head-locked
  // menempati ±10–20° DI ATAS horizon, jadi orb eye-level dulu (1.4) tertimpa panel. Turun ke 1.05
  // menempatkan puncak halo di bawah bibir panel subtitle. Angka final perlu dicek di Quest.
  orb = el('a-sphere', {
    position: '0 1.05 -2.4', radius: 0.5, color: '#ffe9b8',
    emissive: '#ffcf7a', 'emissive-intensity': 0.9, 'breathing-orb': '',
  }, root)
  el('a-sphere', { radius: 0.7, color: '#ffe9b8', opacity: 0.22, transparent: true }, orb) // halo
}

const t = (fn, ms) => timers.push(setTimeout(fn, ms))

function ripple() {
  env.rings.forEach((r, i) => {
    t(() => {
      r.setAttribute('visible', true)
      r.setAttribute('animation', { property: 'scale', from: '0.3 0.3 0.3', to: '2.2 2.2 2.2', dur: 2400, easing: 'easeOutQuad' })
      r.setAttribute('animation__fade', { property: 'opacity', from: 0.7, to: 0, dur: 2400 })
      t(() => r.setAttribute('visible', false), 2500)
    }, i * 350)
  })
}

function warmPulse() {
  env.lampu.setAttribute('animation__warm', { property: 'light.intensity', to: 0.95, dur: 1800 })
  t(() => env.lampu.setAttribute('animation__warm', { property: 'light.intensity', to: 0.55, dur: 2600 }), 2000)
}

// Key VO (s2-N) WAJIB diteruskan ke speak() agar file rekaman edge-tts diputar.
// Tanpa key → jatuh ke Web Speech (absen di Quest) → S2 bisu. Teks = baris di script-data.js:
// s2-0 pembuka, s2-1 tarik napas, s2-2 hitung (tarik), s2-3 tahan, s2-4 hembus, s2-5 hitung (hembus).
export async function playVo(data) {
  const siklus = data?.siklus ?? 5
  const g = audio.genId() // token generasi — mati otomatis saat user pindah scene
  await audio.speak('Sekarang mari bernapas bersama.', 's2-0')
  await audio.wait(2)
  for (let i = 0; i < siklus; i++) {
    if (!audio.alive(g)) return
    orb.emit('inhale')
    await audio.speak('Tarik napas perlahan melalui hidung.', 's2-1')
    await audio.speak('Satu. Dua. Tiga.', 's2-2')
    if (!audio.alive(g)) return
    await audio.speak('Tahan sejenak.', 's2-3')
    orb.emit('exhale')
    ripple()
    warmPulse()
    await audio.speak('Hembuskan perlahan melalui mulut.', 's2-4')
    await audio.speak('Satu. Dua. Tiga.', 's2-5')
    await audio.wait(1)
  }
}

export function destroy() {
  timers.forEach(clearTimeout)
  timers = []
}
