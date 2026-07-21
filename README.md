# 📄 PDF Toolkit Pro

**Free, privacy-first PDF & document toolkit — 59 tools running 100% in your browser.**

No uploads. No servers. No file size limits. Your files never leave your device — all processing happens client-side, which is exactly what makes it perfect for GitHub Pages hosting.

🔗 **Live site:** https://zenslashbs.github.io/pdf-toolkit-pro/

---

## ✨ Tools (59 live)

### 🗂 Organize (10)
Merge PDFs · Extract pages · Split every N pages · Split into single pages · Remove pages · Reorder pages · Reverse order · Duplicate pages · Interleave two PDFs · Insert blank pages

### ✏️ Edit (9)
Rotate · Watermark · Page numbers · Header/footer · Crop margins · Resize to A3/A4/A5/Letter/Legal · Scale pages · N-up (2/4 per sheet) · Corner stamp

### 🔎 Inspect & Metadata (7)
View metadata · Edit metadata · Remove metadata · Page size report · Word & character count · Repair PDF · Remove restrictions

### 🗜 Optimize (3)
Compress (3 levels) · Flatten · Grayscale

### 📤 Convert from PDF (6)
PDF→PNG · PDF→JPG · PDF→Text · PDF→Word · PDF→HTML · PDF→Markdown

### 📥 Convert to PDF (10)
Images→PDF · JPG→PDF · PNG→PDF · WebP→PDF · Text→PDF · Markdown→PDF · CSV→PDF table · Word→PDF · HTML→PDF · Excel→PDF

### 📊 Office & Data (7)
Word→HTML · Word→Text · Excel→CSV · CSV→Excel · Excel→JSON · CSV→JSON · JSON→CSV

### 👁 OCR (2)
Image OCR · Scanned-PDF OCR (English, Hindi, Spanish, French, German)

### 🖼 Images & Utilities (5)
Compress image · Resize image · Convert format (PNG/JPG/WebP) · Rotate image · File→Base64

---

## 🚀 Enable GitHub Pages (one-time)

1. Open **Settings → Pages** in this repository.
2. Under *Build and deployment*, set **Source** to `Deploy from a branch`.
3. Pick branch **`main`**, folder **`/ (root)`**, and click **Save**.
4. Wait ~1 minute, then visit **https://zenslashbs.github.io/pdf-toolkit-pro/**

---

## 🛠 How it works

Pure static HTML/CSS/JS — no build step, no backend. Heavy lifting is done by battle-tested open-source libraries loaded from CDN (the big ones load lazily, only when a tool needs them):

| Library | Used for |
|---|---|
| [pdf-lib](https://github.com/Hopding/pdf-lib) | Create & edit PDFs (merge, split, rotate, watermark…) |
| [PDF.js](https://github.com/mozilla/pdf.js) | Render pages & extract text |
| [jsPDF](https://github.com/parallax/jsPDF) | Generate PDFs from text/CSV/Markdown |
| [Mammoth](https://github.com/mwilliamson/mammoth.js) | Read .docx files |
| [SheetJS](https://github.com/SheetJS/sheetjs) | Excel/CSV/JSON conversion |
| [Tesseract.js](https://github.com/naptha/tesseract.js) | OCR in the browser |
| [JSZip](https://github.com/Stuk/jszip) | ZIP downloads for multi-file results |

Inspired by great projects like [BentoPDF](https://github.com/alam00000/bentopdf) and [Stirling-PDF](https://github.com/Stirling-Tools/Stirling-PDF).

## 🗺 Roadmap to 100+

- [ ] Password-protect PDF (encryption)
- [ ] Visual page organizer with thumbnails & drag-drop
- [ ] Sign PDF (draw / type / upload signature)
- [ ] Fill PDF forms & create form fields
- [ ] Annotate (highlight, shapes, freehand)
- [ ] Compare two PDFs
- [ ] Bates numbering, page labels
- [ ] EPUB, RTF, PPTX conversions
- [ ] Redact text · QR/barcode tools · more OCR languages

PRs welcome!

## 📝 License

MIT — free for personal and commercial use.
