import { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import CursorAura from './CursorAura';
import {
  Home,
  Film,
  Tv,
  Play,
  ListTodo,
  CheckCircle2,
  BarChart3,
  Settings,
  Search,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/movies', icon: Film, label: 'Movies' },
  { to: '/series', icon: Tv, label: 'Series' },
  { to: '/watching', icon: Play, label: 'Watching' },
  { to: '/watchlist', icon: ListTodo, label: 'Watchlist' },
  { to: '/completed', icon: CheckCircle2, label: 'Done' },
  { to: '/statistics', icon: BarChart3, label: 'Stats' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

const mobileNavItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/search', icon: Search, label: 'Search' },
  { to: '/watching', icon: Play, label: 'Watch' },
  { to: '/completed', icon: CheckCircle2, label: 'Done' },
  { to: '/statistics', icon: BarChart3, label: 'Stats' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="absolute -inset-1 rounded-xl bg-vault-accent/20 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <img src="/arc-vault-logo.png" alt="ArcVault" className="w-9 h-9 rounded-xl object-cover relative ring-1 ring-white/10" />
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-vault-success rounded-full border-2 border-vault-surface" />
      </div>
      <div>
        <p className="text-base font-display font-bold text-vault-text tracking-tight">ArcVault</p>
        <p className="text-[11px] text-vault-muted">Personal Tracker</p>
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: ReactNode }) {

  return (
    <div className="min-h-screen bg-vault-bg flex relative">
      <CursorAura />
      <aside className="hidden lg:flex flex-col w-60 bg-vault-surface/60 backdrop-blur-vault-xl border-r border-vault-border/40 fixed h-full z-30">
        <div className="p-5 border-b border-vault-border/30 group">
          <BrandMark />
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-vault-accent/10 text-vault-accent shadow-sm shadow-vault-accent/5'
                    : 'text-vault-muted hover:text-vault-text hover:bg-vault-surface-hover'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-gradient-to-b from-vault-accent to-vault-accent/60" />
                  )}
                  <item.icon
                    className={`w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200 ${
                      isActive ? 'scale-110' : 'group-hover:scale-105'
                    }`}
                    strokeWidth={isActive ? 2.25 : 2}
                  />
                  <span className="truncate">{item.label}</span>
                  {item.to === '/search' && !isActive && (
                    <span className="ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-vault-border/40 text-vault-muted opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      ⌘K
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-vault-border/30">
          <p className="text-[10px] text-vault-muted/60 text-center tracking-wide uppercase">
            Data powered by TMDB
          </p>
        </div>
      </aside>

      <main className="flex-1 lg:ml-60 pb-[76px] lg:pb-6">
        <header className="lg:hidden sticky top-0 z-20 bg-vault-bg/85 backdrop-blur-vault-xl border-b border-vault-border/30 safe-top">
          <div className="flex items-center gap-2.5 px-4 py-3">
            <img src="/arc-vault-logo.png" alt="ArcVault" className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/10" />
            <p className="text-[15px] font-display font-bold text-vault-text tracking-tight">ArcVault</p>
          </div>
        </header>
        <div className="px-4 pt-4 pb-4 md:px-6 md:pt-6 md:pb-6 lg:px-8 lg:pt-8 lg:pb-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-vault-surface/95 backdrop-blur-vault-xl border-t border-vault-border/30 safe-bottom">
        <div className="flex justify-around items-stretch h-[68px] px-1">
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-[3px] px-1 min-w-[48px] rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'text-vault-accent'
                    : 'text-vault-muted active:text-vault-text'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] rounded-full transition-all duration-200 ${
                      isActive
                        ? 'bg-vault-accent shadow-vault-glow'
                        : 'bg-transparent'
                    }`}
                  />
                  <span
                    className={`flex items-center justify-center w-11 h-7 rounded-full transition-all duration-200 ${
                      isActive
                        ? 'bg-vault-accent/10'
                        : 'bg-transparent'
                    }`}
                  >
                    <item.icon
                      className={`w-[21px] h-[21px] transition-transform duration-200 ${
                        isActive ? 'scale-105' : ''
                      }`}
                      strokeWidth={isActive ? 2.25 : 2}
                    />
                  </span>
                  <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}