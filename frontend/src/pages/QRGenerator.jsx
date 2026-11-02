import React, { useRef, useState } from 'react';
import { Download, Printer, Link as LinkIcon, Share2, Check, Info } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

// Export resolution in pixels (the QR is always square).
const SIZES = { Small: 512, Medium: 1024, Large: 2048 };
const FORMATS = ['PNG', 'JPG', 'SVG'];
const COLORS = [
  { name: 'Slate', value: '#0f172a' },
  { name: 'Indigo', value: '#667eea' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#16a34a' },
];

const slugFileName = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'menu';

const QRGenerator = () => {
  const [color, setColor] = useState(COLORS[0].value);
  const [size, setSize] = useState('Medium');
  const [format, setFormat] = useState('PNG');
  const [notice, setNotice] = useState('');
  const qrBox = useRef(null);

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('user')) || {};
  } catch {
    user = {};
  }
  const restaurantName = user.restaurant_name || 'Your restaurant';

  // The public link customers land on. The slug is friendlier than an internal id; both work.
  const menuUrl = `${window.location.origin}/menu/${user.slug || user.id || ''}`;
  const fileBase = `${slugFileName(restaurantName)}-menu-qr`;

  const flash = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(''), 2500);
  };

  const getSvgMarkup = () => {
    const svg = qrBox.current?.querySelector('svg');
    if (!svg) return null;
    const clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const px = SIZES[size];
    clone.setAttribute('width', px);
    clone.setAttribute('height', px);
    return new XMLSerializer().serializeToString(clone);
  };

  const saveBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownload = () => {
    const markup = getSvgMarkup();
    if (!markup) return;

    if (format === 'SVG') {
      saveBlob(new Blob([markup], { type: 'image/svg+xml' }), `${fileBase}.svg`);
      return;
    }

    // Raster formats: draw the SVG onto a canvas with a white background so scanners get full contrast.
    const px = SIZES[size];
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = px;
      canvas.height = px;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, px, px);
      ctx.drawImage(image, 0, 0, px, px);
      const mime = format === 'JPG' ? 'image/jpeg' : 'image/png';
      canvas.toBlob((blob) => blob && saveBlob(blob, `${fileBase}.${format.toLowerCase()}`), mime, 0.95);
    };
    image.onerror = () => flash('Could not create the image. Try the SVG format.');
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  };

  // Opens a clean printable page (QR + name + instruction). "Save as PDF" in the print dialog gives a PDF.
  const handlePrint = () => {
    const markup = getSvgMarkup();
    if (!markup) return;
    const win = window.open('', '_blank', 'width=800,height=1000');
    if (!win) {
      flash('Your browser blocked the print window. Allow pop-ups and try again.');
      return;
    }
    const safeName = restaurantName.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    win.document.write(`<!doctype html><html><head><title>${safeName} menu QR</title>
      <style>
        body { font-family: system-ui, sans-serif; text-align: center; margin: 0; padding: 48px; color: #0f172a; }
        h1 { font-size: 40px; margin: 0 0 8px; }
        p { font-size: 22px; color: #475569; margin: 0 0 32px; }
        svg { width: 480px; height: 480px; }
      </style></head><body>
      <h1>${safeName}</h1><p>Scan to view our menu and order</p>${markup}
      <script>window.onload = function () { window.print(); };</script></body></html>`);
    win.document.close();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(menuUrl);
      flash('Link copied');
    } catch {
      flash('Could not copy automatically. Select the link and copy it.');
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${restaurantName} menu`, url: menuUrl });
      } catch {
        // The person closed the share sheet: nothing to do.
      }
    } else {
      copyLink();
    }
  };

  const previewSize = 220;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">QR Code</h1>
        <p className="text-slate-500">Print this code and place it on your tables. Customers scan it to see your menu and order.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/95 rounded-[2rem] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Menu link</h3>
            <div className="relative">
              <input type="text" readOnly value={menuUrl} aria-label="Public menu link" onFocus={(e) => e.target.select()} className="w-full pl-4 pr-10 py-2.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl outline-none text-sm" />
              <button type="button" onClick={copyLink} aria-label="Copy menu link" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary">
                <LinkIcon size={16} />
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-500">This link is unique to your restaurant and only ever shows your menu.</p>
          </div>

          <div className="bg-white/95 rounded-[2rem] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Colour</h3>
            <div className="flex gap-3" role="radiogroup" aria-label="QR colour">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={color === c.value}
                  aria-label={c.name}
                  onClick={() => setColor(c.value)}
                  style={{ backgroundColor: c.value }}
                  className={`size-9 rounded-full border-2 border-white shadow-sm transition ${color === c.value ? 'ring-2 ring-offset-2 ring-slate-700' : 'hover:scale-110'}`}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">Dark colours scan best. Avoid light colours.</p>
          </div>

          <div className="bg-white/95 rounded-[2rem] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Download size</h3>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(SIZES).map((sz) => (
                <button key={sz} type="button" aria-pressed={size === sz} onClick={() => setSize(sz)} className={`py-2 text-sm rounded-lg border font-medium ${size === sz ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                  {sz}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">{SIZES[size]} × {SIZES[size]} pixels</p>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center bg-slate-100 rounded-[2rem] p-8 border border-slate-200 min-h-[500px]">
          <div className="bg-white p-10 rounded-[2rem] shadow-2xl flex flex-col items-center">
            <div ref={qrBox} className="p-4 bg-white rounded-2xl border border-slate-100 mb-6">
              <QRCodeSVG value={menuUrl} size={previewSize} fgColor={color} bgColor="#ffffff" level="M" marginSize={1} />
            </div>
            <h4 className="text-2xl font-black text-slate-800 tracking-tight text-center mb-1">{restaurantName}</h4>
            <p className="text-slate-500 font-medium text-center">Scan to view our menu and order</p>
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/95 rounded-[2rem] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Export</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="qr-format" className="block text-sm font-medium text-slate-600 mb-2">Format</label>
                <select id="qr-format" value={format} onChange={(e) => setFormat(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700">
                  {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div className="pt-2 space-y-3">
                <button type="button" onClick={handleDownload} className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                  <Download size={18} /> Download {format}
                </button>
                <button type="button" onClick={handlePrint} className="w-full flex justify-center items-center gap-2 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm">
                  <Printer size={18} /> Print
                </button>
                <button type="button" onClick={shareLink} className="w-full flex justify-center items-center gap-2 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all">
                  <Share2 size={18} /> Share menu link
                </button>
              </div>

              <p role="status" aria-live="polite" className="min-h-5 text-sm font-medium text-emerald-600 flex items-center gap-1">
                {notice && <><Check size={14} /> {notice}</>}
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 text-sm text-slate-600 space-y-2">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Info size={16} /> Tips</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Print at least 3 cm × 3 cm; bigger is easier to scan.</li>
              <li>To save a PDF, choose "Save as PDF" in the print window.</li>
              <li>Test the code with your phone before printing many copies.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;
