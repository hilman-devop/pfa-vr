// s7.js — Penutup: papan kayu + 3 teks fade berurutan, lalu layar selesai (via scene-manager).

import { env, pop } from '../environment/environment.js'

export function build() {}

export function onCue(cue) {
  if (cue !== 'board-show') return
  env.boardGroup.setAttribute('visible', true)
  env.boardTexts.forEach((teks, i) => pop(teks, i * 1100))
}

export function destroy() {
  env.boardGroup.setAttribute('visible', false)
}
