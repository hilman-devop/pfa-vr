// diag.js — build diagnostik hand tracking + navbar (opt-in via ?diag).
// Tujuan: ukur di Quest apakah tangan/navbar kena offset tinggi ganda.
// TIDAK mengubah perilaku apa pun — hanya membaca posisi dunia & menampilkannya.
// Panel head-locked (anak a-camera) supaya selalu terbaca walau menoleh.

import { log } from './dev-log.js'

const on = new URLSearchParams(location.search).has('diag')

export function initDiag() {
  if (!on) return
  const cam = document.querySelector('a-camera')
  if (!cam) return

  const panel = document.createElement('a-entity')
  panel.setAttribute('position', '0 -0.35 -1')
  const bg = document.createElement('a-plane')
  bg.setAttribute('width', '1.2'); bg.setAttribute('height', '0.5')
  bg.setAttribute('color', '#000'); bg.setAttribute('opacity', '0.75'); bg.setAttribute('transparent', 'true')
  panel.appendChild(bg)
  const txt = document.createElement('a-text')
  txt.setAttribute('value', 'diag…'); txt.setAttribute('align', 'center'); txt.setAttribute('baseline', 'center')
  txt.setAttribute('position', '0 0 0.01'); txt.setAttribute('width', '2.1'); txt.setAttribute('color', '#0f0')
  txt.setAttribute('wrap-count', '40')
  panel.appendChild(txt)
  cam.appendChild(panel)

  const V = () => new AFRAME.THREE.Vector3()
  const eye = V(), navp = V(), rigp = V()

  setInterval(() => {
    const scene = document.querySelector('a-scene')
    if (!scene?.is('vr-mode')) { txt.setAttribute('value', 'diag: masuk VR dulu'); return }
    cam.object3D.getWorldPosition(eye)
    const rig = document.getElementById('camera-rig')
    rig?.object3D.getWorldPosition(rigp)
    const nav = document.getElementById('vr-nav')
    nav?.object3D.getWorldPosition(navp)

    const f = (v) => v.toFixed(2)
    // Apa yang sedang ditembak cursor gaze? (jawab kenapa navbar tak keklik)
    const cursor = document.querySelector('a-cursor')?.components?.cursor
    const hit = cursor?.intersectedEl
    const hitId = hit ? (hit.id || hit.getAttribute('class') || hit.tagName) : 'tidak ada'
    const lines = [
      `eye.y=${f(eye.y)}  rig.y=${f(rigp.y)}`,
      `nav world y=${f(navp.y)}  (eye-nav=${f(eye.y - navp.y)})`,
      `gaze → ${hitId}`,
    ]
    txt.setAttribute('value', lines.join('\n'))
    log('diag', lines.join(' | '))
  }, 500)
}
