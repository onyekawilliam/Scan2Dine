import React, { useState } from 'react';
import { QrCode, Smartphone, LineChart, ArrowRight, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import PhoneMockup from '../components/PhoneMockup';
import FeatureCard from '../components/FeatureCard';
import Logo from '../components/Logo';
import AuthModal from '../components/AuthModal';

function LandingPage() {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');

  const openAuth = (mode) => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans">
      {/* Background Gradients & Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-accent/20 rounded-full animate-float" style={{ animationDelay: '0s' }}></div>
         <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-primary/20 rounded-full animate-float" style={{ animationDelay: '1s' }}></div>
         <div className="absolute bottom-1/4 left-1/3 w-8 h-8 bg-secondary/20 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* Navbar */}
      <nav className="relative z-10 px-6 lg:px-12 py-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center bg-white/60 backdrop-blur-md px-6 py-4 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)] border border-white/40">
          <div className="flex items-center gap-3">
            <Logo size="nav" />
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-tight">Scan2Dine</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <Link to="/dashboard" className="hover:text-primary transition-colors">Admin Demo</Link>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => openAuth('signin')} className="text-slate-600 font-medium hover:text-primary transition-colors px-4 py-2">
              Sign In
            </button>
            <button onClick={() => openAuth('signup')} className="bg-gradient-to-r from-primary to-secondary text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] transition-all duration-300">
              Get Started Free
            </button>
          </div>
          
          <div className="md:hidden">
            <button className="text-slate-800 p-2">
               <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 px-6 lg:px-12 pt-12 pb-24 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column - Copy */}
          <div className="space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-slate-200 shadow-sm text-sm font-medium text-slate-700">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              Contactless QR Menus
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] tracking-tight">
              Transform Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Restaurant
              </span> Experience
            </h1>
            
            <p className="text-lg lg:text-xl text-slate-600 leading-relaxed max-w-xl">
              Elevate your dining service with interactive digital menus, seamless mobile ordering, and real-time analytics. Fast, intuitive, and contactless.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button onClick={() => openAuth('signup')} className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-xl font-semibold shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] transition-all duration-300 text-lg">
                Get Started Free
                <ArrowRight size={20} />
              </button>
              <button onClick={() => openAuth('signin')} className="flex items-center justify-center gap-2 bg-white text-slate-800 border border-slate-200 px-8 py-4 rounded-xl font-semibold shadow-[0_8px_32px_rgba(0,0,0,0.05)] hover:shadow-lg transition-all duration-300 text-lg">
                Sign In
              </button>
            </div>
          </div>

          {/* Right Column - Mockup */}
          <div className="relative flex justify-center lg:justify-end animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary/10 to-accent/20 rounded-full blur-[80px] -z-10"></div>
            <PhoneMockup />
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mt-32">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">Everything you need to grow</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">Powerful features designed to increase revenue and improve customer satisfaction.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
             <FeatureCard 
              icon={QrCode}
              title="Easy QR Generation"
              description="Generate beautiful, scannable QR codes for your tables instantly."
              delay={0}
            />
            <FeatureCard 
              icon={Smartphone}
              title="Mobile-First Design"
              description="A beautiful, app-like experience right in the customer's mobile browser."
              delay={100}
            />
            <FeatureCard 
              icon={LineChart}
              title="Real-time Analytics"
              description="Track popular items and revenue trends with an intuitive dashboard."
              delay={200}
            />
            <FeatureCard 
              icon={Menu}
              title="Easy Management"
              description="Update menu items, prices, and availability in real-time."
              delay={300}
            />
          </div>
        </div>
      </main>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} initialMode={authMode} />
    </div>
  );
}

export default LandingPage;
