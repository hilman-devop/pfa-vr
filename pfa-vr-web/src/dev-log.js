// dev-log.js — tagged console output untuk debugging selama pengembangan.
// Semua log memakai prefix [PFA] supaya mudah difilter di browser console.
// Hanya aktif di dev; di production tetap jalan tapi bisa dimatikan via ?nolog.

const q = new URLSearchParams(location.search)
const enabled = !q.has('nolog')
const TAG = '[PFA]'

export const log = (...a) => { if (enabled) console.log(TAG, ...a) }
export const warn = (...a) => { if (enabled) console.warn(TAG, ...a) }
export const err = (...a) => console.error(TAG, ...a) // error selalu tampil
