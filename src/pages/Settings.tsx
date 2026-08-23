import { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Upload, Trash2, AlertTriangle, Settings as SettingsIcon, ExternalLink, Film, Loader2, CheckCircle2, XCircle, AlertCircle, Search } from 'lucide-react';
import { exportData, importData, clearAllData, addTitle, getTracker } from '../services/storage';
import { useTrackerContext } from '../hooks/useTrackerContext';
import { resolveImportItems, enrichTrackerAfterImport, type ImportItem, type ResolutionProgress, type EnrichmentProgress } from '../services/tmdbMatcher';
import { TMDB } from '../config/tmdb';

interface Message {
  type: 'success' | 'error';
  text: string;
}

interface ResolutionState {
  status: 'idle' | 'resolving' | 'done' | 'cancelled';
  progress: ResolutionProgress | null;
  result: Awaited<ReturnType<typeof resolveImportItems>> | null;
  error: string | null;
}

function isLightweightImport(data: unknown): data is ImportItem[] {
  if (!Array.isArray(data) || data.length === 0) return false;
  const sample = data[0];
  if (typeof sample !== 'object' || sample === null) return false;
  const obj = sample as Record<string, unknown>;
  return typeof obj.title === 'string' && typeof obj.type === 'string';
}

export default function Settings() {
  const { refresh } = useTrackerContext();
  const [importing, setImporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [resolution, setResolution] = useState<ResolutionState>({
    status: 'idle',
    progress: null,
    result: null,
    error: null,
  });
  const [enriching, setEnriching] = useState<EnrichmentProgress | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lightweightInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMessage(null), type === 'success' ? 6000 : 4000);
  }, []);

  const handleExport = () => {
    try {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `arcvault-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMessage('success', 'Data exported successfully');
    } catch {
      showMessage('error', 'Failed to export data');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showMessage('error', 'File too large. Maximum size is 10MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (isLightweightImport(parsed)) {
          handleLightweightImport(parsed);
          return;
        }

        const result = importData(content);
        if (result.success) {
          setEnriching({ total: 0, enriched: 0, current: 'Scanning...' });
          const enrichResult = await enrichTrackerAfterImport((progress) => {
            setEnriching(progress);
          });
          setEnriching(null);
          refresh();
          let text = `Imported ${result.trackerImported} titles`;
          if (result.historyImported > 0) text += ` and ${result.historyImported} history entries`;
          if (result.duplicatesSkipped > 0) text += ` (${result.duplicatesSkipped} duplicates skipped)`;
          if (enrichResult.enriched > 0) text += ` (${enrichResult.enriched} enriched from TMDB)`;
          showMessage('success', text);
        } else {
          showMessage('error', result.error || 'Invalid data format');
        }
      } catch {
        showMessage('error', 'Failed to parse file');
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleLightweightImport = async (items: ImportItem[]) => {
    if (!TMDB.hasApiKey()) {
      showMessage('error', 'TMDB API key not configured. Cannot resolve titles.');
      setImporting(false);
      return;
    }

    abortRef.current = new AbortController();
    setResolution({
      status: 'resolving',
      progress: { total: items.length, resolved: 0, needsReview: 0, failed: 0, currentItem: items[0]?.title },
      result: null,
      error: null,
    });

    try {
      const result = await resolveImportItems(
        items,
        (progress) => {
          setResolution((prev) => ({ ...prev, progress }));
        },
        abortRef.current.signal
      );

      if (result.stats.resolved > 0) {
        const existing = getTracker();
        let added = 0;
        for (const item of result.trackerItems) {
          const exists = existing.some((t) => t.tmdbId === item.tmdbId && t.type === item.type);
          if (!exists) {
            addTitle(item);
            added++;
          }
        }
        refresh();
        setResolution({ status: 'done', progress: null, result, error: null });
        showMessage('success', `Resolved ${added} of ${items.length} titles from TMDB`);
      } else {
        setResolution({ status: 'done', progress: null, result, error: null });
        showMessage('error', `No titles could be resolved from ${items.length} entries`);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setResolution({ status: 'cancelled', progress: null, result: null, error: null });
        showMessage('error', 'Import cancelled');
      } else {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setResolution({ status: 'idle', progress: null, result: null, error: msg });
        showMessage('error', `Resolution failed: ${msg}`);
      }
    } finally {
      setImporting(false);
      abortRef.current = null;
    }
  };

  const handleLightweightFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showMessage('error', 'File too large. Maximum size is 10MB.');
      if (lightweightInputRef.current) lightweightInputRef.current.value = '';
      return;
    }

    setImporting(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          handleLightweightImport(parsed);
        } else {
          showMessage('error', 'Lightweight import requires a JSON array of {title, type, status}');
          setImporting(false);
        }
      } catch {
        showMessage('error', 'Failed to parse JSON file');
        setImporting(false);
      } finally {
        if (lightweightInputRef.current) lightweightInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleCancelResolution = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  };

  const handleClearAll = () => {
    if (clearing) {
      clearAllData();
      refresh();
      showMessage('success', 'All data cleared');
      setClearing(false);
    } else {
      setClearing(true);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => setClearing(false), 5000);
    }
  };

  return (
    <div>
      <div className="mb-8 md:mb-10">
        <h1 className="text-h1 font-display font-bold text-vault-text tracking-tight">Settings</h1>
        <p className="text-body-sm text-vault-muted mt-1">Manage your data</p>
      </div>

      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-lg text-sm font-medium border ${
            message.type === 'success'
              ? 'bg-vault-success/10 border-vault-success/30 text-vault-success'
              : 'bg-vault-error-subtle border-vault-error/30 text-vault-error'
          }`}
        >
          {message.text}
        </div>
      )}

      <section className="vault-section">
        <h2 className="vault-section-title">
          <SettingsIcon className="w-5 h-5 text-vault-accent" />
          Data Management
        </h2>

        <div className="space-y-4">
          <div className="vault-card p-5 md:p-6 transition-colors duration-vault-normal hover:border-vault-border">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-vault-info-subtle rounded-xl flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-vault-info" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">Export Data</h3>
                <p className="text-xs text-vault-muted mt-1 leading-relaxed">
                  Download your tracker data as a JSON file.
                </p>
                <button onClick={handleExport} className="vault-btn-secondary mt-4">
                  <Download className="w-4 h-4" />
                  Export to JSON
                </button>
              </div>
            </div>
          </div>

          <div className="vault-card p-5 md:p-6 transition-colors duration-vault-normal hover:border-vault-border">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-vault-success/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Upload className="w-5 h-5 text-vault-success" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">Import Data</h3>
                <p className="text-xs text-vault-muted mt-1 leading-relaxed">
                  Import a previously exported ArcVault JSON file. Imported titles are added to your existing data — existing records are never deleted or replaced.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                  className="vault-btn-primary mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  {importing ? 'Importing...' : 'Import from JSON'}
                </button>
              </div>
            </div>
          </div>

          <div className="vault-card p-5 md:p-6 transition-colors duration-vault-normal hover:border-vault-border !border-vault-accent/30">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-vault-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Search className="w-5 h-5 text-vault-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">Quick Import (TMDB Lookup)</h3>
                <p className="text-xs text-vault-muted mt-1 leading-relaxed">
                  Import a list of titles without TMDB IDs. Each title will be resolved via TMDB search automatically.
                </p>
                <p className="text-[11px] text-vault-muted/70 mt-2 font-mono bg-vault-surface/50 px-2 py-1.5 rounded">
                  {'[{ "title": "Inception", "type": "movie", "status": "completed" }]'}
                </p>
                <input
                  ref={lightweightInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleLightweightFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => lightweightInputRef.current?.click()}
                  disabled={importing || !TMDB.hasApiKey()}
                  className="vault-btn-secondary mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Film className="w-4 h-4" />
                  )}
                  {importing ? 'Resolving via TMDB...' : 'Quick Import'}
                </button>
                {!TMDB.hasApiKey() && (
                  <p className="text-[11px] text-vault-error mt-2">
                    TMDB API key not configured. Add VITE_TMDB_API_KEY to .env
                  </p>
                )}
              </div>
            </div>

            {resolution.status === 'resolving' && resolution.progress && (
              <div className="mt-4 p-3 bg-vault-surface/50 rounded-lg border border-vault-border/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-vault-muted">Resolving titles...</span>
                  <span className="text-xs text-vault-text-secondary font-mono">
                    {resolution.progress.resolved + resolution.progress.needsReview + resolution.progress.failed}/{resolution.progress.total}
                  </span>
                </div>
                <div className="w-full bg-vault-border/30 rounded-full h-1.5 mb-2">
                  <div
                    className="bg-vault-accent h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${((resolution.progress.resolved + resolution.progress.needsReview + resolution.progress.failed) / resolution.progress.total) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex gap-3 text-[11px]">
                    <span className="text-vault-success">{resolution.progress.resolved} resolved</span>
                    <span className="text-vault-warning">{resolution.progress.needsReview} review</span>
                    <span className="text-vault-error">{resolution.progress.failed} failed</span>
                  </div>
                  <button
                    onClick={handleCancelResolution}
                    className="text-[11px] text-vault-error hover:text-vault-error-hover transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                {resolution.progress.currentItem && (
                  <p className="text-[10px] text-vault-muted/60 mt-1 truncate">
                    Processing: {resolution.progress.currentItem}
                  </p>
                )}
              </div>
            )}

            {resolution.status === 'done' && resolution.result && (
              <div className="mt-4 p-3 bg-vault-surface/50 rounded-lg border border-vault-border/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-vault-success" />
                  <span className="text-xs font-semibold text-vault-text">Import Complete</span>
                </div>
                <div className="flex gap-3 text-[11px]">
                  <span className="text-vault-success flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {resolution.result.stats.resolved} resolved
                  </span>
                  {resolution.result.stats.needsReview > 0 && (
                    <span className="text-vault-warning flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {resolution.result.stats.needsReview} need review
                    </span>
                  )}
                  {resolution.result.stats.failed > 0 && (
                    <span className="text-vault-error flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {resolution.result.stats.failed} failed
                    </span>
                  )}
                  {resolution.result.stats.duplicates > 0 && (
                    <span className="text-vault-muted">{resolution.result.stats.duplicates} duplicates</span>
                  )}
                </div>

                {resolution.result.needsReview.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-vault-border/20">
                    <p className="text-[11px] font-semibold text-vault-text-secondary mb-1">Titles needing review:</p>
                    <ul className="text-[10px] text-vault-muted space-y-0.5 max-h-24 overflow-y-auto">
                      {resolution.result.needsReview.map((item, i) => (
                        <li key={i} className="truncate">- {item.title} ({item.type})</li>
                      ))}
                    </ul>
                  </div>
                )}

                {resolution.result.failed.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-vault-border/20">
                    <p className="text-[11px] font-semibold text-vault-error mb-1">Failed to resolve:</p>
                    <ul className="text-[10px] text-vault-muted space-y-0.5 max-h-24 overflow-y-auto">
                      {resolution.result.failed.map((item, i) => (
                        <li key={i} className="truncate">- {item.title} ({item.type})</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {resolution.status === 'cancelled' && (
              <div className="mt-4 p-3 bg-vault-surface/50 rounded-lg border border-vault-warning/30">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-vault-warning" />
                  <span className="text-xs text-vault-warning">Import cancelled</span>
                </div>
              </div>
            )}

            {enriching && (
              <div className="mt-4 p-3 bg-vault-surface/50 rounded-lg border border-vault-accent/30">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="w-3.5 h-3.5 text-vault-accent animate-spin" />
                  <span className="text-xs text-vault-accent font-semibold">Enriching from TMDB...</span>
                </div>
                <p className="text-[10px] text-vault-muted/60">
                  {enriching.current || 'Scanning imported titles...'} — {enriching.enriched}/{enriching.total}
                </p>
              </div>
            )}
          </div>

          <div className="vault-card p-5 md:p-6 !border-vault-error/20 transition-colors duration-vault-normal hover:!border-vault-error/40">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-vault-error-subtle rounded-xl flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-vault-error" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">Clear All Data</h3>
                <p className="text-xs text-vault-muted mt-1 leading-relaxed">
                  Permanently delete all tracker data. This cannot be undone.
                </p>
                <button
                  onClick={handleClearAll}
                  className={`mt-4 ${
                    clearing
                      ? 'inline-flex items-center gap-2 px-5 py-2.5 bg-vault-error hover:bg-vault-error-hover text-white font-medium text-sm rounded-lg transition-all duration-vault-normal'
                      : 'vault-btn-danger'
                  }`}
                >
                  {clearing ? (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      Click again to confirm
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Clear All Data
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="vault-section">
        <h2 className="vault-section-title">About</h2>
        <div className="vault-card p-5 md:p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-vault-muted">App</span>
              <span className="text-sm text-white font-semibold">ArcVault v1.0.0</span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-vault-border/30">
              <span className="text-sm text-vault-muted">Storage</span>
              <span className="text-sm text-white">Browser LocalStorage</span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-vault-border/30">
              <span className="text-sm text-vault-muted">API</span>
              <span className="text-sm text-white">TMDB</span>
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-vault-border/30">
            <p className="text-xs text-vault-muted text-center leading-relaxed">
              This product uses the TMDB API but is not endorsed or certified by TMDB.
            </p>
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 text-xs text-vault-accent hover:text-vault-accent-hover mt-3 mx-auto transition-colors duration-vault-normal w-full"
            >
              themoviedb.org
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </section>

      <footer className="mt-12 pt-8 border-t border-vault-border/30 text-center">
        <p className="text-sm font-display font-semibold text-vault-text tracking-wide">ArcVault</p>
        <p className="text-xs text-vault-muted mt-1.5">
          A personal cinema journey, crafted by <span className="text-vault-text-secondary font-medium">DAX SANANDIYA</span>
        </p>
        <p className="text-[10px] text-vault-muted/60 mt-2">
          © 2026 DAX SANANDIYA · v1.0.0
        </p>
      </footer>
    </div>
  );
}
