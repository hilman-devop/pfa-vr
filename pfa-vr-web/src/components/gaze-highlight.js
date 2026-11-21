// gaze-highlight.js — objek bersinar lembut saat dipandang + pulse berurutan (khusus S3).
// Pasang di target dengan schema = selector penanda ring. Event 'hl-pulse': tampil 2.2 detik.
// PENTING: tidak aktif di luar Scene 3 — scene s3 menyalakan/mematikan via setActive().

AFRAME.registerComponent('gaze-highlight', {
  schema: { type: 'selector' },
  init() {
    this.active = false
    this.show = (v) => this.data?.setAttribute('visible', v)
    this.el.addEventListener('mouseenter', () => { if (this.active) this.show(true) })
    this.el.addEventListener('mouseleave', () => this.show(false))
    this.el.addEventListener('hl-pulse', () => {
      if (!this.active) return
      this.show(true)
      clearTimeout(this._t)
      this._t = setTimeout(() => this.show(false), 2200)
    })
  },
})
