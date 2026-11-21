// raw-hands.js — visualisasi + sentuh hand tracking, meniru webxr-samples/immersive-hands.
// KENAPA bukan hand-tracking-controls A-Frame: komponen itu menggambar sendi sebagai anak
// entity tangan (anak #camera-rig), jadi visualnya kena offset transform induk → tangan
// terlihat "terlalu ke atas" walau data posisinya benar (TERBUKTI di Quest 2026-08-20).
// Di sini sendi digambar MENTAH di scene root dari frame.fillPoses(hand, refSpace, ...),
// refSpace = reference space milik renderer (SAMA dengan kamera) → tangan = tangan asli.
//
// Sentuh: SEMUA ujung jari (5 tip × 2 tangan) diuji jaraknya ke tiap .touchable.
// Masuk < TOUCH_ENTER → tombol berubah warna + __touch.onSelect(); histeresis TOUCH_EXIT.
// Gaze/laser tetap jalan sebagai cadangan (tombol tetap .clickable).

import { log } from '../dev-log.js'

const JOINT_COUNT = 25
// Indeks ujung jari di urutan JOINTS WebXR: thumb, index, middle, ring, pinky.
const FINGER_TIPS = [4, 9, 14, 19, 24]
const TOUCH_ENTER = 0.045 // 4,5 cm
const TOUCH_EXIT = 0.07   // histeresis anti-getar

AFRAME.registerComponent('raw-hands', {
  schema: { color: { default: '#a8d5ba' } },

  init() {
    this.positions = new Float32Array(16 * JOINT_COUNT)
    this.radii = new Float32Array(JOINT_COUNT)
    this.m = new AFRAME.THREE.Matrix4()
    this.bw = new AFRAME.THREE.Vector3()
    this.boxes = { left: [], right: [] }
    this.tips = [] // posisi dunia semua ujung jari yang valid frame ini
    this.touched = new WeakMap()

    const root = this.el.sceneEl.object3D
    const color = new AFRAME.THREE.Color(this.data.color)
    for (const hand of ['left', 'right']) {
      for (let i = 0; i < JOINT_COUNT; i++) {
        const mesh = new AFRAME.THREE.Mesh(
          new AFRAME.THREE.SphereGeometry(1, 8, 6),
          new AFRAME.THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.4 }),
        )
        mesh.visible = false
        root.add(mesh)
        this.boxes[hand].push(mesh)
      }
    }
    log('raw-hands: 2×25 joint meshes di scene root')
  },

  tick() {
    const sceneEl = this.el.sceneEl
    const frame = sceneEl.frame
    const session = sceneEl.xrSession
    if (!frame || !session) return
    // Reference space renderer = identik dengan yang dipakai getViewerPose → tanpa offset.
    const refSpace = sceneEl.renderer.xr.getReferenceSpace()
    if (!refSpace) return

    this.tips.length = 0
    const seen = { left: false, right: false }

    for (const source of session.inputSources) {
      if (!source.hand) continue
      const hand = source.handedness === 'left' ? 'left' : 'right'
      seen[hand] = true
      const boxes = this.boxes[hand]
      if (!frame.fillPoses(source.hand.values(), refSpace, this.positions)) {
        boxes.forEach((b) => { b.visible = false })
        continue
      }
      frame.fillJointRadii(source.hand.values(), this.radii)
      for (let i = 0; i < JOINT_COUNT; i++) {
        const b = boxes[i]
        this.m.fromArray(this.positions, i * 16)
        this.m.decompose(b.position, b.quaternion, b.scale)
        const r = this.radii[i] || 0.008
        b.scale.set(r, r, r)
        b.visible = true
      }
      for (const tipIdx of FINGER_TIPS) {
        this.tips.push(new AFRAME.THREE.Vector3().setFromMatrixPosition(
          this.m.fromArray(this.positions, tipIdx * 16)))
      }
    }
    // Sembunyikan tangan yang tak terlihat frame ini.
    for (const hand of ['left', 'right']) {
      if (!seen[hand]) this.boxes[hand].forEach((b) => { b.visible = false })
    }

    this.updateTouch()
  },

  updateTouch() {
    const buttons = document.querySelectorAll('.touchable')
    if (!buttons.length || !this.tips.length) return
    buttons.forEach((btn) => {
      if (!btn.object3D.visible) return
      btn.object3D.getWorldPosition(this.bw)
      let d = Infinity
      for (const tip of this.tips) { const dd = tip.distanceTo(this.bw); if (dd < d) d = dd }
      let state = this.touched.get(btn) || { on: false }
      if (!state.on && d < TOUCH_ENTER) {
        state.on = true
        btn.setAttribute('color', btn.dataset.colorActive || '#2c5344')
        log(`raw-hands touch: "${btn.__touch?.label}" (d=${d.toFixed(3)})`)
        btn.__touch?.onSelect?.()
      } else if (state.on && d > TOUCH_EXIT) {
        state.on = false
        btn.setAttribute('color', btn.dataset.colorBase || '#12241f')
      }
      this.touched.set(btn, state)
    })
  },
})
