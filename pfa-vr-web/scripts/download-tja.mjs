// download-tja.mjs — unduh GLB free threejsassets.com via tab WebBridge yang sudah login.
// Pakai: node scripts/download-tja.mjs <slug...>
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const slugs = process.argv.slice(2);
const outDir = fileURLToPath(new URL('../public/models/', import.meta.url));
mkdirSync(outDir, { recursive: true });

const evalCode = (slug) => `(async()=>{const r=await fetch('/download/free/${slug}');if(r.status!==200)return JSON.stringify({slug:'${slug}',error:'HTTP '+r.status});const buf=await r.arrayBuffer();const b=new Uint8Array(buf);if(String.fromCharCode(...b.slice(0,4))!=='glTF')return JSON.stringify({slug:'${slug}',error:'bukan GLB',head:String.fromCharCode(...b.slice(0,40))});let s='';for(let i=0;i<b.length;i+=8192)s+=String.fromCharCode(...b.subarray(i,i+8192));return JSON.stringify({slug:'${slug}',size:buf.byteLength,b64:btoa(s)});})()`;

for (const slug of slugs) {
  const body = JSON.stringify({ action: 'evaluate', args: { code: evalCode(slug) }, session: 'pfa-vr-assets' });
  const res = await fetch('http://127.0.0.1:10086/command', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
  const json = await res.json();
  const val = json?.data?.value ? JSON.parse(json.data.value) : null;
  if (!val || val.error) {
    console.log(JSON.stringify({ slug, ok: false, detail: val || json }));
    continue;
  }
  writeFileSync(`${outDir}${slug}.glb`, Buffer.from(val.b64, 'base64'));
  console.log(JSON.stringify({ slug, ok: true, size: val.size }));
}
