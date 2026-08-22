import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TrackerProvider } from './components/TrackerProvider';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Movies from './pages/Movies';
import Series from './pages/Series';
import Watching from './pages/Watching';
import Watchlist from './pages/Watchlist';
import Completed from './pages/Completed';
import Statistics from './pages/Statistics';
import Settings from './pages/Settings';
import SearchPage from './pages/SearchPage';
import TitleDetail from './pages/TitleDetail';

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
          </Layout>
        </ErrorBoundary>
      </TrackerProvider>
    </BrowserRouter>
  );
}
