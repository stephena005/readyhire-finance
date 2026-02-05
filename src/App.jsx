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
    if (user && showAuth) {
      setShowAuth(false);
    }
  }, [user, showAuth]);

  if (firebaseUser === undefined) {
    return (
      <div className={'min-h-screen flex items-center justify-center ' + (darkMode ? 'bg-slate-900 text-white' : 'bg-white')}>
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!user || showAuth) {
    return (
      <div className={'min-h-screen ' + (darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900')}>
        {showAuth ? (
          <AuthPage />
        ) : (
          <>
            <Nav page={page} setPage={setPage} />
            <div className="max-w-7xl mx-auto px-4">
              <HomePage setPage={setPage} onSignup={() => setShowAuth(true)} />
            </div>
          </>
        )}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={'min-h-screen ' + (darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900')}>
        <Nav page="setup" setPage={setPage} />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <CVOnboardingPage onComplete={() => { setOnboarded(true); setPage('dash'); }} />
        </div>
      </div>
    );
  }

  const pages = {
    home: HomePage,
    dash: DashPage,
    sim: SimPage,
    cases: CasesPage,
    price: PricePage,
    setup: CVOnboardingPage
  };

  const PC = pages[page] || HomePage;
  const pp = page === 'home'
    ? { setPage, onSignup: () => { } }
    : page === 'setup'
      ? { onComplete: () => { setOnboarded(true); setPage('dash'); } }
      : { setPage };

  return (
    <div className={'min-h-screen ' + (darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900')}>
      <Nav page={page} setPage={setPage} />
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
