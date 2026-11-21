// selfcheck.js — assert sederhana saat dev. Semua PASS atau error di console.

import { SCENES } from './scenes/script-data.js'

function assert(cond, msg) {
  if (!cond) throw new Error(`[selfcheck] GAGAL: ${msg}`)
  console.log(`[selfcheck] PASS: ${msg}`)
}

export function runSelfCheck() {
  assert(SCENES.length === 7, 'script-data punya 7 scene')
  const ids = new Set()
  for (const s of SCENES) {
    assert(!ids.has(s.id), `id scene unik: ${s.id}`)
    ids.add(s.id)
    assert(s.judul && s.tujuanPFA, `${s.id} punya judul & tujuanPFA`)
    assert(Array.isArray(s.voiceLines) && s.voiceLines.length > 0, `${s.id} punya voiceLines`)
    for (const l of s.voiceLines) {
      assert(typeof l.teks === 'string' && l.teks.length > 0, `${s.id}: semua baris VO punya teks`)
    }
  }
  // TTS opsional: absennya BUKAN kegagalan (Quest Browser tak punya) — VO otomatis jatuh ke subtitle.
  if (!('speechSynthesis' in window)) console.warn('[selfcheck] Web Speech API tidak ada — VO pakai subtitle + tempo baca')
}
