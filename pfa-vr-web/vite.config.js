import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { WebSocketServer } from 'ws'

// Relay sesi lintas-perangkat (lokal LAN): Quest (role=vr) memublikasikan state sesi,
// halaman kontrol (role=control) membacanya & mengirim perintah. Relay menempel di server
// dev yang sama (sudah HTTPS via basicSsl → wss, perlu utk WebXR saat lewat LAN).
function sessionRelay() {
  return {
    name: 'session-relay',
    configureServer(server) {
      const wss = new WebSocketServer({ noServer: true })
      const clients = new Set()
      const peers = { vr: null, control: null }
      let lastState = null

      server.httpServer.on('upgrade', (req, socket, head) => {
        if (!(req.url || '').startsWith('/__relay')) return
        wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req))
      })

      wss.on('connection', (ws) => {
        ws.role = null
        clients.add(ws)
        ws.on('message', (raw) => {
          let m
          try { m = JSON.parse(raw.toString()) } catch { return }
          if (m.type === 'hello') {
            ws.role = m.role === 'control' ? 'control' : 'vr'
            peers[ws.role] = ws
            // klien baru (terutama kontrol yg buka di tengah sesi) dapat state terakhir
            if (lastState && ws.readyState === 1) ws.send(JSON.stringify({ type: 'state', state: lastState }))
            return
          }
          if (m.type === 'state' && ws.role === 'vr') {
            lastState = m.state
            // teruskan state VR ke klien lain (terutama control)
            clients.forEach((c) => { if (c !== ws && c.readyState === 1) c.send(raw.toString()) })
            return
          }
          if (m.type === 'command' && ws.role === 'control' && peers.vr && peers.vr.readyState === 1) {
            peers.vr.send(raw.toString())
          }
        })
        ws.on('close', () => {
          clients.delete(ws)
          if (peers[ws.role] === ws) peers[ws.role] = null
        })
      })
    },
  }
}

export default defineConfig({
  server: { port: 7100, host: true },
  plugins: [
    basicSsl(),
    sessionRelay(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'PFA-VR — Sesi Pemulihan',
        short_name: 'PFA-VR',
        description: 'Psychological First Aid berbasis Virtual Reality untuk korban bencana erupsi',
        lang: 'id',
        display: 'standalone',
        background_color: '#0e2a25',
        theme_color: '#0e2a25',
        icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        // Audio + model GLB + decoder Draco wajib ikut cache (offline penuh, T6.1).
        globPatterns: ['**/*.{js,css,html,svg,glb,wasm,mp3,wav,ogg,opus,png,json}'], // png+json = font a-text lokal; ogg/opus = ambience 2026-08
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024, // WAV ambience 10–14 MB
      },
    }),
  ],
})
