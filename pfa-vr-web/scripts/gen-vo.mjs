// gen-vo.mjs — buat file VO (mp3) dari script-data.js pakai edge-tts (suara id-ID).
// Pakai: node scripts/gen-vo.mjs
// Output: public/audio/vo/<gender>/<sceneId>-<index>.mp3  (mis. f/s1-0.mp3, m/s3-2.mp3)
// Manifest ditulis ke src/scenes/vo-manifest.json supaya audio-player tahu file mana per baris.
//
// edge-tts butuh internet SAAT generate saja; file hasil lokal & berbunyi offline di Quest.
// Baris VO = satu-satunya sumber di script-data.js (jangan duplikasi teks di sini).

import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { SCENES } from '../src/scenes/script-data.js'

const VOICES = { f: 'id-ID-GadisNeural', m: 'id-ID-ArdiNeural' }
const audioRoot = fileURLToPath(new URL('../public/audio/vo/', import.meta.url))
const manifest = {} // { "s1-0": true, ... } — penanda baris punya file VO

for (const [gender, voice] of Object.entries(VOICES)) {
  const dir = `${audioRoot}${gender}/`
  mkdirSync(dir, { recursive: true })
  for (const scene of SCENES) {
    scene.voiceLines.forEach((line, i) => {
      const key = `${scene.id}-${i}`
      const out = `${dir}${key}.mp3`
      // Prosodi menenangkan & lebih luwes (bukan kaku): tempo lebih lambat, pitch sedikit
      // diturunkan, volume sedikit dilembutkan. Cocok konteks terapi PFA.
      execFileSync('python', ['-m', 'edge_tts', '--voice', voice,
        '--rate=-18%', '--pitch=-4Hz', '--volume=-6%',
        '--text', line.teks, '--write-media', out], { stdio: 'pipe' })
      manifest[key] = true
      process.stdout.write(`${gender}/${key} `)
    })
  }
}

const manifestPath = fileURLToPath(new URL('../src/scenes/vo-manifest.json', import.meta.url))
writeFileSync(manifestPath, JSON.stringify(manifest, null, 0))
console.log(`\nVO selesai: ${Object.keys(manifest).length} baris × 2 suara → ${audioRoot}`)
