import React, { useRef, useState } from 'react';
import { Download, Printer, Copy, Share2, Check, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import PageHeader from '../components/ui/PageHeader';
import { useToast } from '../components/ui/toastContext';

// Export resolution in pixels (the QR is always square).
const SIZES = { Small: 512, Medium: 1024, Large: 2048 };
const FORMATS = ['PNG', 'JPG', 'SVG'];
const COLORS = [
  { name: 'Slate', value: '#0f172a' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Green', value: '#15803d' },
];

const slugFileName = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'menu';

const QRGenerator = () => {
  const toast = useToast();
  const [color, setColor] = useState(COLORS[0].value);
  const [size, setSize] = useState('Medium');
  const [format, setFormat] = useState('PNG');
  const [copied, setCopied] = useState(false);
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
    image.onerror = () => toast.error('Could not create the image. Try the SVG format.');
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  };

  // Opens a clean printable page (QR + name + instruction). "Save as PDF" in the print dialog gives a PDF.
  const handlePrint = () => {
    const markup = getSvgMarkup();
    if (!markup) return;
    const win = window.open('', '_blank', 'width=800,height=1000');
    if (!win) {
      toast.error('Your browser blocked the print window. Allow pop-ups and try again.');
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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy automatically. Select the link and copy it.');
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

  return (
    <div>
      <PageHeader title="QR code" description="Print this code and place it on your tables. Guests scan it to see your menu and order." />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Preview */}
        <section className="card flex flex-col items-center justify-center bg-slate-100/50 px-6 py-10 lg:col-span-3" aria-label="QR code preview">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div ref={qrBox} className="mx-auto w-fit">
              <QRCodeSVG value={menuUrl} size={220} fgColor={color} bgColor="#ffffff" level="M" marginSize={1} />
            </div>
            <h2 className="mt-6 text-center text-xl font-semibold text-slate-900">{restaurantName}</h2>
            <p className="mt-1 text-center text-sm text-slate-500">Scan to view our menu and order</p>
          </div>
          <p className="mt-5 max-w-sm text-center text-xs text-slate-500">
            Tip: print at least 3 cm × 3 cm and test with your phone before printing many copies.
          </p>
        </section>

        {/* Controls */}
        <div className="space-y-6 lg:col-span-2">
          <section className="card card-pad" aria-labelledby="link-h">
            <h2 id="link-h" className="card-title">Menu link</h2>
            <p className="mt-1 text-sm text-slate-500">Unique to your restaurant. It only ever shows your menu.</p>
            <input readOnly value={menuUrl} aria-label="Public menu link" onFocus={(e) => e.target.select()} className="input mt-3 bg-slate-50 text-slate-600" />
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={copyLink} className="btn btn-secondary btn-sm">
                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy link</>}
              </button>
              <button type="button" onClick={shareLink} className="btn btn-secondary btn-sm"><Share2 size={14} /> Share</button>
              <a href={menuUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm"><ExternalLink size={14} /> Open</a>
            </div>
          </section>

          <section className="card card-pad" aria-labelledby="style-h">
            <h2 id="style-h" className="card-title">Style</h2>
            <p className="label mt-4">Colour</p>
            <div className="flex gap-3" role="radiogroup" aria-label="QR colour">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  role="radio"
                  aria-checked={color === c.value}
                  aria-label={c.name}
                  title={c.name}
                  onClick={() => setColor(c.value)}
                  style={{ backgroundColor: c.value }}
                  className={`size-8 rounded-full border-2 border-white transition ${color === c.value ? 'ring-2 ring-offset-2 ring-slate-700' : 'ring-1 ring-slate-200 hover:scale-110'}`}
                />
              ))}
            </div>
            <p className="hint">Dark colours scan best.</p>

            <p className="label mt-5">Download size</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.keys(SIZES).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  aria-pressed={size === sz}
                  onClick={() => setSize(sz)}
                  className={`btn btn-sm ${size === sz ? 'btn-primary' : 'btn-secondary'}`}
                >
                  {sz}
                </button>
              ))}
            </div>
            <p className="hint">{SIZES[size]} × {SIZES[size]} pixels</p>
          </section>

          <section className="card card-pad" aria-labelledby="export-h">
            <h2 id="export-h" className="card-title">Get your code</h2>
            <label htmlFor="qr-format" className="label mt-4">File format</label>
            <select id="qr-format" value={format} onChange={(e) => setFormat(e.target.value)} className="input">
              {FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={handleDownload} className="btn btn-primary"><Download size={16} /> Download</button>
              <button type="button" onClick={handlePrint} className="btn btn-secondary"><Printer size={16} /> Print</button>
            </div>
            <p className="hint">To save a PDF, choose “Save as PDF” in the print window.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default QRGenerator;
