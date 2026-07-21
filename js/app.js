/* PDF Toolkit Pro — core framework & shared helpers */
(function(){
const T = { tools: [], cats: [] };
window.PT = T;

T.register = function(t){ T.tools.push(t); if(T.cats.indexOf(t.cat)<0) T.cats.push(t.cat); };

/* ---------- shared helpers ---------- */
T.base = f => f.name.replace(/\.[^.]+$/,'');
T.esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
T.fmtSize = n => n>1048576 ? (n/1048576).toFixed(1)+' MB' : (n/1024).toFixed(1)+' KB';

T.download = function(data, name, mime){
  const blob = data instanceof Blob ? data : new Blob([data], {type: mime||'application/octet-stream'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href), 10000);
  toast('Download started: '+name, 'ok');
};

const _loaded = {};
T.loadScript = url => _loaded[url] || (_loaded[url] = new Promise((res, rej)=>{
  const s = document.createElement('script');
  s.src = url; s.onload = res;
  s.onerror = ()=>rej(new Error('Could not load a required library — check your internet connection.'));
  document.head.appendChild(s);
}));
T.libs = {
  jspdf: async()=>{ await T.loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'); return window.jspdf.jsPDF; },
  mammoth: async()=>{ await T.loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js'); return window.mammoth; },
  xlsx: async()=>{ await T.loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'); return window.XLSX; },
  tesseract: async()=>{ await T.loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.0/dist/tesseract.min.js'); return window.Tesseract; }
};

/* ---------- PDF helpers ---------- */
T.openPdf = async f => PDFLib.PDFDocument.load(await f.arrayBuffer(), {ignoreEncryption:true});
T.savePdf = async (doc, name) => T.download(await doc.save(), name, 'application/pdf');
T.parseRanges = function(str, max){
  const out = [];
  String(str||'').split(',').map(s=>s.trim()).filter(Boolean).forEach(p=>{
    const m = p.match(/^(\d+)?\s*-\s*(\d+)?$/);
    if(m){ const a=m[1]?+m[1]:1, b=m[2]?+m[2]:max; for(let i=a;i<=Math.min(b,max);i++) if(i>=1) out.push(i-1); }
    else if(/^\d+$/.test(p) && +p>=1 && +p<=max) out.push(+p-1);
  });
  return Array.from(new Set(out));
};
T.pdfjs = function(){
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
  return pdfjsLib;
};
T.renderPdf = async function(file, scale, status){
  const pdf = await T.pdfjs().getDocument({data: await file.arrayBuffer()}).promise;
  const out = [];
  for(let i=1;i<=pdf.numPages;i++){
    if(status) status('Rendering page '+i+' of '+pdf.numPages+'…', {pct: (i-1)/pdf.numPages*100});
    const page = await pdf.getPage(i);
    const vp = page.getViewport({scale: scale||1.5});
    const c = document.createElement('canvas'); c.width = Math.ceil(vp.width); c.height = Math.ceil(vp.height);
    await page.render({canvasContext: c.getContext('2d'), viewport: vp}).promise;
    out.push(c);
  }
  if(status) status('Finalizing…', {pct: 100});
  return out;
};
T.pdfText = async function(file, status){
  const pdf = await T.pdfjs().getDocument({data: await file.arrayBuffer()}).promise;
  const pages = [];
  for(let i=1;i<=pdf.numPages;i++){
    if(status) status('Reading page '+i+' of '+pdf.numPages+'…', {pct: (i-1)/pdf.numPages*100});
    const tc = await (await pdf.getPage(i)).getTextContent();
    const lines = []; let line = '', lastY = null;
    tc.items.forEach(it=>{
      if(lastY!==null && Math.abs(it.transform[5]-lastY)>2){ lines.push(line.trimEnd()); line=''; }
      line += it.str + ' ';
      lastY = it.transform[5];
    });
    lines.push(line.trimEnd());
    pages.push(lines.join('\n'));
  }
  if(status) status('Finalizing…', {pct: 100});
  return pages;
};
T.canvasesToPdf = async function(canvases, quality, scale){
  const doc = await PDFLib.PDFDocument.create();
  for(const c of canvases){
    const img = await doc.embedJpg(c.toDataURL('image/jpeg', quality||0.8));
    const w = c.width/(scale||1.5), h = c.height/(scale||1.5);
    const p = doc.addPage([w,h]);
    p.drawImage(img, {x:0, y:0, width:w, height:h});
  }
  return doc;
};
T.canvasBlob = (c, type, q) => new Promise(res=>c.toBlob(res, type, q));
T.imgToCanvas = f => new Promise((res, rej)=>{
  const img = new Image();
  img.onload = ()=>{
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0,0,c.width,c.height); x.drawImage(img,0,0);
    URL.revokeObjectURL(img.src); res(c);
  };
  img.onerror = ()=>rej(new Error('Could not read this image file.'));
  img.src = URL.createObjectURL(f);
});
T.zip = async function(items, name){
  const z = new JSZip();
  items.forEach(it=>z.file(it.name, it.data));
  T.download(await z.generateAsync({type:'blob'}), name, 'application/zip');
};
T.printHtml = function(html, title){
  const w = window.open('', '_blank');
  if(!w) throw new Error('Pop-up blocked — please allow pop-ups for this site, then run again.');
  w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+T.esc(title)+'</title><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;line-height:1.6;padding:0 20px}img{max-width:100%}table{border-collapse:collapse}td,th{border:1px solid #999;padding:4px 8px}</style></head><body>'+html+'</body></html>');
  w.document.close();
  setTimeout(()=>w.print(), 600);
};

/* ---------- toast ---------- */
let toastT;
function toast(msg, kind){
  const el = document.getElementById('toast'); if(!el) return;
  el.textContent = msg;
  el.className = kind||'';
  requestAnimationFrame(()=>el.classList.add('show'));
  clearTimeout(toastT);
  toastT = setTimeout(()=>el.classList.remove('show'), 3000);
}
T.toast = toast;

/* ---------- UI ---------- */
let activeCat = 'All';
function el(tag, cls, html){ const e=document.createElement(tag); if(cls) e.className=cls; if(html!=null) e.innerHTML=html; return e; }

function renderCats(){
  const nav = document.getElementById('cats'); nav.innerHTML='';
  ['All'].concat(T.cats).forEach((c,i)=>{
    const b = el('button', 'cat'+(c===activeCat?' active':''), c);
    b.style.setProperty('--i', i);
    b.onclick = ()=>{ activeCat=c; renderCats(); renderGrid(); };
    nav.appendChild(b);
  });
}

function showSkeletons(grid, n){
  for(let i=0;i<n;i++){
    const s = el('div','skel','<div class="bar icon"></div><div class="bar t"></div><div class="bar d"></div><div class="bar d2"></div>');
    s.style.setProperty('--i', i);
    grid.appendChild(s);
  }
}

function renderGrid(){
  const q = (document.getElementById('search').value||'').toLowerCase();
  const grid = document.getElementById('grid');
  grid.innerHTML='';
  // skeleton phase for the smooth feel
  const matches = T.tools.filter(t=>
    (activeCat==='All' || t.cat===activeCat) &&
    (!q || (t.name+' '+t.desc+' '+t.cat).toLowerCase().indexOf(q)>=0)
  );
  showSkeletons(grid, Math.min(matches.length, 8));
  setTimeout(()=>{
    grid.innerHTML='';
    matches.forEach((t,i)=>{
      const card = el('div','card','<div class="icon">'+t.icon+'</div><h3>'+T.esc(t.name)+'</h3><p>'+T.esc(t.desc)+'</p>');
      card.style.setProperty('--i', i);
      card.onclick = ()=>openTool(t);
      grid.appendChild(card);
    });
    document.getElementById('count').textContent = matches.length+' of '+T.tools.length+' tools';
  }, 280);
}

function openTool(t){
  const m = document.getElementById('modal'), box = document.getElementById('modal-box');
  m.classList.remove('hidden');
  requestAnimationFrame(()=>m.classList.add('show'));
  box.innerHTML = '';
  let files = [];
  const close = el('button','close','\u00d7');
  const closeModal = ()=>{ m.classList.remove('show'); setTimeout(()=>m.classList.add('hidden'), 220); };
  close.onclick = closeModal;
  box.appendChild(close);
  const h2 = el('h2', null, '<span class="icon">'+t.icon+'</span><span>'+T.esc(t.name)+'</span>');
  box.appendChild(h2);
  box.appendChild(el('p','tdesc', T.esc(t.desc)));
  const input = document.createElement('input');
  input.type = 'file'; input.hidden = true;
  if(t.accept) input.accept = t.accept;
  if(t.multiple) input.multiple = true;
  const drop = el('div','drop','<span class="dicon">\ud83d\udcc1</span><strong>Click to choose file'+(t.multiple?'s':'')+'</strong><span class="dhint">or drag & drop here</span>');
  const flist = el('div','flist','');
  const setFiles = fl => { files = Array.from(fl); flist.innerHTML = files.map(f=>'<span class="chip">'+T.esc(f.name)+' <i>('+T.fmtSize(f.size)+')</i></span>').join(''); };
  drop.onclick = ()=>input.click();
  input.onchange = ()=>setFiles(input.files);
  drop.ondragover = e=>{ e.preventDefault(); drop.classList.add('over'); };
  drop.ondragleave = ()=>drop.classList.remove('over');
  drop.ondrop = e=>{ e.preventDefault(); drop.classList.remove('over'); setFiles(e.dataTransfer.files); };
  box.appendChild(drop); box.appendChild(input); box.appendChild(flist);
  const optWrap = el('div','opts','');
  (t.options||[]).forEach(o=>{
    const row = el('label','opt','<span>'+T.esc(o.label)+'</span>');
    let inp;
    if(o.type==='select'){
      inp = document.createElement('select');
      o.choices.forEach(c=>{ const op=document.createElement('option'); op.value=c; op.textContent=c; inp.appendChild(op); });
      if(o.def!=null) inp.value = o.def;
    } else {
      inp = document.createElement('input');
      inp.type = o.type||'text';
      if(o.def!=null) inp.value = o.def;
      if(o.ph) inp.placeholder = o.ph;
    }
    inp.dataset.k = o.key; row.appendChild(inp); optWrap.appendChild(row);
  });
  box.appendChild(optWrap);
  const run = el('button','run','Run \u2192');
  const st = el('div','status','');
  const prog = el('div','prog','<div class="fill"></div>');
  const status = (msg, extra)=>{
    st.textContent = msg;
    st.className = 'status '+(extra && extra.kind ? extra.kind : 'working');
    if(extra && typeof extra.pct==='number'){
      prog.classList.add('show');
      prog.querySelector('.fill').style.width = extra.pct+'%';
      if(extra.pct>=100) setTimeout(()=>prog.classList.remove('show'), 800);
    }
  };
  box.appendChild(run); box.appendChild(prog); box.appendChild(st);
  run.onclick = async ()=>{
    if(!files.length){ status('Please choose a file first.', {kind:'err'}); toast('No file selected','err'); return; }
    run.disabled = true;
    run.innerHTML = '<span class="spin"></span>Processing…';
    status('Working…', {pct: 0});
    try{
      const opts = {};
      (t.options||[]).forEach(o=>{ const e2 = box.querySelector('[data-k="'+o.key+'"]'); opts[o.key] = o.type==='number' ? parseFloat(e2.value) : e2.value; });
      const msg = await t.run(files, opts, status);
      prog.querySelector('.fill').style.width = '100%';
      status(msg || 'Done — your download has started.', {kind:'ok', pct: 100});
      toast(msg || 'Done', 'ok');
    }catch(err){
      status('\u26a0 '+(err && err.message ? err.message : err), {kind:'err'});
      toast(err && err.message ? err.message : 'Something went wrong', 'err');
    }
    run.disabled = false;
    run.innerHTML = 'Run \u2192';
  };
}

T.init = function(){
  renderCats(); renderGrid();
  let st;
  document.getElementById('search').addEventListener('input', ()=>{ clearTimeout(st); st = setTimeout(renderGrid, 120); });
  document.getElementById('modal').addEventListener('click', e=>{ if(e.target.id==='modal'){ e.target.classList.remove('show'); setTimeout(()=>e.target.classList.add('hidden'), 220); } });
  document.addEventListener('keydown', e=>{ if(e.key==='Escape' && !document.getElementById('modal').classList.contains('hidden')){ const m=document.getElementById('modal'); m.classList.remove('show'); setTimeout(()=>m.classList.add('hidden'), 220); } });
};
})();
