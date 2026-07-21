/* PDF Toolkit Pro — organize, edit, inspect, optimize & export tools */
(function(){
const R = t => PT.register(t);
const D = ()=>PDFLib;
const SIZES = {A3:[841.89,1190.55], A4:[595.28,841.89], A5:[419.53,595.28], Letter:[612,792], Legal:[612,1008]};

async function splitEvery(file, n, status){
  const src = await PT.openPdf(file);
  const total = src.getPageCount(), parts = [];
  for(let s=0; s<total; s+=n){
    const out = await D().PDFDocument.create();
    const idx = []; for(let i=s; i<Math.min(s+n,total); i++) idx.push(i);
    (await out.copyPages(src, idx)).forEach(p=>out.addPage(p));
    parts.push({name: PT.base(file)+'-part'+(parts.length+1)+'.pdf', data: await out.save()});
    if(status) status('Created part '+parts.length+'\u2026');
  }
  await PT.zip(parts, PT.base(file)+'-split.zip');
}

/* ================= ORGANIZE ================= */
R({id:'merge', cat:'Organize', icon:'\ud83d\udd17', name:'Merge PDFs', desc:'Combine multiple PDFs into a single document, in the order you pick them.', accept:'.pdf', multiple:true,
run: async f => {
  if(f.length<2) throw new Error('Pick at least two PDFs.');
  const out = await D().PDFDocument.create();
  for(const file of f){ const s = await PT.openPdf(file); (await out.copyPages(s, s.getPageIndices())).forEach(p=>out.addPage(p)); }
  await PT.savePdf(out, 'merged.pdf');
}});
R({id:'extract', cat:'Organize', icon:'\u2702\ufe0f', name:'Extract pages', desc:'Pull selected pages (e.g. 1-3,7) into a new PDF.', accept:'.pdf', options:[{key:'range',label:'Pages',type:'text',def:'1',ph:'e.g. 1-3,7'}],
run: async (f,o)=>{
  const src = await PT.openPdf(f[0]);
  const idx = PT.parseRanges(o.range, src.getPageCount());
  if(!idx.length) throw new Error('No valid pages in that range.');
  const out = await D().PDFDocument.create();
  (await out.copyPages(src, idx)).forEach(p=>out.addPage(p));
  await PT.savePdf(out, PT.base(f[0])+'-pages.pdf');
}});
R({id:'split-n', cat:'Organize', icon:'\ud83e\ude93', name:'Split every N pages', desc:'Cut a PDF into equal chunks and download them as a ZIP.', accept:'.pdf', options:[{key:'n',label:'Pages per part',type:'number',def:2}],
run: (f,o,s)=>splitEvery(f[0], Math.max(1, Math.floor(o.n||1)), s)});
R({id:'split-1', cat:'Organize', icon:'\ud83d\udcc4', name:'Split into single pages', desc:'Save every page as its own PDF file (ZIP download).', accept:'.pdf',
run: (f,o,s)=>splitEvery(f[0], 1, s)});
R({id:'remove', cat:'Organize', icon:'\ud83d\uddd1\ufe0f', name:'Remove pages', desc:'Delete the pages you specify and keep the rest.', accept:'.pdf', options:[{key:'range',label:'Pages to remove',type:'text',def:'',ph:'e.g. 2,5-6'}],
run: async (f,o)=>{
  const src = await PT.openPdf(f[0]);
  const del = new Set(PT.parseRanges(o.range, src.getPageCount()));
  if(!del.size) throw new Error('Specify at least one page to remove.');
  const keep = src.getPageIndices().filter(i=>!del.has(i));
  if(!keep.length) throw new Error('You cannot remove every page.');
  const out = await D().PDFDocument.create();
  (await out.copyPages(src, keep)).forEach(p=>out.addPage(p));
  await PT.savePdf(out, PT.base(f[0])+'-removed.pdf');
}});
R({id:'reorder', cat:'Organize', icon:'\ud83d\udd00', name:'Reorder pages', desc:'Rearrange pages into the exact order you type (e.g. 3,1,2).', accept:'.pdf', options:[{key:'order',label:'New order',type:'text',def:'',ph:'e.g. 3,1,2'}],
run: async (f,o)=>{
  const src = await PT.openPdf(f[0]);
  const idx = PT.parseRanges(o.order, src.getPageCount());
  if(!idx.length) throw new Error('Type the new page order, e.g. 3,1,2');
  const out = await D().PDFDocument.create();
  (await out.copyPages(src, idx)).forEach(p=>out.addPage(p));
  await PT.savePdf(out, PT.base(f[0])+'-reordered.pdf');
}});
R({id:'reverse', cat:'Organize', icon:'\u21a9\ufe0f', name:'Reverse page order', desc:'Flip the document so the last page comes first.', accept:'.pdf',
run: async f => {
  const src = await PT.openPdf(f[0]);
  const out = await D().PDFDocument.create();
  (await out.copyPages(src, src.getPageIndices().reverse())).forEach(p=>out.addPage(p));
  await PT.savePdf(out, PT.base(f[0])+'-reversed.pdf');
}});
R({id:'duplicate', cat:'Organize', icon:'\ud83d\udc6f', name:'Duplicate pages', desc:'Repeat every page N times (handy for print layouts).', accept:'.pdf', options:[{key:'times',label:'Copies of each page',type:'number',def:2}],
run: async (f,o)=>{
  const src = await PT.openPdf(f[0]);
  const out = await D().PDFDocument.create();
  const n = Math.max(1, Math.floor(o.times||2));
  for(const i of src.getPageIndices()){ const [pg] = await out.copyPages(src,[i]); for(let k=0;k<n;k++){ const [again] = await out.copyPages(src,[i]); out.addPage(k===0?pg:again); } }
  await PT.savePdf(out, PT.base(f[0])+'-duplicated.pdf');
}});
R({id:'interleave', cat:'Organize', icon:'\ud83e\udd1d', name:'Interleave two PDFs', desc:'Alternate pages from two PDFs (A1, B1, A2, B2\u2026) \u2014 great for merging scanned fronts & backs.', accept:'.pdf', multiple:true,
run: async f => {
  if(f.length!==2) throw new Error('Pick exactly two PDFs.');
  const a = await PT.openPdf(f[0]), b = await PT.openPdf(f[1]);
  const out = await D().PDFDocument.create();
  const max = Math.max(a.getPageCount(), b.getPageCount());
  for(let i=0;i<max;i++){
    if(i<a.getPageCount()) (await out.copyPages(a,[i])).forEach(p=>out.addPage(p));
    if(i<b.getPageCount()) (await out.copyPages(b,[i])).forEach(p=>out.addPage(p));
  }
  await PT.savePdf(out, 'interleaved.pdf');
}});
R({id:'blank', cat:'Organize', icon:'\u2b1c', name:'Insert blank page', desc:'Add one or more blank pages after any page number (0 = at the start).', accept:'.pdf', options:[{key:'after',label:'Insert after page #',type:'number',def:1},{key:'count',label:'How many',type:'number',def:1}],
run: async (f,o)=>{
  const doc = await PT.openPdf(f[0]);
  const at = Math.min(Math.max(0, Math.floor(o.after||0)), doc.getPageCount());
  const ref = doc.getPage(Math.max(0, Math.min(at, doc.getPageCount()-1))).getSize();
  for(let k=0;k<Math.max(1,Math.floor(o.count||1));k++) doc.insertPage(at, [ref.width, ref.height]);
  await PT.savePdf(doc, PT.base(f[0])+'-blank.pdf');
}});

/* ================= EDIT ================= */
R({id:'rotate', cat:'Edit', icon:'\ud83d\udd04', name:'Rotate pages', desc:'Rotate all pages, or just a range, by 90/180/270 degrees.', accept:'.pdf', options:[{key:'angle',label:'Angle',type:'select',choices:['90','180','270'],def:'90'},{key:'pages',label:'Pages (blank = all)',type:'text',def:'',ph:'e.g. 1-3'}],
run: async (f,o)=>{
  const doc = await PT.openPdf(f[0]);
  let idx = o.pages ? PT.parseRanges(o.pages, doc.getPageCount()) : doc.getPageIndices();
  if(!idx.length) idx = doc.getPageIndices();
  idx.forEach(i=>{ const p = doc.getPage(i); p.setRotation(D().degrees((p.getRotation().angle + parseInt(o.angle,10)) % 360)); });
  await PT.savePdf(doc, PT.base(f[0])+'-rotated.pdf');
}});
R({id:'watermark', cat:'Edit', icon:'\ud83d\udca7', name:'Add watermark', desc:'Stamp diagonal text (e.g. CONFIDENTIAL) across every page.', accept:'.pdf', options:[{key:'text',label:'Watermark text',type:'text',def:'CONFIDENTIAL'},{key:'size',label:'Font size',type:'number',def:50},{key:'opacity',label:'Opacity %',type:'number',def:25}],
run: async (f,o)=>{
  const doc = await PT.openPdf(f[0]);
  const font = await doc.embedFont(D().StandardFonts.HelveticaBold);
  const size = o.size||50, tw = font.widthOfTextAtSize(o.text||'CONFIDENTIAL', size);
  doc.getPages().forEach(p=>{
    const s = p.getSize();
    p.drawText(o.text||'CONFIDENTIAL', {x:s.width/2 - tw*0.354, y:s.height/2 - tw*0.354, size, font, opacity:Math.min(1,(o.opacity||25)/100), rotate:D().degrees(45), color:D().rgb(0.5,0.5,0.5)});
  });
  await PT.savePdf(doc, PT.base(f[0])+'-watermarked.pdf');
}});
R({id:'pagenum', cat:'Edit', icon:'\ud83d\udd22', name:'Add page numbers', desc:'Stamp \u201cn / total\u201d on every page, positioned where you want.', accept:'.pdf', options:[{key:'pos',label:'Position',type:'select',choices:['bottom-center','bottom-right','bottom-left'],def:'bottom-center'},{key:'start',label:'Start at',type:'number',def:1}],
run: async (f,o)=>{
  const doc = await PT.openPdf(f[0]);
  const font = await doc.embedFont(D().StandardFonts.Helvetica);
  const pages = doc.getPages(), start = Math.floor(o.start||1);
  pages.forEach((p,i)=>{
    const w = p.getSize().width, label = (start+i)+' / '+(start+pages.length-1);
    const tw = font.widthOfTextAtSize(label, 11);
    const x = o.pos==='bottom-left' ? 36 : o.pos==='bottom-right' ? w-36-tw : (w-tw)/2;
    p.drawText(label, {x, y:22, size:11, font, color:D().rgb(0.25,0.25,0.25)});
  });
  await PT.savePdf(doc, PT.base(f[0])+'-numbered.pdf');
}});
R({id:'headfoot', cat:'Edit', icon:'\ud83d\udcdd', name:'Header / footer text', desc:'Add a text line to the top or bottom of every page.', accept:'.pdf', options:[{key:'text',label:'Text',type:'text',def:'',ph:'e.g. Acme Corp \u2014 Internal'},{key:'where',label:'Position',type:'select',choices:['top','bottom'],def:'top'},{key:'align',label:'Align',type:'select',choices:['left','center','right'],def:'center'}],
run: async (f,o)=>{
  if(!o.text) throw new Error('Type the header/footer text.');
  const doc = await PT.openPdf(f[0]);
  const font = await doc.embedFont(D().StandardFonts.Helvetica);
  doc.getPages().forEach(p=>{
    const s = p.getSize(), tw = font.widthOfTextAtSize(o.text, 10);
    const x = o.align==='left' ? 36 : o.align==='right' ? s.width-36-tw : (s.width-tw)/2;
    p.drawText(o.text, {x, y: o.where==='top' ? s.height-28 : 16, size:10, font, color:D().rgb(0.3,0.3,0.3)});
  });
  await PT.savePdf(doc, PT.base(f[0])+'-'+(o.where==='top'?'header':'footer')+'.pdf');
}});
R({id:'crop', cat:'Edit', icon:'\ud83d\udcd0', name:'Crop margins', desc:'Trim points off each side of every page (72 pt = 1 inch).', accept:'.pdf', options:[{key:'top',label:'Top (pt)',type:'number',def:0},{key:'bottom',label:'Bottom (pt)',type:'number',def:0},{key:'left',label:'Left (pt)',type:'number',def:0},{key:'right',label:'Right (pt)',type:'number',def:0}],
run: async (f,o)=>{
  const doc = await PT.openPdf(f[0]);
  const t=+o.top||0, b=+o.bottom||0, l=+o.left||0, r=+o.right||0;
  doc.getPages().forEach(p=>{ const s = p.getSize(); p.setCropBox(l, b, Math.max(10, s.width-l-r), Math.max(10, s.height-t-b)); });
  await PT.savePdf(doc, PT.base(f[0])+'-cropped.pdf');
}});
R({id:'resize', cat:'Edit', icon:'\ud83d\udccf', name:'Resize to standard paper', desc:'Fit every page onto A3/A4/A5/Letter/Legal, centered and scaled.', accept:'.pdf', options:[{key:'size',label:'Paper size',type:'select',choices:['A4','A3','A5','Letter','Legal'],def:'A4'}],
run: async (f,o)=>{
  const bytes = await f[0].arrayBuffer();
  const src = await D().PDFDocument.load(bytes, {ignoreEncryption:true});
  const out = await D().PDFDocument.create();
  const emb = await out.embedPdf(bytes, src.getPageIndices());
  const WH = SIZES[o.size]||SIZES.A4;
  emb.forEach(ep=>{
    const s = Math.min(WH[0]/ep.width, WH[1]/ep.height);
    const p = out.addPage([WH[0], WH[1]]);
    p.drawPage(ep, {x:(WH[0]-ep.width*s)/2, y:(WH[1]-ep.height*s)/2, xScale:s, yScale:s});
  });
  await PT.savePdf(out, PT.base(f[0])+'-'+o.size+'.pdf');
}});
R({id:'scale', cat:'Edit', icon:'\ud83d\udd0d', name:'Scale pages', desc:'Grow or shrink every page and its content by a percentage.', accept:'.pdf', options:[{key:'pct',label:'Scale %',type:'number',def:90}],
run: async (f,o)=>{
  const doc = await PT.openPdf(f[0]);
  const s = Math.max(1, +o.pct||100)/100;
  doc.getPages().forEach(p=>p.scale(s, s));
  await PT.savePdf(doc, PT.base(f[0])+'-scaled.pdf');
}});
R({id:'nup', cat:'Edit', icon:'\ud83d\uddc2\ufe0f', name:'N-up (2 or 4 per sheet)', desc:'Place 2 or 4 pages on each sheet to save paper.', accept:'.pdf', options:[{key:'per',label:'Pages per sheet',type:'select',choices:['2','4'],def:'2'}],
run: async (f,o)=>{
  const n = parseInt(o.per,10);
  const bytes = await f[0].arrayBuffer();
  const src = await D().PDFDocument.load(bytes, {ignoreEncryption:true});
  const out = await D().PDFDocument.create();
  const emb = await out.embedPdf(bytes, src.getPageIndices());
  const W = n===2 ? 841.89 : 595.28, H = n===2 ? 595.28 : 841.89;
  const cells = n===2 ? [[0,0,W/2,H],[W/2,0,W/2,H]] : [[0,H/2,W/2,H/2],[W/2,H/2,W/2,H/2],[0,0,W/2,H/2],[W/2,0,W/2,H/2]];
  for(let i=0;i<emb.length;i+=n){
    const p = out.addPage([W,H]);
    for(let j=0;j<n && i+j<emb.length;j++){
      const ep = emb[i+j], c = cells[j];
      const s = Math.min(c[2]/ep.width, c[3]/ep.height)*0.95;
      p.drawPage(ep, {x:c[0]+(c[2]-ep.width*s)/2, y:c[1]+(c[3]-ep.height*s)/2, xScale:s, yScale:s});
    }
  }
  await PT.savePdf(out, PT.base(f[0])+'-'+n+'up.pdf');
}});
R({id:'stamp', cat:'Edit', icon:'\ud83c\udff7\ufe0f', name:'Corner stamp', desc:'Stamp short text (DRAFT, APPROVED\u2026) in a corner of every page.', accept:'.pdf', options:[{key:'text',label:'Text',type:'text',def:'DRAFT'},{key:'pos',label:'Corner',type:'select',choices:['top-right','top-left','bottom-right','bottom-left'],def:'top-right'},{key:'color',label:'Color',type:'select',choices:['red','gray','black'],def:'red'}],
run: async (f,o)=>{
  const doc = await PT.openPdf(f[0]);
  const font = await doc.embedFont(D().StandardFonts.HelveticaBold);
  const col = o.color==='red' ? D().rgb(0.85,0.15,0.2) : o.color==='black' ? D().rgb(0,0,0) : D().rgb(0.45,0.45,0.45);
  const tw = font.widthOfTextAtSize(o.text||'DRAFT', 14);
  doc.getPages().forEach(p=>{
    const s = p.getSize();
    const x = o.pos.indexOf('left')>=0 ? 24 : s.width-24-tw;
    const y = o.pos.indexOf('top')>=0 ? s.height-34 : 20;
    p.drawText(o.text||'DRAFT', {x, y, size:14, font, color:col, opacity:0.9});
  });
  await PT.savePdf(doc, PT.base(f[0])+'-stamped.pdf');
}});

/* ================= INSPECT & METADATA ================= */
R({id:'meta-view', cat:'Inspect', icon:'\ud83d\udd0e', name:'View metadata', desc:'See title, author, dates, producer and page count.', accept:'.pdf',
run: async f => {
  const d = await PT.openPdf(f[0]);
  return ['Title: '+(d.getTitle()||'\u2014'), 'Author: '+(d.getAuthor()||'\u2014'), 'Subject: '+(d.getSubject()||'\u2014'), 'Keywords: '+(d.getKeywords()||'\u2014'), 'Creator: '+(d.getCreator()||'\u2014'), 'Producer: '+(d.getProducer()||'\u2014'), 'Created: '+(d.getCreationDate()||'\u2014'), 'Modified: '+(d.getModificationDate()||'\u2014'), 'Pages: '+d.getPageCount()].join('\n');
}});
R({id:'meta-edit', cat:'Inspect', icon:'\u270f\ufe0f', name:'Edit metadata', desc:'Set a new title, author, subject and keywords.', accept:'.pdf', options:[{key:'title',label:'Title',type:'text',def:''},{key:'author',label:'Author',type:'text',def:''},{key:'subject',label:'Subject',type:'text',def:''},{key:'keywords',label:'Keywords',type:'text',def:'',ph:'comma, separated'}],
run: async (f,o)=>{
  const d = await PT.openPdf(f[0]);
  d.setTitle(o.title||''); d.setAuthor(o.author||''); d.setSubject(o.subject||'');
  d.setKeywords((o.keywords||'').split(',').map(s=>s.trim()).filter(Boolean));
  await PT.savePdf(d, PT.base(f[0])+'-meta.pdf');
}});
R({id:'meta-strip', cat:'Inspect', icon:'\ud83e\uddfc', name:'Remove metadata', desc:'Wipe title, author, keywords and producer info for privacy.', accept:'.pdf',
run: async f => {
  const d = await PT.openPdf(f[0]);
  d.setTitle(''); d.setAuthor(''); d.setSubject(''); d.setKeywords([]); d.setCreator(''); d.setProducer('');
  await PT.savePdf(d, PT.base(f[0])+'-clean.pdf');
}});
R({id:'info', cat:'Inspect', icon:'\u2139\ufe0f', name:'Page size report', desc:'Page count plus the exact dimensions of every page (downloads a report).', accept:'.pdf',
run: async f => {
  const d = await PT.openPdf(f[0]);
  let txt = f[0].name+'\nPages: '+d.getPageCount()+'\n\n';
  d.getPages().forEach((p,i)=>{ const s = p.getSize(); txt += 'Page '+(i+1)+': '+Math.round(s.width)+' \u00d7 '+Math.round(s.height)+' pt  ('+(s.width/72*25.4).toFixed(0)+' \u00d7 '+(s.height/72*25.4).toFixed(0)+' mm)\n'; });
  PT.download(txt, PT.base(f[0])+'-info.txt', 'text/plain');
}});
R({id:'wordcount', cat:'Inspect', icon:'\ud83e\uddee', name:'Word & character count', desc:'Count words, characters and pages in a PDF.', accept:'.pdf',
run: async (f,o,s)=>{
  const pages = await PT.pdfText(f[0], s);
  const text = pages.join('\n');
  return 'Words: '+((text.match(/\S+/g)||[]).length).toLocaleString()+'\nCharacters: '+text.length.toLocaleString()+'\nPages: '+pages.length;
}});
R({id:'repair', cat:'Inspect', icon:'\ud83e\ude79', name:'Repair PDF', desc:'Rebuild a PDF\u2019s internal structure \u2014 fixes many files that refuse to open.', accept:'.pdf',
run: async f => {
  const d = await PT.openPdf(f[0]);
  await PT.savePdf(d, PT.base(f[0])+'-repaired.pdf');
}});
R({id:'unlock', cat:'Inspect', icon:'\ud83d\udd13', name:'Remove restrictions', desc:'Strip owner-password restrictions (printing/copying locks) from a PDF you own.', accept:'.pdf',
run: async f => {
  const d = await PT.openPdf(f[0]);
  await PT.savePdf(d, PT.base(f[0])+'-unlocked.pdf');
  return 'Done. Note: PDFs that need a password just to open cannot be unlocked without it.';
}});

/* ================= OPTIMIZE ================= */
R({id:'compress', cat:'Optimize', icon:'\ud83d\udDDC\ufe0f', name:'Compress PDF', desc:'Shrink file size by re-encoding pages (best for scans & image-heavy PDFs).', accept:'.pdf', options:[{key:'level',label:'Level',type:'select',choices:['Extreme','Recommended','Less compression'],def:'Recommended'}],
run: async (f,o,s)=>{
  const L = {'Extreme':[1.0,0.45],'Recommended':[1.5,0.65],'Less compression':[2.0,0.8]}[o.level]||[1.5,0.65];
  const doc = await PT.canvasesToPdf(await PT.renderPdf(f[0], L[0], s), L[1], L[0]);
  const bytes = await doc.save();
  PT.download(bytes, PT.base(f[0])+'-compressed.pdf', 'application/pdf');
  const saved = Math.round(100 - bytes.length/f[0].size*100);
  return saved>0 ? 'Compressed: '+PT.fmtSize(f[0].size)+' \u2192 '+PT.fmtSize(bytes.length)+' (\u2212'+saved+'%)' : 'This PDF was already smaller than the re-encoded version \u2014 kept download anyway. Note: text becomes non-selectable.';
}});
R({id:'flatten', cat:'Optimize', icon:'\ud83e\udDCA', name:'Flatten PDF', desc:'Convert every page to an image \u2014 freezes forms, annotations and layers.', accept:'.pdf',
run: async (f,o,s)=>{
  const doc = await PT.canvasesToPdf(await PT.renderPdf(f[0], 2, s), 0.85, 2);
  await PT.savePdf(doc, PT.base(f[0])+'-flat.pdf');
}});
R({id:'grayscale', cat:'Optimize', icon:'\ud83c\udf11', name:'Grayscale PDF', desc:'Convert every page to black & white \u2014 cheaper printing.', accept:'.pdf',
run: async (f,o,s)=>{
  const gray = (await PT.renderPdf(f[0], 1.8, s)).map(c=>{
    const g = document.createElement('canvas'); g.width = c.width; g.height = c.height;
    const x = g.getContext('2d'); x.filter = 'grayscale(100%)'; x.drawImage(c,0,0); return g;
  });
  const doc = await PT.canvasesToPdf(gray, 0.8, 1.8);
  await PT.savePdf(doc, PT.base(f[0])+'-grayscale.pdf');
}});

/* ================= CONVERT FROM PDF ================= */
R({id:'pdf2png', cat:'From PDF', icon:'\ud83d\uddbc\ufe0f', name:'PDF to PNG', desc:'Render every page as a crisp PNG image (ZIP if multi-page).', accept:'.pdf', options:[{key:'dpi',label:'Quality',type:'select',choices:['72 dpi','150 dpi','300 dpi'],def:'150 dpi'}],
run: async (f,o,s)=>{
  const scale = {'72 dpi':1,'150 dpi':2.08,'300 dpi':4.17}[o.dpi]||2.08;
  const cs = await PT.renderPdf(f[0], scale, s);
  if(cs.length===1) return void PT.download(await PT.canvasBlob(cs[0],'image/png'), PT.base(f[0])+'.png');
  const items = [];
  for(let i=0;i<cs.length;i++) items.push({name:'page-'+(i+1)+'.png', data: await PT.canvasBlob(cs[i],'image/png')});
  await PT.zip(items, PT.base(f[0])+'-png.zip');
}});
R({id:'pdf2jpg', cat:'From PDF', icon:'\ud83d\udcf7', name:'PDF to JPG', desc:'Render every page as a JPG image (ZIP if multi-page).', accept:'.pdf', options:[{key:'dpi',label:'Quality',type:'select',choices:['72 dpi','150 dpi','300 dpi'],def:'150 dpi'}],
run: async (f,o,s)=>{
  const scale = {'72 dpi':1,'150 dpi':2.08,'300 dpi':4.17}[o.dpi]||2.08;
  const cs = await PT.renderPdf(f[0], scale, s);
  if(cs.length===1) return void PT.download(await PT.canvasBlob(cs[0],'image/jpeg',0.9), PT.base(f[0])+'.jpg');
  const items = [];
  for(let i=0;i<cs.length;i++) items.push({name:'page-'+(i+1)+'.jpg', data: await PT.canvasBlob(cs[i],'image/jpeg',0.9)});
  await PT.zip(items, PT.base(f[0])+'-jpg.zip');
}});
R({id:'pdf2txt', cat:'From PDF', icon:'\ud83d\udcc3', name:'PDF to Text', desc:'Extract all selectable text into a .txt file.', accept:'.pdf',
run: async (f,o,s)=>{
  const pages = await PT.pdfText(f[0], s);
  PT.download(pages.join('\n\n----- Page break -----\n\n'), PT.base(f[0])+'.txt', 'text/plain');
}});
R({id:'pdf2word', cat:'From PDF', icon:'\ud83d\udcd8', name:'PDF to Word', desc:'Extract text into a .doc file that opens in Word or Google Docs (text only).', accept:'.pdf',
run: async (f,o,s)=>{
  const pages = await PT.pdfText(f[0], s);
  const html = pages.map(pg=>'<p>'+PT.esc(pg).replace(/\n/g,'<br>')+'</p>').join('<br clear="all" style="page-break-before:always">');
  PT.download('<html xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"></head><body>'+html+'</body></html>', PT.base(f[0])+'.doc', 'application/msword');
  return 'Saved as .doc \u2014 text only; layout and images are not preserved.';
}});
R({id:'pdf2html', cat:'From PDF', icon:'\ud83c\udf10', name:'PDF to HTML', desc:'Extract text into a clean, styled HTML page.', accept:'.pdf',
run: async (f,o,s)=>{
  const pages = await PT.pdfText(f[0], s);
  const body = pages.map(pg=>'<section><p>'+PT.esc(pg).replace(/\n/g,'<br>')+'</p></section>').join('<hr>');
  PT.download('<!DOCTYPE html><html><head><meta charset="utf-8"><title>'+PT.esc(PT.base(f[0]))+'</title><style>body{font-family:Georgia,serif;max-width:760px;margin:40px auto;line-height:1.7;padding:0 20px}</style></head><body>'+body+'</body></html>', PT.base(f[0])+'.html', 'text/html');
}});
R({id:'pdf2md', cat:'From PDF', icon:'\u2b07\ufe0f', name:'PDF to Markdown', desc:'Extract text into a .md file with page separators.', accept:'.pdf',
run: async (f,o,s)=>{
  const pages = await PT.pdfText(f[0], s);
  PT.download('# '+PT.base(f[0])+'\n\n'+pages.join('\n\n---\n\n'), PT.base(f[0])+'.md', 'text/markdown');
}});
})();
