// sunrise.js — S6: cahaya pagi menghangat (dirLight menguat + lampu plafon hangat), bunga mekar.
// Pengganti matahari terbit outdoor: indoor tidak punya sky/sun, jadi "terbit" = cahaya lebih terang & hangat.

import { env, pop } from '../environment/environment.js'

export function startSunrise() {
  env.dirLight.setAttribute('animation__light', {
    property: 'light.intensity', to: '1.15', dur: 25000, easing: 'easeInOutSine',
  })
  env.lampu.setAttribute('animation__warm', {
    property: 'light.intensity', to: '0.85', dur: 25000, easing: 'easeInOutSine',
  })
  env.flowerGroup.setAttribute('visible', true)
  env.flowers.forEach((f, i) => pop(f, i * 900))
}