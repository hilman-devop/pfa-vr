// s4.js — Kontrol Diri: jalur + 4 simbol muncul berurutan mengikuti VO.

import { env, pop } from '../environment/environment.js'

const MAP = { 'symbol-air': 'air', 'symbol-rumah': 'rumah', 'symbol-keluarga': 'keluarga', 'symbol-komunitas': 'komunitas' }

export function build() {}

export function onCue(cue) {
  if (cue === 'symbols-show') {
    env.symbolsGroup.setAttribute('visible', true)
  } else if (MAP[cue]) {
    pop(env.symbols[MAP[cue]])
  }
}

export function destroy() {
  env.symbolsGroup.setAttribute('visible', false)
}
