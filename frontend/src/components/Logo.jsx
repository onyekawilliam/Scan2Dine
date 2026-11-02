import React from 'react';

// The Scan2Dine mark: QR corner brackets around a plate with a fork and knife.
// Flat colours only (indigo + orange), so it stays crisp at any size and in print.
const Mark = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="5" y="5" width="90" height="90" rx="22" fill="#eef2ff" />
    <path d="M 17 36 L 17 17 L 36 17" stroke="#4f46e5" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 83 36 L 83 17 L 64 17" stroke="#4f46e5" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 17 64 L 17 83 L 36 83" stroke="#4f46e5" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M 83 64 L 83 83 L 64 83" stroke="#4f46e5" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="50" cy="50" r="18" stroke="#f97316" strokeWidth="4.5" />
    <path d="M 44 41 L 44 59 M 41 41 L 41 47 M 47 41 L 47 47" stroke="#f97316" strokeWidth="2.8" strokeLinecap="round" />
    <path d="M 56 41 C 59 41 59 48 56 52 L 56 59" stroke="#f97316" strokeWidth="2.8" strokeLinecap="round" />
  </svg>
);

// size: "nav" (small) | "hero" (large). Pass `wordmark` to add the name next to the mark.
const Logo = ({ size = 'nav', wordmark = false }) => {
  const px = size === 'hero' ? 64 : 32;
  if (!wordmark) return <Mark size={px} />;
  return (
    <span className="inline-flex items-center gap-2.5">
      <Mark size={px} />
      <span className="text-lg font-semibold tracking-tight text-slate-900">Scan2Dine</span>
    </span>
  );
};

export default Logo;
