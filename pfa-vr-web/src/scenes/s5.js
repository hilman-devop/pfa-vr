// s5.js — Dukungan Sosial: siluet bercahaya di sisi ruang tamu (tanpa wajah) muncul sesuai sebutan VO.

import { env, pop } from '../environment/environment.js'

export function build() {}

export function onCue(cue) {
  if (cue === 'silhouette-0') {
    env.silhouetteGroup.setAttribute('visible', true)
  }
  const m = cue.match(/^silhouette-(\d)$/)
  if (m) pop(env.silhouettes[Number(m[1])])
}

export function destroy() {
  env.silhouetteGroup.setAttribute('visible', false)
}
