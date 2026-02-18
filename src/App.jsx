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
  const { user, firebaseUser, profile, setOnboarded, darkMode } = useApp();
  const [page, setPage] = useState('home');
  const [showAuth, setShowAuth] = useState(false);

  // Handle checkout success redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      window.history.replaceState({}, '', '/');
      setPage('dash');
    }
  }, []);

  // When user logs in, close auth modal AND navigate to the right page in one go.
  // This avoids the race condition where showAuth closes but page is still 'home',
  // causing a brief flash of the homepage before effects redirect.
  useEffect(() => {
    if (user) {
      // Close auth modal if open
      if (showAuth) {
        setShowAuth(false);
      }
      // Navigate to the right destination if still on home
      if (page === 'home') {
        setPage(profile ? 'dash' : 'setup');
      }
    }
  }, [user, profile]);

  // Compute effective page for rendering.
  // This ensures the correct page shows even before effects run.
  let effectivePage = page;

  if (user) {
    // If logged in but no profile, always force to setup
    if (!profile && page !== 'price') {
      effectivePage = 'setup';
    }
    // If logged in and still on 'home', redirect
    else if (page === 'home') {
      effectivePage = profile ? 'dash' : 'setup';
    }
  }

  // Loading state — waiting for Firebase to initialise
  if (firebaseUser === undefined) {
    return (
      <div className={'min-h-screen flex items-center justify-center ' + (darkMode ? 'bg-slate-900 text-white' : 'bg-white')}>
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Not logged in — show either AuthPage or public HomePage
  if (!user) {
    if (showAuth) {
      return (
        <div className={'min-h-screen ' + (darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900')}>
          <AuthPage />
        </div>
      );
    }
    return (
      <div className={'min-h-screen ' + (darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900')}>
        <Nav page="home" setPage={setPage} />
        <div className="max-w-7xl mx-auto px-4">
          <HomePage setPage={setPage} onSignup={() => setShowAuth(true)} />
        </div>
      </div>
    );
  }

  // Logged in — render the appropriate page
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
