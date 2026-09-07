import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { TrackerProvider } from './components/TrackerProvider';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Movies = lazy(() => import('./pages/Movies'));
const Series = lazy(() => import('./pages/Series'));
const Watching = lazy(() => import('./pages/Watching'));
const Watchlist = lazy(() => import('./pages/Watchlist'));
const Completed = lazy(() => import('./pages/Completed'));
const Statistics = lazy(() => import('./pages/Statistics'));
const Settings = lazy(() => import('./pages/Settings'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const TitleDetail = lazy(() => import('./pages/TitleDetail'));

function PageLoader() {
  return (
    <div className="py-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="vault-card p-4">
            <div className="h-2.5 skeleton rounded-md w-14 mb-2" />
            <div className="h-6 skeleton rounded-md w-16" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 md:gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="vault-card overflow-hidden rounded-xl">
            <div className="aspect-[2/3] skeleton" />
            <div className="p-2.5 space-y-2">
              <div className="h-3 skeleton rounded-md w-3/4" />
              <div className="h-2.5 skeleton rounded-md w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);
  return null;
}

function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-enter">
      {children}
    </div>
  );
}

function NotFound() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[60vh] px-4 text-center overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-vault-accent/8 rounded-full blur-3xl pointer-events-none" />
      <h1 className="relative text-7xl md:text-8xl font-display font-bold text-vault-accent mb-4 animate-vault-poster-settle">404</h1>
      <p className="text-lg text-vault-text mb-2">Page not found</p>
      <p className="text-sm text-vault-muted mb-6">The page you're looking for doesn't exist.</p>
      <a href="/" className="vault-btn-primary min-h-[46px]">Go Home</a>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <TrackerProvider>
        <ErrorBoundary>
          <Layout>
            <ScrollToTop />
            <PageTransition>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/movies" element={<Movies />} />
                  <Route path="/series" element={<Series />} />
                  <Route path="/watching" element={<Watching />} />
                  <Route path="/watchlist" element={<Watchlist />} />
                  <Route path="/completed" element={<Completed />} />
                  <Route path="/statistics" element={<Statistics />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/search/:query" element={<SearchPage />} />
                  <Route path="/title/:type/:tmdbId" element={<TitleDetail />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </PageTransition>
          </Layout>
        </ErrorBoundary>
      </TrackerProvider>
    </BrowserRouter>
  );
}
