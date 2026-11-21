// environment.js — Environment master 360°: RUANG TAMU (indoor) untuk S1–S7.
// Satu lokasi dipakai semua scene; scene hanya mengatur visibility + animasi.
// Layout (pengguna di tengah, menghadap -z): depan=dinding, kiri=sofa+meja, kanan=tanaman,
// belakang=regal/TV+foto+pintu. Semua geometri primitif A-Frame (0 aset GLB baru; hanya sign).

import { el } from '../utils.js'

let sceneElRef = null
export const env = {}

// Pop-in: dari skala 0 ke 1 (dipakai scene untuk memunculkan objek).
export function pop(target, delay = 0) {
  target.setAttribute('animation__pop', {
    property: 'scale', from: '0.001 0.001 0.001', to: '1 1 1',
    dur: 700, delay, easing: 'easeOutBack',
  })
}

export function resetEnvironment() {
  if (sceneElRef) buildEnvironment(sceneElRef)
}

// Pseudo-random deterministik (hasil sama setiap build).
let seed = 42
const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }

// ---------- Pembangun ruang tamu ----------

const MODEL = {
  sign: { src: '/models/farm-gate-sign.glb', s: 1.1, y: 1.5 }, // papan penutup S7
}
const glb = (m, extra = {}) => ({ 'gltf-model': m.src, ...extra })

function kakiMeja(parent, dx, dz) {
  el('a-cylinder', { position: `${dx} 0.21 ${dz}`, radius: 0.025, height: 0.42, color: '#6b4f35' }, parent)
}

// ---------- Build utama ----------

export function buildEnvironment(sceneEl) {
  sceneElRef = sceneEl
  seed = 42
  const root = sceneEl.querySelector('#env-root')
  root.innerHTML = ''

  // ---------- Penanda grounding S3 (#mk-*): glow ring, tampil saat objek dipandang (khusus Scene 3).
  // Dibuat SEBELUM targetnya agar selector gaze-highlight ('#mk-*') resolve saat komponen init.
  const markerMat = { color: '#ffe9b8', emissive: '#ffcf7a', 'emissive-intensity': 1, opacity: 0.8, transparent: true }
  const marker = (id, attrs) => el('a-ring', { id, visible: false, 'radius-inner': 1.4, 'radius-outer': 1.8, ...markerMat, ...attrs }, root)
  marker('mk-sofa', { position: '0.75 0.6 0.3', 'radius-inner': 0.5, 'radius-outer': 0.7 })
  marker('mk-layar', { position: '0 1.85 -3.82', 'radius-inner': 1.6, 'radius-outer': 1.9 })
  marker('mk-tanaman', { position: '1.9 1.0 -1.5', rotation: '0 30 0', 'radius-inner': 0.8, 'radius-outer': 1.05 })
  marker('mk-karpet', { rotation: '-90 0 0', position: '0 0.05 -0.4', 'radius-inner': 1.4, 'radius-outer': 1.75 })
  marker('mk-meja', { rotation: '-90 0 0', position: '0 0.05 -0.9', 'radius-inner': 0.95, 'radius-outer': 1.2 })

  // ---------- Pencahayaan ----------
  el('a-light', { type: 'ambient', color: '#e8e2d0', intensity: 0.7 }, root)
  env.dirLight = el('a-light', { type: 'directional', color: '#fff2d0', intensity: 0.85, position: '0 3 -3' }, root)
  // Lampu plafon hangat — target warm-pulse S2 & "cahaya pagi" S6 (env.lampu = a-light point).
  env.lampu = el('a-light', { type: 'point', color: '#ffe3b8', intensity: 0.55, distance: 14, position: '0 2.7 0' }, root)
  el('a-sphere', { position: '0 2.62 0', radius: 0.3, color: '#ffe9b8', emissive: '#ffcf7a', 'emissive-intensity': 0.9 }, root)

  // ---------- Shell ruangan (±4 m, dinding 3,1 m, plafon 3,2 m) ----------
  // Lantai kayu hangat
  el('a-plane', { rotation: '-90 0 0', position: '0 0 0', width: 8, height: 8, color: '#b99a6d' }, root)

  // Dinding depan solid — dark green soft; layar proyektor menggantikan jendela
  el('a-box', { position: '0 1.55 -3.95', width: 8, height: 3.1, depth: 0.12, color: '#33503f' }, root)
  // Layar proyektor (grounding S3) — bingkai gelap + permukaan abu-abu + logo Unmuh
  env.layar = el('a-entity', { class: 'clickable', 'gaze-highlight': '#mk-layar' }, root)
  el('a-box', { position: '0 1.85 -3.88', width: 3.4, height: 1.9, depth: 0.04, color: '#0e2a25' }, env.layar) // bingkai layar
  el('a-plane', { position: '0 1.85 -3.855', width: 3.2, height: 1.7, color: '#8f9691', material: 'shader: flat' }, env.layar) // permukaan layar (abu-abu sedang)
  el('a-image', { src: '/img/logo-unmuh.png', position: '0 1.85 -3.85', width: 1.5, height: 1.5, material: 'shader: flat; transparent: true' }, env.layar) // logo diproyeksikan

  // Dinding kiri, kanan, belakang + plafon (dinding dark green soft, plafon terang)
  el('a-box', { position: '-3.95 1.55 0', width: 0.12, height: 3.1, depth: 8, color: '#2f4a3a' }, root)
  el('a-box', { position: '3.95 1.55 0', width: 0.12, height: 3.1, depth: 8, color: '#2f4a3a' }, root)
  el('a-box', { position: '0 1.55 3.95', width: 8, height: 3.1, depth: 0.12, color: '#314d3c' }, root)
  el('a-box', { position: '0 3.2 0', width: 8, height: 0.12, depth: 8, color: '#e5ddc5' }, root)

  // ---------- Sofa tempat pengguna DUDUK (POV di sofa, menghadap -z ke layar proyektor) ----------
  // Rig tetap di lantai (0 0 0) sesuai invariant; sofa dibawa ke pengguna, bukan sebaliknya.
  env.sofa = el('a-entity', {
    position: '0 0 0.5', rotation: '0 180 0',
    class: 'clickable', 'gaze-highlight': '#mk-sofa',
  }, root)
  el('a-box', { position: '0 0.28 0', width: 1.7, height: 0.45, depth: 0.75, color: '#8a6f4d' }, env.sofa) // rangka
  el('a-box', { position: '0 0.42 0', width: 1.6, height: 0.25, depth: 0.7, color: '#a8d5ba' }, env.sofa) // alas duduk
  el('a-box', { position: '0 0.78 -0.28', width: 1.6, height: 0.62, depth: 0.22, color: '#9cc7ad' }, env.sofa) // sandaran
  el('a-box', { position: '-0.82 0.55 0', width: 0.2, height: 0.5, depth: 0.7, color: '#8fb89a' }, env.sofa) // lengan kiri
  el('a-box', { position: '0.82 0.55 0', width: 0.2, height: 0.5, depth: 0.7, color: '#8fb89a' }, env.sofa) // lengan kanan
  el('a-box', { position: '-0.4 0.62 0.05', width: 0.6, height: 0.18, depth: 0.45, color: '#c9e6d2' }, env.sofa) // bantal
  el('a-box', { position: '0.4 0.62 0.05', width: 0.6, height: 0.18, depth: 0.45, color: '#c9e6d2' }, env.sofa)

  // ---------- Karpet (grounding) — diperbesar & dipusatkan di bawah sofa + meja ----------
  env.karpet = el('a-plane', {
    rotation: '-90 0 0', position: '0 0.012 -0.4', width: 4.2, height: 3.6,
    color: '#a8d5ba', class: 'clickable', 'gaze-highlight': '#mk-karpet',
  }, root)

  // ---------- Meja kopi di depan sofa (grounding) — sisi panjang melintang (kiri-kanan) ----------
  env.meja = el('a-entity', {
    position: '0 0 -0.9', rotation: '0 0 0', class: 'clickable', 'gaze-highlight': '#mk-meja',
  }, root)
  el('a-box', { position: '0 0.42 0', width: 1.1, height: 0.06, depth: 0.6, color: '#8a6f4d' }, env.meja)
  kakiMeja(env.meja, -0.48, -0.24)
  kakiMeja(env.meja, -0.48, 0.24)
  kakiMeja(env.meja, 0.48, -0.24)
  kakiMeja(env.meja, 0.48, 0.24)

  // ---------- Kanan: tanaman pot (grounding) ----------
  env.tanaman = el('a-entity', {
    position: '1.9 0 -1.5', scale: '0.62 0.62 0.62', class: 'clickable', 'gaze-highlight': '#mk-tanaman',
  }, root)
  el('a-cylinder', { position: '0 0.28 0', radius: 0.28, height: 0.55, color: '#b0764a' }, env.tanaman) // pot
  el('a-cylinder', { position: '0 0.53 0', radius: 0.3, height: 0.08, color: '#9a5f3c' }, env.tanaman) // bibir pot
  el('a-cylinder', { position: '0 0.85 0', radius: 0.03, height: 0.7, color: '#5e8f5a' }, env.tanaman) // batang
  el('a-sphere', { position: '0 1.25 0', radius: 0.45, scale: '1 0.9 1', color: '#4f8f5a' }, env.tanaman)
  el('a-sphere', { position: '0.3 1.05 0.2', radius: 0.3, color: '#5a9c66' }, env.tanaman)
  el('a-sphere', { position: '-0.25 1.0 -0.15', radius: 0.28, color: '#47824f' }, env.tanaman)
  el('a-sphere', { position: '0.15 1.4 -0.1', radius: 0.34, color: '#5aa06a' }, env.tanaman)

  // ---------- Belakang: regal/TV + pintu (dekor non-interaktif) ----------
  const regal = el('a-entity', { position: '-1.4 0 3.75' }, root)
  el('a-box', { position: '0 0.3 0', width: 2.9, height: 0.6, depth: 0.45, color: '#6b4f35' }, regal) // kabinet
  el('a-box', { position: '-1.25 0.08 0', width: 0.12, height: 0.16, depth: 0.3, color: '#5a4430' }, regal)
  el('a-box', { position: '1.25 0.08 0', width: 0.12, height: 0.16, depth: 0.3, color: '#5a4430' }, regal)
  el('a-box', { position: '0 1.15 -0.02', width: 2.1, height: 1.15, depth: 0.08, color: '#26322e' }, regal) // layar
  el('a-box', { position: '0 1.15 -0.055', width: 2.24, height: 1.28, depth: 0.03, color: '#3d3023' }, regal) // bingkai
  // Pintu (belakang kanan)
  el('a-box', { position: '2.3 1.1 3.9', width: 1.1, height: 2.2, depth: 0.08, color: '#8a6f4d' }, root)
  el('a-sphere', { position: '2.75 1.05 3.93', radius: 0.04, color: '#f4e8c3' }, root) // kenop
  // Rak dinding kecil (kanan)
  el('a-box', { position: '3.9 1.0 1.4', width: 0.06, height: 0.05, depth: 0.7, color: '#8a6f4d' }, root)
  el('a-box', { position: '3.9 1.5 1.8', width: 0.06, height: 0.05, depth: 0.7, color: '#8a6f4d' }, root)

  // ---------- Riak lantai S2 (di dekat orb napas; mekanisme s2 tetap) ----------
  env.rings = [0, 1, 2].map(() =>
    el('a-ring', {
      rotation: '-90 0 0', position: '0 0.03 -2.4', 'radius-inner': 0.22, 'radius-outer': 0.28,
      color: '#eaf6fa', opacity: 0, transparent: true, visible: false,
    }, root))

  // ---------- Simbol S4 (kartu bertiang + ikon) DI DEPAN, dinding depan menghadap pengguna ----------
  env.symbolsGroup = el('a-entity', { visible: false }, root)
  const simbolDef = [
    ['air', 'AIR MINUM', -2.4], ['rumah', 'RUMAH', -0.8],
    ['keluarga', 'KELUARGA', 0.8], ['komunitas', 'KOMUNITAS', 2.4],
  ]
  env.symbols = {}
  for (const [key, label, x] of simbolDef) {
    const g = el('a-entity', { position: `${x} 0 -3.3`, scale: '0.001 0.001 0.001', rotation: '0 0 0' }, env.symbolsGroup)
    el('a-cylinder', { position: '0 0.6 0', radius: 0.05, height: 1.2, color: '#6b4f35' }, g) // tiang
    el('a-cylinder', { position: '0 0.04 0', radius: 0.14, height: 0.08, color: '#5a4430' }, g) // kaki
    el('a-box', { position: '0 1.45 0', width: 1.2, height: 0.7, depth: 0.06, color: '#f4e8c3', class: 'clickable' }, g) // kartu
    g.setAttribute('animation__pulse', { property: 'scale', from: '0.8 0.8 0.8', to: '1 1 1', dur: 500, easing: 'easeOutBack', startEvents: 'pulse' })
    g.addEventListener('gaze-select', () => g.emit('pulse'))
    el('a-box', { position: '0 1.45 -0.035', width: 1.28, height: 0.78, depth: 0.02, color: '#d8c9a0' }, g) // bingkai
    el('a-text', { value: label, align: 'center', position: '0 1.28 0.05', width: 2.2, color: '#2e4034' }, g)
    if (key === 'air') {
      el('a-sphere', { position: '0 1.58 0.05', radius: 0.09, scale: '0.8 1.1 0.8', color: '#7fb8d4' }, g)
    } else if (key === 'rumah') {
      el('a-box', { position: '0 1.55 0.05', width: 0.16, height: 0.1, depth: 0.02, color: '#8a6f4d' }, g)
      el('a-cone', { position: '0 1.64 0.05', 'radius-bottom': 0.12, height: 0.09, 'segments-radial': 4, rotation: '0 45 0', color: '#6b4f35' }, g)
    } else if (key === 'keluarga') {
      el('a-sphere', { position: '-0.06 1.58 0.05', radius: 0.06, color: '#8ed0ae' }, g)
      el('a-sphere', { position: '0.06 1.58 0.05', radius: 0.05, color: '#a8d5ba' }, g)
    } else {
      el('a-sphere', { position: '-0.09 1.58 0.05', radius: 0.05, color: '#8ed0ae' }, g)
      el('a-sphere', { position: '0 1.6 0.05', radius: 0.05, color: '#a8d5ba' }, g)
      el('a-sphere', { position: '0.09 1.58 0.05', radius: 0.05, color: '#7fb896' }, g)
    }
    env.symbols[key] = g
  }

  // ---------- Siluet S5 (berdiri di sisi DEPAN-kanan, menghadap pengguna) ----------
  env.silhouetteGroup = el('a-entity', { visible: false }, root)
  const silDef = [
    ['KELUARGA', 2.9, -1.4, 0.72], ['TETANGGA', 3.1, -2.4, 0.68],
    ['RELAWAN', 1.6, -3.2, 0.72], ['PETUGAS KESEHATAN', 3.3, -3.2, 0.65],
  ]
  env.silhouettes = silDef.map(([label, x, z, skala]) => {
    const menghadapPengguna = Math.atan2(-x, -z) * 180 / Math.PI
    const g = el('a-entity', {
      position: `${x} 0 ${z}`, rotation: `0 ${menghadapPengguna} 0`, scale: '0.001 0.001 0.001',
    }, env.silhouetteGroup)
    const inner = el('a-entity', { scale: `${skala} ${skala} ${skala}` }, g)
    const bodyMat = { color: '#d8f0e0', emissive: '#8ed0ae', 'emissive-intensity': 0.9, transparent: true, opacity: 0.95 }
    el('a-cone', { position: '0 0.85 0', 'radius-top': 0.2, 'radius-bottom': 0.26, height: 1.05, ...bodyMat }, inner)
    el('a-sphere', { position: '0 1.42 0', radius: 0.24, scale: '1.25 0.55 0.8', ...bodyMat }, inner) // bahu
    el('a-sphere', { position: '0 1.66 0', radius: 0.26, ...bodyMat }, inner)
    el('a-sphere', { position: '0 1.66 0', radius: 0.32, color: '#eaf7ee', opacity: 0.25, transparent: true }, inner)
    const labelWidth = label === 'PETUGAS KESEHATAN' ? 2.1 : 1.35
    el('a-plane', { position: '0 2.22 0', width: labelWidth, height: 0.38, color: '#12241f', opacity: 0.9, transparent: true }, inner)
    el('a-text', { value: label, align: 'center', baseline: 'center', position: '0 2.22 0.01', width: labelWidth * 1.45, color: '#ffffff', 'letter-spacing': 1 }, inner)
    return g
  })

  // ---------- Bunga S6 (mekar di area DEPAN; skala kecil indoor) ----------
  env.flowerGroup = el('a-entity', { visible: false }, root)
  const warnaBunga = ['#e88fa2', '#f4c983', '#c9a2e0', '#f4e8c3', '#e8736f']
  const bungaPos = [
    [1.2, -2.4], [2.6, -2.2], [1.6, -1.6], [2.9, -1.8],
    [-1.2, -2.6], [-2.7, -2.4], [-1.5, -1.6], [-3.0, -1.8],
    [1.2, -3.2], [2.8, -3.1], [-2.0, -3.2], [-0.6, -2.9],
  ]
  const bunga = (parent, x, z, warna) => {
    const g = el('a-entity', { position: `${x} 0 ${z}`, scale: '0.001 0.001 0.001' }, parent)
    el('a-cylinder', { position: '0 0.14 0', radius: 0.015, height: 0.28, color: '#5e8f5a' }, g)
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2
      el('a-sphere', { position: `${Math.cos(a) * 0.07} 0.3 ${Math.sin(a) * 0.07}`, radius: 0.05, scale: '1 0.5 1', color: warna }, g)
    }
    el('a-sphere', { position: '0 0.31 0', radius: 0.035, color: '#f4e8c3' }, g)
    return g
  }
  env.flowers = bungaPos.map(([x, z], i) => bunga(env.flowerGroup, x, z, warnaBunga[i % warnaBunga.length]))

  // ---------- Papan penutup S7 (model papan kayu + 3 baris teks) di depan ----------
  env.boardGroup = el('a-entity', { visible: false }, root)
  el('a-entity', {
    ...glb(MODEL.sign), position: `0 ${MODEL.sign.y} -3.2`, scale: '1.1 1.1 1.1',
  }, env.boardGroup)
  el('a-plane', {
    position: '0 1.82 -3.08', width: 2.9, height: 1.12,
    color: '#12241f', opacity: 0.92, transparent: true,
  }, env.boardGroup)
  env.boardTexts = ['ANDA AMAN', 'ANDA TIDAK SENDIRI', 'BANTUAN TERSEDIA'].map((teks, i) =>
    el('a-text', {
      value: teks, align: 'center', baseline: 'center', position: `0 ${2.14 - i * 0.31} -3.07`,
      width: 4.1, color: '#ffffff', 'letter-spacing': 1, scale: '0.001 0.001 0.001',
    }, env.boardGroup))

  env.grounding = {
    sofa: env.sofa, layar: env.layar, tanaman: env.tanaman,
    karpet: env.karpet, meja: env.meja,
  }
}