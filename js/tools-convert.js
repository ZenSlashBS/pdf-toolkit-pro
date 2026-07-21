/* PDF Toolkit Pro — converters, office & data, OCR, image utilities */
(function(){
const R = t => PT.register(t);
const LANGS = {English:'eng', Hindi:'hin', Spanish:'spa', French:'fra', German:'deu'};

async function imagesToPdf(files, name){
  const doc = await PDFLib.PDFDocument.create();
  for(const f of files){
    let img;
    if(f.type==='image/jpeg') img = await doc.embedJpg(await f.arrayBuffer());
    else if(f.type==='image/png') img = await doc.embedPng(await f.arrayBuffer());
    else { const c = await PT.imgToCanvas(f); img = await doc.embedJpg(c.toDataURL('image/jpeg', 0.92)); }
    const p = doc.addPage([img.width, img.height]);
    p.drawImage(img, {x:0, y:0, width:img.width, height:img.height});
  }
  await PT.savePdf(doc, name);
}
async function textToPdf(text, name, mono){
  const JS = await PT.libs.jspdf();
  const doc = new JS({unit:'pt', format:'a4'});
  doc.setFont(mono ? 'courier' : 'helvetica'); doc.setFontSize(11);
  const lines = doc.splitTextToSize(String(text).replace(/\t/g,'    '), 495);
  let y = 60;
  lines.forEach(l=>{ if(y>782){ doc.addPage(); y = 60; } doc.text(l, 50, y); y += 14; });
  doc.save(name);
}

/* ================= CONVERT TO PDF ================= */
R({id:'img2pdf', cat:'To PDF', icon:'\ud83d\uddbc\ufe0f', name:'Images to PDF', desc:'Combine JPG, PNG or WebP images into one PDF \u2014 one image per page.', accept:'image/*', multiple:true,
run: f => imagesToPdf(f, 'images.pdf')});
R({id:'jpg2pdf', cat:'To PDF', icon:'\ud83d\udcf7', name:'JPG to PDF', desc:'Turn JPG photos into a PDF document.', accept:'.jpg,.jpeg', multiple:true,
run: f => imagesToPdf(f, PT.base(f[0])+'.pdf')});
R({id:'png2pdf', cat:'To PDF', icon:'\ud83c\udfa8', name:'PNG to PDF', desc:'Turn PNG images (transparency kept) into a PDF.', accept:'.png', multiple:true,
run: f => imagesToPdf(f, PT.base(f[0])+'.pdf')});
R({id:'webp2pdf', cat:'To PDF', icon:'\ud83c\udf04', name:'WebP to PDF', desc:'Convert modern WebP images into a PDF.', accept:'.webp', multiple:true,
run: f => imagesToPdf(f, PT.base(f[0])+'.pdf')});
R({id:'txt2pdf', cat:'To PDF', icon:'\ud83d\udcc4', name:'Text to PDF', desc:'Turn any .txt file into a clean, paginated PDF.', accept:'.txt,text/plain',
run: async f => textToPdf(await f[0].text(), PT.base(f[0])+'.pdf', false)});
R({id:'md2pdf', cat:'To PDF', icon:'\u2b07\ufe0f', name:'Markdown to PDF', desc:'Convert a .md file to PDF with styled headings and bullets.', accept:'.md,.markdown,.txt',
run: async f => {
  const JS = await PT.libs.jspdf();
  const doc = new JS({unit:'pt', format:'a4'});
  let y = 60;
  const put = (txt, size, bold)=>{
    doc.setFont('helvetica', bold?'bold':'normal'); doc.setFontSize(size);
    doc.splitTextToSize(txt, 495).forEach(l=>{ if(y>780){ doc.addPage(); y=60; } doc.text(l, 50, y); y += size*1.35; });
    y += 4;
  };
  (await f[0].text()).split(/\r?\n/).forEach(line=>{
    if(/^###\s/.test(line)) put(line.replace(/^###\s+/,''), 13, true);
    else if(/^##\s/.test(line)) put(line.replace(/^##\s+/,''), 16, true);
    else if(/^#\s/.test(line)) put(line.replace(/^#\s+/,''), 20, true);
    else if(/^[-*]\s/.test(line)) put('\u2022 '+line.replace(/^[-*]\s+/,''), 11, false);
    else if(line.trim()==='') y += 8;
    else put(line.replace(/\*\*([^*]+)\*\*/g,'$1').replace(/`/g,''), 11, false);
  });
  doc.save(PT.base(f[0])+'.pdf');
}});
R({id:'csv2pdf', cat:'To PDF', icon:'\ud83d\udcca', name:'CSV to PDF table', desc:'Lay out a CSV file as a simple PDF table.', accept:'.csv',
run: async f => {
  const rows = (await f[0].text()).split(/\r?\n/).filter(r=>r.trim()).map(r=>r.split(','));
  if(!rows.length) throw new Error('This CSV appears to be empty.');
  const JS = await PT.libs.jspdf();
  const doc = new JS({unit:'pt', format:'a4', orientation: rows[0].length>5 ? 'landscape' : 'portrait'});
  const W = doc.internal.pageSize.getWidth()-80, cw = W/rows[0].length;
  let y = 60; doc.setFontSize(9);
  rows.forEach((r,ri)=>{
    if(y > doc.internal.pageSize.getHeight()-50){ doc.addPage(); y = 60; }
    doc.setFont('helvetica', ri===0 ? 'bold' : 'normal');
    r.forEach((cell,ci)=>doc.text(String(cell).slice(0, Math.max(4, Math.floor(cw/4.8))), 40+ci*cw, y));
    y += 16;
  });
  doc.save(PT.base(f[0])+'.pdf');
}});
R({id:'docx2pdf', cat:'To PDF', icon:'\ud83d\udcd8', name:'Word to PDF', desc:'Convert a .docx to PDF via a print-ready preview (choose \u201cSave as PDF\u201d).', accept:'.docx',
run: async f => {
  const mammoth = await PT.libs.mammoth();
  const res = await mammoth.convertToHtml({arrayBuffer: await f[0].arrayBuffer()});
  PT.printHtml(res.value, PT.base(f[0]));
  return 'A print window opened \u2014 pick \u201cSave as PDF\u201d as the destination.';
}});
R({id:'html2pdf', cat:'To PDF', icon:'\ud83c\udf10', name:'HTML to PDF', desc:'Convert an .html file to PDF via a print-ready preview.', accept:'.html,.htm',
run: async f => {
  PT.printHtml(await f[0].text(), PT.base(f[0]));
  return 'A print window opened \u2014 pick \u201cSave as PDF\u201d as the destination.';
}});
R({id:'xlsx2pdf', cat:'To PDF', icon:'\ud83d\udcc8', name:'Excel to PDF', desc:'Convert spreadsheet sheets to PDF tables via a print-ready preview.', accept:'.xlsx,.xls',
run: async f => {
  const XLSX = await PT.libs.xlsx();
  const wb = XLSX.read(await f[0].arrayBuffer(), {type:'array'});
  const html = wb.SheetNames.map(n=>'<h3>'+PT.esc(n)+'</h3>'+XLSX.utils.sheet_to_html(wb.Sheets[n])).join('<hr>');
  PT.printHtml(html, PT.base(f[0]));
  return 'A print window opened \u2014 pick \u201cSave as PDF\u201d as the destination.';
}});

/* ================= OFFICE & DATA ================= */
R({id:'docx2html', cat:'Office & Data', icon:'\ud83c\udf10', name:'Word to HTML', desc:'Convert a .docx to a clean HTML file.', accept:'.docx',
run: async f => {
  const mammoth = await PT.libs.mammoth();
  const res = await mammoth.convertToHtml({arrayBuffer: await f[0].arrayBuffer()});
  PT.download('<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>'+res.value+'</body></html>', PT.base(f[0])+'.html', 'text/html');
}});
R({id:'docx2txt', cat:'Office & Data', icon:'\ud83d\udcc3', name:'Word to Text', desc:'Extract plain text from a .docx file.', accept:'.docx',
run: async f => {
  const mammoth = await PT.libs.mammoth();
  const res = await mammoth.extractRawText({arrayBuffer: await f[0].arrayBuffer()});
  PT.download(res.value, PT.base(f[0])+'.txt', 'text/plain');
}});
R({id:'xlsx2csv', cat:'Office & Data', icon:'\ud83d\udcd1', name:'Excel to CSV', desc:'Convert spreadsheet sheets to CSV (ZIP when there are several sheets).', accept:'.xlsx,.xls',
run: async f => {
  const XLSX = await PT.libs.xlsx();
  const wb = XLSX.read(await f[0].arrayBuffer(), {type:'array'});
  if(wb.SheetNames.length===1) return void PT.download(XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]]), PT.base(f[0])+'.csv', 'text/csv');
  await PT.zip(wb.SheetNames.map(n=>({name:n+'.csv', data:XLSX.utils.sheet_to_csv(wb.Sheets[n])})), PT.base(f[0])+'-csv.zip');
}});
R({id:'csv2xlsx', cat:'Office & Data', icon:'\ud83d\udcd7', name:'CSV to Excel', desc:'Turn a CSV file into a real .xlsx spreadsheet.', accept:'.csv',
run: async f => {
  const XLSX = await PT.libs.xlsx();
  const wb = XLSX.read(await f[0].text(), {type:'string'});
  XLSX.writeFile(wb, PT.base(f[0])+'.xlsx');
}});
R({id:'xlsx2json', cat:'Office & Data', icon:'\ud83e\uddfe', name:'Excel to JSON', desc:'Export spreadsheet rows as structured JSON.', accept:'.xlsx,.xls',
run: async f => {
  const XLSX = await PT.libs.xlsx();
  const wb = XLSX.read(await f[0].arrayBuffer(), {type:'array'});
  const out = {};
  wb.SheetNames.forEach(n=>out[n] = XLSX.utils.sheet_to_json(wb.Sheets[n]));
  PT.download(JSON.stringify(wb.SheetNames.length===1 ? out[wb.SheetNames[0]] : out, null, 2), PT.base(f[0])+'.json', 'application/json');
}});
R({id:'csv2json', cat:'Office & Data', icon:'\ud83d\udd22', name:'CSV to JSON', desc:'Convert CSV rows into a JSON array of objects.', accept:'.csv',
run: async f => {
  const XLSX = await PT.libs.xlsx();
  const wb = XLSX.read(await f[0].text(), {type:'string'});
  PT.download(JSON.stringify(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]), null, 2), PT.base(f[0])+'.json', 'application/json');
}});
R({id:'json2csv', cat:'Office & Data', icon:'\ud83d\udcd1', name:'JSON to CSV', desc:'Flatten a JSON array of objects into a CSV file.', accept:'.json',
run: async f => {
  const XLSX = await PT.libs.xlsx();
  let data = JSON.parse(await f[0].text());
  if(!Array.isArray(data)) data = [data];
  PT.download(XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(data)), PT.base(f[0])+'.csv', 'text/csv');
}});

/* ================= OCR ================= */
R({id:'ocr-img', cat:'OCR', icon:'\ud83d\udc41\ufe0f', name:'Image OCR (image to text)', desc:'Read the text inside a photo or scan \u2014 works offline in your browser.', accept:'image/*', options:[{key:'lang',label:'Language',type:'select',choices:['English','Hindi','Spanish','French','German'],def:'English'}],
run: async (f,o,s)=>{
  const Tess = await PT.libs.tesseract();
  s('Loading OCR engine \u2014 the first run downloads it, please wait\u2026');
  const res = await Tess.recognize(f[0], LANGS[o.lang]||'eng', {logger:m=>{ if(m.status==='recognizing text') s('Recognizing\u2026 '+Math.round(m.progress*100)+'%'); }});
  PT.download(res.data.text, PT.base(f[0])+'-ocr.txt', 'text/plain');
}});
R({id:'ocr-pdf', cat:'OCR', icon:'\ud83d\udcdc', name:'PDF OCR (scanned PDF to text)', desc:'Extract text from scanned PDFs where normal text extraction finds nothing.', accept:'.pdf', options:[{key:'lang',label:'Language',type:'select',choices:['English','Hindi','Spanish','French','German'],def:'English'}],
run: async (f,o,s)=>{
  const Tess = await PT.libs.tesseract();
  const cs = await PT.renderPdf(f[0], 2, s);
  const parts = [];
  for(let i=0;i<cs.length;i++){
    s('OCR on page '+(i+1)+' of '+cs.length+'\u2026');
    const res = await Tess.recognize(cs[i], LANGS[o.lang]||'eng');
    parts.push(res.data.text);
  }
  PT.download(parts.join('\n\n----- Page break -----\n\n'), PT.base(f[0])+'-ocr.txt', 'text/plain');
}});

/* ================= IMAGES & UTILITIES ================= */
R({id:'img-compress', cat:'Images', icon:'\ud83d\udDDC\ufe0f', name:'Compress image', desc:'Shrink a photo\u2019s file size with adjustable quality.', accept:'image/*', options:[{key:'q',label:'Quality % (lower = smaller)',type:'number',def:70}],
run: async (f,o)=>{
  const c = await PT.imgToCanvas(f[0]);
  const blob = await PT.canvasBlob(c, 'image/jpeg', Math.min(1, Math.max(0.05, (o.q||70)/100)));
  PT.download(blob, PT.base(f[0])+'-compressed.jpg');
  return 'Compressed: '+PT.fmtSize(f[0].size)+' \u2192 '+PT.fmtSize(blob.size);
}});
R({id:'img-resize', cat:'Images', icon:'\ud83d\udccf', name:'Resize image', desc:'Scale an image to a new width \u2014 height adjusts automatically.', accept:'image/*', options:[{key:'w',label:'New width (px)',type:'number',def:1080}],
run: async (f,o)=>{
  const c = await PT.imgToCanvas(f[0]);
  const w = Math.max(16, Math.floor(o.w||1080)), h = Math.round(c.height*w/c.width);
  const r = document.createElement('canvas'); r.width = w; r.height = h;
  r.getContext('2d').drawImage(c, 0, 0, w, h);
  PT.download(await PT.canvasBlob(r, 'image/png'), PT.base(f[0])+'-'+w+'px.png');
}});
R({id:'img-convert', cat:'Images', icon:'\ud83d\udd04', name:'Convert image format', desc:'Switch between PNG, JPG and WebP.', accept:'image/*', options:[{key:'to',label:'Convert to',type:'select',choices:['PNG','JPG','WEBP'],def:'PNG'}],
run: async (f,o)=>{
  const c = await PT.imgToCanvas(f[0]);
  const map = {PNG:['image/png','png'], JPG:['image/jpeg','jpg'], WEBP:['image/webp','webp']};
  const m = map[o.to]||map.PNG;
  PT.download(await PT.canvasBlob(c, m[0], 0.92), PT.base(f[0])+'.'+m[1]);
}});
R({id:'img-rotate', cat:'Images', icon:'\ud83e\udd38', name:'Rotate image', desc:'Rotate a picture by 90, 180 or 270 degrees.', accept:'image/*', options:[{key:'angle',label:'Angle',type:'select',choices:['90','180','270'],def:'90'}],
run: async (f,o)=>{
  const c = await PT.imgToCanvas(f[0]);
  const a = parseInt(o.angle,10), swap = a!==180;
  const r = document.createElement('canvas');
  r.width = swap ? c.height : c.width; r.height = swap ? c.width : c.height;
  const x = r.getContext('2d');
  x.translate(r.width/2, r.height/2); x.rotate(a*Math.PI/180); x.drawImage(c, -c.width/2, -c.height/2);
  PT.download(await PT.canvasBlob(r, 'image/png'), PT.base(f[0])+'-rotated.png');
}});
R({id:'img-b64', cat:'Images', icon:'\ud83d\udd10', name:'File to Base64', desc:'Encode any file as a Base64 data URI (for embedding in code).', accept:'*/*',
run: async f => {
  const dataUrl = await new Promise((res, rej)=>{ const r = new FileReader(); r.onload = ()=>res(r.result); r.onerror = ()=>rej(new Error('Could not read file.')); r.readAsDataURL(f[0]); });
  PT.download(dataUrl, PT.base(f[0])+'-base64.txt', 'text/plain');
}});
})();
