// hand-test.js — replika LITERAL webxr-samples/immersive-hands di dalam A-Frame.
// TIDAK memakai hand-tracking-controls A-Frame (jalur visualnya membawa offset).
// Ambil pose sendi MENTAH via frame.fillPoses(hand.values(), refSpace, positions),
// refSpace = reference space milik renderer (SAMA dengan yang dipakai kamera),
// lalu gambar kotak di scene root dari matriks mentah — persis seperti sampel.

import 'aframe'

const JOINT_COUNT = 25
const INDEX_TIP = 9 // urutan sendi index-finger-tip
const scene = document.querySelector('a-scene')
// Pelajaran AGENTS.md: fitur 'hand-tracking' WAJIB terdaftar di optionalFeatures,
// kalau tidak Quest tak pernah mengekspos inputSource.hand.
scene.setAttribute('webxr', 'optionalFeatures: hand-tracking,local-floor,bounded-floor')

AFRAME.registerComponent('raw-hands', {
  init() {
    this.boxes = { left: [], right: [] }
    this.positions = new Float32Array(16 * JOINT_COUNT)
    this.radii = new Float32Array(JOINT_COUNT)
    this.m = new AFRAME.THREE.Matrix4()
    // Ujung telunjuk (posisi dunia) per tangan — dipakai untuk deteksi sentuh kotak.
    this.tip = { left: new AFRAME.THREE.Vector3(), right: new AFRAME.THREE.Vector3() }
    this.tipValid = { left: false, right: false }
    this.touchBoxes = Array.from(document.querySelectorAll('.touch-box'))
    this.bw = new AFRAME.THREE.Vector3()
    const root = this.el.object3D
    for (const hand of ['left', 'right']) {
      const color = hand === 'left' ? 0xa8d5ba : 0x7fb8d4
      for (let i = 0; i < JOINT_COUNT; i++) {
        const mesh = new AFRAME.THREE.Mesh(
          new AFRAME.THREE.BoxGeometry(1, 1, 1),
          new AFRAME.THREE.MeshStandardMaterial({ color }),
        )
        mesh.visible = false
        root.add(mesh)
        this.boxes[hand].push(mesh)
      }
    }
    this.el.sceneEl.addEventListener('loaded', () => {
      const l = new AFRAME.THREE.HemisphereLight(0xffffff, 0x444444, 1.2)
      this.el.sceneEl.object3D.add(l)
    })
  },

  tick() {
    const sceneEl = this.el.sceneEl
    const frame = sceneEl.frame
    const session = sceneEl.xrSession
    if (!frame || !session) return
    // Reference space MILIK RENDERER — identik dengan yang dipakai kamera (getViewerPose).
    // Inilah kunci sampel: tangan & kamera di space yang sama, digambar mentah tanpa offset.
    const refSpace = sceneEl.renderer.xr.getReferenceSpace()
    if (!refSpace) return

    for (const source of session.inputSources) {
      if (!source.hand) continue
      const hand = source.handedness === 'left' ? 'left' : 'right'
      const boxes = this.boxes[hand]
      if (!frame.fillPoses(source.hand.values(), refSpace, this.positions)) {
        boxes.forEach((b) => { b.visible = false })
        this.tipValid[hand] = false
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
      // Simpan posisi dunia ujung telunjuk (sama basis dengan kotak) untuk deteksi sentuh.
      this.tip[hand].setFromMatrixPosition(this.m.fromArray(this.positions, INDEX_TIP * 16))
      this.tipValid[hand] = true
    }

    // Sentuh: ujung telunjuk masuk < 6 cm → kotak hijau.
    if (this.touchBoxes.length) {
      const tips = []
      if (this.tipValid.left) tips.push(this.tip.left)
      if (this.tipValid.right) tips.push(this.tip.right)
      this.touchBoxes.forEach((el) => {
        el.object3D.getWorldPosition(this.bw)
        const near = tips.some((t) => t.distanceTo(this.bw) < 0.06)
        el.setAttribute('color', near ? '#33dd66' : '#8888aa')
      })
    }
  },
})
