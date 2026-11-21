// CDP driver minimal untuk verifikasi headless (tanpa dependency).
// Pakai: node scripts/cdp.mjs <nav|eval|shot> [arg]
//   nav  <url>          — buka/arahkan tab verifikasi ke url
//   eval <file.js>      — jalankan JS (boleh async IIFE) di tab, print hasil JSON
//   shot <path>         — screenshot jpeg tab ke path
const DEBUG = 'http://127.0.0.1:9222';

async function getTarget() {
  const list = await (await fetch(`${DEBUG}/json/list`)).json();
  let t = list.find((x) => x.type === 'page' && /localhost:7\d00/.test(x.url));
  if (!t) {
    t = await (await fetch(`${DEBUG}/json/new?about:blank`, { method: 'PUT' })).json();
  }
  return t;
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    let id = 0;
    const pending = new Map();
    ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve: r, reject: j } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? j(new Error(JSON.stringify(msg.error))) : r(msg.result);
      }
    };
    ws.onopen = () =>
      resolve({
        send: (method, params = {}) =>
          new Promise((r, j) => {
            const mid = ++id;
            pending.set(mid, { resolve: r, reject: j });
            ws.send(JSON.stringify({ id: mid, method, params }));
          }),
        close: () => ws.close(),
      });
    ws.onerror = () => reject(new Error('ws error'));
  });
}

const [cmd, arg] = process.argv.slice(2);
const target = await getTarget();
const cdp = await connect(target.webSocketDebuggerUrl);
await cdp.send('Page.enable');
await cdp.send('Runtime.enable');

if (cmd === 'nav') {
  await cdp.send('Page.navigate', { url: arg });
  await new Promise((r) => setTimeout(r, 500));
  console.log(JSON.stringify({ ok: true, url: arg }));
} else if (cmd === 'eval') {
  const { readFileSync } = await import('node:fs');
  const expression = readFileSync(arg, 'utf8');
  const res = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    timeout: Number(process.env.CDP_TIMEOUT || 120000),
  });
  if (res.exceptionDetails) {
    console.log(JSON.stringify({ error: res.exceptionDetails.exception?.description || res.exceptionDetails.text }));
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify(res.result.value));
  }
} else if (cmd === 'offline') {
  await cdp.send('Network.enable');
  const off = arg !== 'false';
  await cdp.send('Network.emulateNetworkConditions', {
    offline: off, latency: 0, downloadThroughput: -1, uploadThroughput: -1,
  });
  console.log(JSON.stringify({ ok: true, offline: off }));
} else if (cmd === 'shot') {
  const res = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
  const { writeFileSync } = await import('node:fs');
  const { resolve } = await import('node:path');
  const p = resolve(arg);
  writeFileSync(p, Buffer.from(res.data, 'base64'));
  console.log(JSON.stringify({ ok: true, path: p }));
} else {
  console.error('unknown cmd');
  process.exitCode = 1;
}
cdp.close();
