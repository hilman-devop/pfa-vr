// utils.js — helper kecil bersama.

// Mode VR aktif? (panel dalam-VR T5.4 hanya tampil di headset; DOM tetap untuk desktop)
export const inVR = () => !!document.querySelector('a-scene')?.is('vr-mode')

export function el(tag, attrs = {}, parent) {
  const e = document.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v)
  if (parent) parent.appendChild(e)
  return e
}
