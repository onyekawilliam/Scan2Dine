import React from 'react';

const Logo = ({ size = 'nav' }) => {
  const dimensions = size === 'hero' ? 70 : 45;
  
  return (
    <svg 
      width={dimensions} 
      height={dimensions} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      <defs>
        <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#667eea" />
          <stop offset="100%" stopColor="#764ba2" />
        </linearGradient>
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff6b35" />
          <stop offset="100%" stopColor="#f7931e" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background Rounded Square */}
      <rect x="5" y="5" width="90" height="90" rx="20" fill="url(#primaryGradient)" opacity="0.1" />
      <rect x="5" y="5" width="90" height="90" rx="20" stroke="url(#primaryGradient)" strokeWidth="4" />

      {/* QR Code Corner Markers */}
      <path d="M 15 35 L 15 15 L 35 15" fill="none" stroke="url(#primaryGradient)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 85 35 L 85 15 L 65 15" fill="none" stroke="url(#primaryGradient)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 15 65 L 15 85 L 35 85" fill="none" stroke="url(#primaryGradient)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

      {/* Center Plate & Fork/Knife */}
      <circle cx="50" cy="50" r="18" fill="none" stroke="url(#accentGradient)" strokeWidth="4" filter="url(#glow)" />
      {/* Fork */}
      <path d="M 44 42 L 44 50 M 41 42 L 41 48 M 47 42 L 47 48 M 44 50 L 44 60" stroke="url(#accentGradient)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Knife */}
      <path d="M 56 42 C 58 42 58 48 56 52 L 56 60" stroke="url(#accentGradient)" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Animated Scanning Beam */}
      <rect x="10" y="10" width="80" height="4" fill="url(#accentGradient)" filter="url(#glow)" style={{ animation: 'scanBeam 3s infinite linear' }} />
    </svg>
  );
};

export default Logo;
