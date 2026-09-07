import { useState, useRef, useEffect, useCallback } from 'react';
import { Download, Upload, Trash2, AlertTriangle, Settings as SettingsIcon, ExternalLink, DownloadCloud } from 'lucide-react';
import { exportData, importData, clearAllData } from '../services/storage';
import { useTrackerContext } from '../hooks/useTrackerContext';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { enrichTrackerAfterImport, type EnrichmentProgress } from '../services/tmdbMatcher';
import PageHeader, { ContextPill } from '../components/PageHeader';
import PageFooter from '../components/PageFooter';

interface Message {
  type: 'success' | 'error';
  text: string;
}

export default function Settings() {
  const { refresh } = useTrackerContext();
  const { isInstallable, promptInstall } = useInstallPrompt();
  const [importing, setImporting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [enriching, setEnriching] = useState<EnrichmentProgress | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as { standalone?: boolean }).standalone === true
    );
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
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
      <PageHeader
        kicker="Preferences"
        title="Settings"
        subtitle="Manage your data and preferences"
      />

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

          {enriching && (
            <div className="vault-card p-5 md:p-6 border-vault-accent/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-vault-accent font-semibold">Enriching from TMDB...</span>
              </div>
              <p className="text-[10px] text-vault-muted/60">
                {enriching.current || 'Scanning imported titles...'} — {enriching.enriched}/{enriching.total}
              </p>
            </div>
          )}

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

      {!isStandalone && (
        <section className="vault-section">
          <h2 className="vault-section-title">
            <DownloadCloud className="w-5 h-5 text-vault-accent" />
            Install App
          </h2>
          <div className="vault-card p-5 md:p-6">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-vault-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <DownloadCloud className="w-5 h-5 text-vault-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">Install ArcVault</h3>
                <p className="text-xs text-vault-muted mt-1 leading-relaxed">
                  Get a faster, app-like ArcVault experience on your device.
                </p>
                {isInstallable ? (
                  <button onClick={promptInstall} className="vault-btn-primary mt-4">
                    <DownloadCloud className="w-4 h-4" />
                    Install ArcVault
                  </button>
                ) : (
                  <p className="text-xs text-vault-muted/70 mt-3">
                    On iPhone/iPad, use your browser's Share menu &rarr; Add to Home Screen.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

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

      <PageFooter />
    </div>
  );
}
