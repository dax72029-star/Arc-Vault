import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-2 border-vault-border border-t-vault-accent rounded-full animate-spin" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="text-6xl font-display font-bold text-vault-accent mb-4">404</h1>
      <p className="text-lg text-vault-text mb-2">Page not found</p>
      <p className="text-sm text-vault-muted mb-6">The page you're looking for doesn't exist.</p>
      <a href="/" className="vault-btn-primary">Go Home</a>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <TrackerProvider>
        <ErrorBoundary>
          <Layout>
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
          </Layout>
        </ErrorBoundary>
      </TrackerProvider>
    </BrowserRouter>
  );
}
