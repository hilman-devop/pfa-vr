// s6.js — Harapan dan Resiliensi: matahari terbit + bunga bermekaran sepanjang VO.

import { startSunrise } from '../components/sunrise.js'
import { env } from '../environment/environment.js'

export function build() {
  startSunrise()
}

export function destroy() {
  env.flowerGroup.setAttribute('visible', false)
}
