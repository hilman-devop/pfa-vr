// breathing-orb.js — bola cahaya S2: membesar saat tarik napas, mengecil saat hembuskan.
// Kendali via event: 'inhale' / 'exhale' (dipicu scene s2 sinkron dengan VO).

AFRAME.registerComponent('breathing-orb', {
  init() {
    this.el.addEventListener('inhale', () => {
      this.el.setAttribute('animation__breath', {
        property: 'scale', to: '1.5 1.5 1.5', dur: 4200, easing: 'easeInOutSine',
      })
    })
    this.el.addEventListener('exhale', () => {
      this.el.setAttribute('animation__breath', {
        property: 'scale', to: '1 1 1', dur: 4200, easing: 'easeInOutSine',
      })
    })
  },
})
