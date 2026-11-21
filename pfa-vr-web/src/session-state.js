// session-state.js — state sesi pusat + log, dipakai bersama oleh scene, halaman VR,
// dan halaman kontrol (role=control). Bisa dipublikasikan ke relay WS untuk lintas-perangkat.
import { log as dlog, warn as dwarn } from './dev-log.js'

// State lokal (tanpa server tetap — murni di memori satu tab).
const state = {
  role: new URLSearchParams(location.search).get('role') === 'control' ? 'control' : 'vr',
  currentIdx: -1,
  sceneTitle: '',
  autoAdvance: true,
  running: false,
  controlUrl: null,
  logs: [], // [{ t, level, msg }]
}

const subs = new Set()
let ws = null
let wsTimer = null

export function getState() { return state }

export function subscribe(fn) {
  subs.add(fn)
  fn(state)
  return () => subs.delete(fn)
}
function emit() { subs.forEach((fn) => fn(state)) }

export function setState(patch) {
  Object.assign(state, patch)
  emit()
  publish()
}

export function log(level, msg) {
  const entry = { t: Date.now(), level, msg }
  state.logs.push(entry)
  if (state.logs.length > 400) state.logs.splice(0, state.logs.length - 400)
  emit()
  const base = `[PFA] ${new Date(entry.t).toLocaleTimeString('id-ID')} ${msg}`
  if (level === 'err') dwarn(base) // dev-log tidak punya err pub? pakai warn aman
  else dlog(base)
  publish()
}

// ---- Relay WebSocket (lintas-perangkat, lokal LAN) ----
// Quest (role=vr) memublikasikan state; halaman kontrol (role=control) membaca & kirim perintah.
// URL relay = origin halaman (relay menempel di server dev/preview yang sama).

const RELAY_PATH = '/__relay'

function relayUrl() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  return `${proto}://${location.host}${RELAY_PATH}`
}

export function connectControl(onCommand) {
  state.controlUrl = relayUrl()
  const open = () => {
    if (ws && ws.readyState <= 1) return
    try {
      ws = new WebSocket(relayUrl())
    } catch (e) { dwarn(`relay connect gagal: ${e.message}`); retry(); return }
    ws.onopen = () => {
      dlog('relay terhubung')
      ws.send(JSON.stringify({ type: 'hello', role: state.role }))
      publish() // kirim state awal ke relay
      clearTimeout(wsTimer)
    }
    ws.onmessage = (ev) => {
      let m
      try { m = JSON.parse(ev.data) } catch { return }
      if (m.type === 'state') { setStateLocal(m.state) }
      else if (m.type === 'command' && onCommand) onCommand(m.cmd)
    }
    ws.onclose = () => { dlog('relay putus'); retry() }
    ws.onerror = () => { try { ws.close() } catch {} }
  }
  const retry = () => { clearTimeout(wsTimer); wsTimer = setTimeout(open, 2000) }
  open()
}

export function sendCommand(cmd) {
  if (ws && ws.readyState === 1) ws.send(JSON.stringify({ type: 'command', cmd }))
}

function setStateLocal(patch) {
  Object.assign(state, patch)
  emit()
}

function publish() {
  if (ws && ws.readyState === 1 && state.role === 'vr') {
    ws.send(JSON.stringify({ type: 'state', state }))
  }
}
