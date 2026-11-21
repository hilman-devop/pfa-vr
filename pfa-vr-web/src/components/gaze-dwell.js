// gaze-dwell.js — cursor fuse 1.5 detik (VR: pandangan; desktop: klik mouse).
// Objek interaktif: tambahkan class="clickable". Event: 'gaze-select'.
// Click dibaca dari intersectedEl milik cursor — event A-Frame tidak selalu bubble,
// jadi JANGAN mengandalkan listener click di sceneEl.

import { log } from '../dev-log.js'

AFRAME.registerComponent('gaze-dwell', {
  init() {
    const cursor = document.createElement('a-cursor')
    cursor.setAttribute('fuse', true)
    cursor.setAttribute('fuse-timeout', 1500)
    cursor.setAttribute('raycaster', 'objects: .clickable')
    cursor.setAttribute('animation__fusing',
      'property: scale; startEvents: fusing; from: 1 1 1; to: 0.5 0.5 0.5; dur: 1500')
    this.el.appendChild(cursor)
    log('gaze-dwell: cursor initialized (fuse 1.5s, raycaster=.clickable)')

    // Fuse maupun klik mouse sama-sama memicu 'click' pada cursor;
    // teruskan sebagai 'gaze-select' ke entity yang sedang beririsan.
    cursor.addEventListener('click', () => {
      const target = cursor.components.cursor?.intersectedEl
      if (target?.classList?.contains('clickable')) {
        log('gaze-select →', target.id || target.className)
        target.emit('gaze-select')
      }
    })
  },
})
