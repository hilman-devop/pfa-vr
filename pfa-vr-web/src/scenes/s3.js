// s3.js — Grounding 5-4-3-2-1: objek bersinar saat dipandang + panduan pulse berurutan.
// Highlight grounding HANYA aktif di scene ini.

import { env } from '../environment/environment.js'

let timers = []

const setActive = (v) => {
  for (const target of Object.values(env.grounding)) {
    const comp = target?.components?.['gaze-highlight']
    if (comp) comp.active = v
  }
}

export function build() {
  setActive(true)
}

export function onCue(cue) {
  if (cue !== 'grounding-objects') return
  const urutan = ['sofa', 'layar', 'tanaman', 'karpet', 'meja']
  urutan.forEach((k, i) => {
    timers.push(setTimeout(() => env.grounding[k]?.emit('hl-pulse'), i * 2400))
  })
}

export function destroy() {
  setActive(false)
  timers.forEach(clearTimeout)
  timers = []
}
