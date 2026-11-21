// audio-player.js — VO: file rekaman edge-tts (id-ID) bila ada, jatuh ke Web Speech / subtitle.
// API: playScene(scriptData, onCue) -> Promise; stop().

import { log, warn } from '../dev-log.js'
import voManifest from '../scenes/vo-manifest.json'

let voice = null
let gender = 'male'
let cancelled = false
let gen = 0 // token generasi sesi VO: naik di begin() & stop() — mencegah loop VO lama
           // "dihidupkan lagi" oleh scene baru (bug tabrakan suara S1 saat lompat ke S2)
let muted = false
let voEl = null // <audio> VO yang sedang diputar (agar bisa di-stop)

// File VO dibuat scripts/gen-vo.mjs → public/audio/vo/<f|m>/<sceneId>-<idx>.mp3.
// Berbunyi di Quest (tak bergantung Web Speech yang absen di Quest Browser).
const voSrc = (key) => `/audio/vo/${gender === 'female' ? 'f' : 'm'}/${key}.mp3`
const hasVo = (key) => key != null && voManifest[key] === true

// Web Speech API tidak ada di sebagian browser VR (mis. Meta Quest Browser).
// Tanpa penjaga ini, akses top-level di bawah melempar error saat import → main.js mati total.
// Bila tak ada, VO otomatis jatuh ke jalur subtitle + tempo baca (sama seperti mode "Tanpa Audio").
const TTS = 'speechSynthesis' in window
log(`audio-player: TTS available = ${TTS}`)

// Mode tanpa audio: VO tidak dibacakan, subtitle tetap jalan dengan tempo baca.
export function setMuted(m) { muted = m }

// Token generasi: scene VO yang mulai setelah begin() hanya berlaku untuk gen-nya sendiri.
export function begin() { gen++; cancelled = false }
export function genId() { return gen }
export function alive(g) { return !cancelled && g === gen }
export function isStopped() { return cancelled }

function pickVoice() {
  if (!TTS) return null
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith('id'))
  if (!voices.length) return null
  // Heuristik nama voice umum di Windows/Chrome: perempuan cenderung mengandung nama feminin.
  const female = voices.find((v) => /female|wanita|perempuan|damayanti|gadis/i.test(v.name))
  if (gender === 'female') return female || voices[0]
  return voices.find((v) => !/female|wanita|perempuan|damayanti|gadis/i.test(v.name)) || voices[0]
}

// Voice list baru tersedia async di Chrome.
if (TTS) speechSynthesis.onvoiceschanged = () => { voice = pickVoice() }

export function setVoiceGender(g) {
  gender = g
  voice = pickVoice()
}

function speak(teks, key) {
  return new Promise((resolve) => {
    if (cancelled) { log(`speak: cancelled pre-line (key=${key})`); return resolve() }
    // Subtitle: pancarkan baris aktif (ditangkap #subtitle di main.js).
    document.dispatchEvent(new CustomEvent('vo:line', { detail: teks }))
    if (muted) { log(`speak: muted tempo (key=${key})`); setTimeout(resolve, Math.max(2000, teks.length * 60)); return }

    // 1) File VO rekaman (edge-tts) — berbunyi di Quest. Prioritas utama.
    if (hasVo(key)) {
      log(`speak: vo-file ${key}`)
      const a = new Audio(voSrc(key))
      voEl = a
      let done = false
      const finish = () => { if (!done) { done = true; if (voEl === a) voEl = null; resolve() } }
      a.onended = finish
      a.onerror = () => { warn(`VO gagal muat ${key}, fallback tempo baca`); setTimeout(finish, Math.max(2000, teks.length * 60)) }
      a.play().catch(() => { setTimeout(finish, Math.max(2000, teks.length * 60)) })
      return
    }

    // 2) Tanpa file & tanpa Web Speech (Quest): subtitle + tempo baca ~60ms/karakter.
    if (!TTS) { log(`speak: subtitle-tempo (key=${key})`); setTimeout(resolve, Math.max(2000, teks.length * 60)); return }

    // 3) Web Speech (desktop dev) sebagai cadangan.
    const u = new SpeechSynthesisUtterance(teks)
    u.lang = 'id-ID'
    u.rate = 0.9
    u.pitch = 1.0
    if (voice) u.voice = voice
    let done = false
    const finish = () => { if (!done) { done = true; resolve() } }
    u.onend = finish
    u.onerror = finish
    // Jaring pengaman: sebagian browser (voice kosong) tak memicu onend/onerror → jangan menggantung.
    setTimeout(finish, Math.max(3000, teks.length * 120))
    speechSynthesis.speak(u)
  })
}

const wait = (s) => new Promise((r) => setTimeout(r, s * 1000))

// Untuk scene dengan alur VO kustom (mis. siklus napas S2).
export { speak, wait }

export async function playScene(scriptData, onCue = () => {}) {
  const g = gen
  for (let i = 0; i < scriptData.voiceLines.length; i++) {
    const line = scriptData.voiceLines[i]
    if (!alive(g)) return
    if (line.cue) onCue(line.cue)
    await speak(line.teks, `${scriptData.id}-${i}`)
    if (!alive(g)) return
    if (line.jeda) await wait(line.jeda)
  }
}

export function stop() {
  log('audio.stop()')
  cancelled = true
  if (TTS) speechSynthesis.cancel()
  if (voEl) { voEl.pause(); voEl = null } // hentikan file VO yang sedang berbunyi
  document.dispatchEvent(new CustomEvent('vo:clear'))
}

// ---------- Ambience/musik per scene (T5.3) ----------
// File dari VR-Phase2 di public/audio/; pemetaan scene→file ada di script-data.js.
// Crossfade 1 dtk sinkron fade scene; hormati mode "Mulai Tanpa Audio" (muted).
const AMB_VOLUME = 0.2 // 80% dari 0,25 sebelumnya — agar tak bertabrakan dgn VO narasi
let ambEl = null

function ramp(a, target, done) {
  const step = () => {
    const d = target - a.volume
    if (Math.abs(d) < 0.02) {
      a.volume = target
      if (!target) { a.pause(); a.remove?.() }
      done?.()
      return
    }
    a.volume += d * 0.15
    setTimeout(step, 60)
  }
  step()
}

export function playAmbience(src) {
  if (!src || ambEl?.dataset.src === src) { log(`playAmbience: skip (same or empty: ${src})`); return }
  log(`playAmbience: ${src}`)
  if (ambEl) ramp(ambEl, 0) // fade out lama
  ambEl = null
  if (muted) return
  const a = new Audio(src)
  a.dataset.src = src
  a.loop = true
  a.volume = 0
  a.play().catch(() => {}) // gesture sudah ada dari tombol mulai
  ambEl = a
  ramp(a, AMB_VOLUME)
}

export function stopAmbience() {
  if (ambEl) ramp(ambEl, 0)
  ambEl = null
}

// ponytail: WAV 39MB belum dikonversi ke ogg 96kbps (ffmpeg tidak ada di mesin) — add when: perlu hemat cache PWA.
