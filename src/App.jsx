import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import { Nav } from './components/Nav';
import { ErrorBoundary } from './components/ErrorBoundary';

// Pages
import { HomePage } from './pages/HomePage';
import { DashPage } from './pages/DashPage';
import { SimPage } from './pages/SimPage';
import { CasesPage } from './pages/CasesPage';
import { PricePage } from './pages/PricePage';
import { AuthPage } from './pages/AuthPage';
import { CVOnboardingPage } from './pages/CVOnboardingPage';

const AppContent = () => {
  console.log('AppContent rendering...');
  const { user, firebaseUser, profile, setOnboarded, darkMode } = useApp();
  console.log('App state:', { hasUser: !!user, hasFirebaseUser: !!firebaseUser, hasProfile: !!profile });
  const [page, setPage] = useState('home');
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      window.history.replaceState({}, '', '/');
      setPage('dash');
    }
  }, []);

  // Auto-close auth modal on login
  useEffect(() => {
    console.log('Auth check useEffect:', { hasUser: !!user, showAuth });
    if (user && showAuth) {
      console.log('CLOSING AUTH MODAL AUTOMATICALLY');
      setShowAuth(false);
    }
  }, [user, showAuth]);

  // Navigate to dash/setup automatically on login if on home
  useEffect(() => {
    console.log('Navigation check useEffect:', { hasUser: !!user, hasProfile: !!profile, page });
    if (user && page === 'home') {
      const target = profile ? 'dash' : 'setup';
      console.log('NAVIGATING AUTOMATICALLY TO:', target);
      setPage(target);
    }
  }, [user, profile, page]);

  // State-driven routing logic
  let effectivePage = page;

  // If we have a user but are on 'home', auto-determine where to go
  if (user && page === 'home') {
    effectivePage = profile ? 'dash' : 'setup';
  }

  // If no profile, force 'setup' (onboarding) even if page state says otherwise
  if (user && !profile) {
    effectivePage = 'setup';
  }

  // Handle Loading State
  if (firebaseUser === undefined) {
    return (
      <div className={'min-h-screen flex items-center justify-center ' + (darkMode ? 'bg-slate-900 text-white' : 'bg-white')}>
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Handle Auth Overlay
  if (!user || showAuth) {
    return (
      <div className={'min-h-screen ' + (darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900')}>
        {showAuth ? (
          <AuthPage />
        ) : (
          <>
            <Nav page={effectivePage} setPage={setPage} />
            <div className="max-w-7xl mx-auto px-4">
              <HomePage setPage={setPage} onSignup={() => setShowAuth(true)} />
            </div>
          </>
        )}
      </div>
    );
  }

  // Main Application Wrapper
  const pages = {
    home: HomePage,
    dash: DashPage,
    sim: SimPage,
    cases: CasesPage,
    price: PricePage,
    setup: CVOnboardingPage
  };

  const PC = pages[effectivePage] || HomePage;
  const pp = effectivePage === 'home'
    ? { setPage, onSignup: () => { } }
    : effectivePage === 'setup'
      ? { onComplete: () => { setOnboarded(true); setPage('dash'); } }
      : { setPage };

  return (
    <div className={'min-h-screen ' + (darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900')}>
      <Nav page={effectivePage} setPage={setPage} />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <PC {...pp} />
      </div>
    </div>
  );
};

const App = () => (
  <ErrorBoundary>
    <AppProvider>
      <AppContent />
    </AppProvider>
  </ErrorBoundary>
);

export default App;
