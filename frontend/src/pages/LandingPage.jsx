import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowRight, BarChart3, ChefHat, ImagePlus, QrCode, ScanLine, Smartphone, UtensilsCrossed } from 'lucide-react';
import PhoneMockup from '../components/PhoneMockup';
import FeatureCard from '../components/FeatureCard';
import Logo from '../components/Logo';
import AuthModal from '../components/AuthModal';

const STEPS = [
  { icon: UtensilsCrossed, title: 'Build your menu', text: 'Add categories and dishes with prices, descriptions and photos.' },
  { icon: QrCode, title: 'Print your QR code', text: 'Download it, print it, and put it on your tables.' },
  { icon: ChefHat, title: 'Receive orders', text: 'Guests scan, order from their phone, and you see it instantly.' },
];

const FEATURES = [
  { icon: Smartphone, title: 'Works on any phone', description: 'Guests open your menu in their browser. No app to download, no account to create.' },
  { icon: ChefHat, title: 'Live order board', description: 'New orders appear the moment they are placed, with a kitchen display for your staff.' },
  { icon: ImagePlus, title: 'Menu you control', description: 'Change prices, mark dishes sold out and upload photos. Updates show straight away.' },
  { icon: BarChart3, title: 'Simple analytics', description: 'See sales over the last week and which dishes sell best.' },
];

function LandingPage() {
  const location = useLocation();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');

  const openAuth = (mode) => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  // Sent here by ProtectedRoute after visiting /dashboard while signed out.
  useEffect(() => {
    if (location.state?.authRequired) openAuth('signin');
  }, [location.state]);

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label="Main">
          <Logo wordmark />
          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#how" className="hover:text-slate-900">How it works</a>
            <a href="#features" className="hover:text-slate-900">Features</a>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => openAuth('signin')} className="btn btn-ghost">Sign in</button>
            <button type="button" onClick={() => openAuth('signup')} className="btn btn-primary">Create account</button>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-in-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              <ScanLine size={14} className="text-primary" aria-hidden="true" /> QR menus and ordering for restaurants
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Digital menus and table ordering for your restaurant.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              Scan2Dine gives your restaurant a digital menu and a live order board. Guests scan a QR code at the table, order from their phone, and your kitchen sees it straight away.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => openAuth('signup')} className="btn btn-primary btn-lg">
                Create your account <ArrowRight size={18} />
              </button>
              <button type="button" onClick={() => openAuth('signin')} className="btn btn-secondary btn-lg">Sign in</button>
            </div>
          </div>

          <div className="animate-fade-in-up flex justify-center lg:justify-end" style={{ animationDelay: '120ms' }}>
            <PhoneMockup />
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-y border-slate-200 bg-slate-50 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">How it works</h2>
            <p className="mt-2 max-w-2xl text-slate-600">From sign-up to your first order in three steps.</p>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="card card-pad">
                  <div className="flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-full bg-primary text-sm font-semibold text-white">{i + 1}</span>
                    <step.icon size={20} className="text-slate-400" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">What you get</h2>
            <p className="mt-2 max-w-2xl text-slate-600">Everything you need to take orders at the table, and nothing you do not.</p>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => <FeatureCard key={feature.title} {...feature} />)}
            </div>
          </div>
        </section>

        {/* Closing call to action */}
        <section className="px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="mx-auto max-w-6xl rounded-2xl bg-slate-900 px-6 py-12 text-center sm:px-12">
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Ready to put your menu on the table?</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-300">Create an account, add your menu and print your first QR code today.</p>
            <button type="button" onClick={() => openAuth('signup')} className="btn btn-lg mt-8 bg-white text-slate-900 hover:bg-slate-100">
              Create your account <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 text-sm text-slate-500 sm:flex-row sm:px-6">
          <Logo wordmark />
          <p>© {new Date().getFullYear()} Scan2Dine</p>
        </div>
      </footer>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} initialMode={authMode} />
    </div>
  );
}

export default LandingPage;
