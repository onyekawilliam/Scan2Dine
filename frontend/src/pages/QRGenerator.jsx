import React, { useState } from 'react';
import { Download, Printer, QrCode, Link as LinkIcon, Image as ImageIcon, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import Logo from '../components/Logo';

const QRGenerator = () => {
  const [style, setStyle] = useState('standard');
  const [size, setSize] = useState('Medium');
  const [format, setFormat] = useState('PNG');
  const [qrColor, setQrColor] = useState('#667eea'); // primary color default
  
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const restaurantName = user.restaurant_name || "Scan2Dine Demo";
  
  // Create a URL pointing directly to this environment so it works immediately upon scanning
  const baseUrl = window.location.origin;
  const menuUrl = `${baseUrl}/menu/${user.id || 'demo'}`;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">QR Code Generator</h1>
        <p className="text-slate-500">Create, customize, and download QR codes for your tables.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Panel - Settings (1 column) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100">
             <h3 className="text-lg font-bold text-slate-800 mb-4">Restaurant Link</h3>
             <div className="space-y-4">
                <input type="text" readOnly value={restaurantName} className="w-full px-4 py-2.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl outline-none text-sm font-medium" />
                <div className="flex relative">
                  <input type="text" readOnly value={menuUrl} className="w-full pl-4 pr-10 py-2.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-xl outline-none text-sm" />
                  <button onClick={() => navigator.clipboard.writeText(menuUrl)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary"><LinkIcon size={16} /></button>
                </div>
             </div>
          </div>

          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100">
             <h3 className="text-lg font-bold text-slate-800 mb-4">QR Style</h3>
             <div className="space-y-3">
                {['standard', 'colorful', 'with logo'].map(s => (
                  <label key={s} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${style === s ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="style" checked={style === s} onChange={() => setStyle(s)} className="text-primary focus:ring-primary" />
                    <span className="font-medium capitalize">{s}</span>
                  </label>
                ))}
                {style === 'colorful' && (
                  <div className="pt-2 flex gap-2">
                    <div onClick={() => setQrColor('#667eea')} className={`w-8 h-8 rounded-full bg-primary cursor-pointer border-2 border-white shadow-sm ${qrColor === '#667eea' ? 'ring-2 ring-primary' : 'hover:ring-2 hover:ring-primary'}`}></div>
                    <div onClick={() => setQrColor('#3b82f6')} className={`w-8 h-8 rounded-full bg-blue-500 cursor-pointer border-2 border-white shadow-sm ${qrColor === '#3b82f6' ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-blue-500'}`}></div>
                    <div onClick={() => setQrColor('#22c55e')} className={`w-8 h-8 rounded-full bg-green-500 cursor-pointer border-2 border-white shadow-sm ${qrColor === '#22c55e' ? 'ring-2 ring-green-500' : 'hover:ring-2 hover:ring-green-500'}`}></div>
                  </div>
                )}
             </div>
          </div>
          
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100">
             <h3 className="text-lg font-bold text-slate-800 mb-4">Size Options</h3>
             <div className="grid grid-cols-3 gap-2">
               {['Small', 'Medium', 'Large'].map(sz => (
                 <button key={sz} onClick={() => setSize(sz)} className={`py-2 text-sm rounded-lg border font-medium ${size === sz ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                   {sz}
                 </button>
               ))}
             </div>
          </div>
        </div>

        {/* Center Panel - Preview (2 columns) */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center bg-slate-100 rounded-[2rem] p-8 border border-slate-200 relative overflow-hidden min-h-[500px]">
          {/* Checkered background for transparency illusion */}
          <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
          
          <div className="relative z-10 bg-white p-12 rounded-[2rem] shadow-2xl flex flex-col items-center transition-all">
             <div className="w-64 h-64 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center mb-8 relative">
                <QRCodeSVG 
                  value={menuUrl} 
                  size={200} 
                  fgColor={style === 'colorful' ? qrColor : '#0f172a'} 
                  level="H" // High error correction so logo doesn't break it
                />
                
                {style === 'with logo' && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white p-2.5 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-slate-100 flex items-center justify-center">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center font-bold text-primary">S2D</div>
                    </div>
                  </div>
                )}
             </div>
             
             <h4 className="text-2xl font-black text-slate-800 tracking-tight text-center mb-1">{restaurantName}</h4>
             <p className="text-slate-500 font-medium text-center">Scan to view menu & order</p>
          </div>
        </div>

        {/* Right Panel - Downloads (1 column) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Export Options</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Format</label>
                <select value={format} onChange={e => setFormat(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-700">
                  <option>PNG (Transparent)</option>
                  <option>JPG (White background)</option>
                  <option>SVG (Vector)</option>
                  <option>PDF (Print Ready)</option>
                </select>
              </div>

              <div className="pt-2 space-y-3">
                <button className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                  <Download size={18} /> Download {format.split(' ')[0]}
                </button>
                <button className="w-full flex justify-center items-center gap-2 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm">
                  <Printer size={18} /> Print Now
                </button>
                <button className="w-full flex justify-center items-center gap-2 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all">
                  <Share2 size={18} /> Share Digital QR
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Print Templates</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="border border-slate-200 rounded-xl p-3 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                <div className="w-full h-16 bg-slate-100 rounded mb-2 flex items-center justify-center"><ImageIcon size={20} className="text-slate-400" /></div>
                <span className="text-xs font-medium text-slate-600">Table Tent</span>
              </div>
              <div className="border border-slate-200 rounded-xl p-3 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                <div className="w-full h-16 bg-slate-100 rounded mb-2 flex items-center justify-center"><ImageIcon size={20} className="text-slate-400" /></div>
                <span className="text-xs font-medium text-slate-600">A4 Poster</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default QRGenerator;
