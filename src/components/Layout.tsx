import { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
];

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-vault-bg flex">
      <aside className="hidden lg:flex flex-col w-60 bg-vault-surface/60 backdrop-blur-vault-xl border-r border-vault-border/40 fixed h-full z-30">
        <div className="p-5 border-b border-vault-border/30">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src="/Arc-Vault LOGO.png" alt="ArcVault" className="w-9 h-9 rounded-xl object-cover" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-vault-success rounded-full border-2 border-vault-surface" />
            </div>
            <div>
              <h1 className="text-base font-display font-bold text-vault-text tracking-tight">ArcVault</h1>
              <p className="text-[11px] text-vault-muted">Personal Tracker</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-vault-accent/10 text-vault-accent shadow-sm shadow-vault-accent/5'
                    : 'text-vault-muted hover:text-vault-text hover:bg-vault-surface-hover'
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-vault-border/30">
          <p className="text-[10px] text-vault-muted/60 text-center tracking-wide uppercase">
            Data powered by TMDB
          </p>
        </div>
      </aside>

      <main className="flex-1 lg:ml-60 pb-20 lg:pb-8">
        <header className="lg:hidden sticky top-0 z-20 bg-vault-bg/80 backdrop-blur-vault-xl border-b border-vault-border/30 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <img src="/Arc-Vault LOGO.png" alt="ArcVault" className="w-7 h-7 rounded-lg object-cover" />
            <h1 className="text-sm font-display font-bold text-vault-text tracking-tight">ArcVault</h1>
          </div>
        </header>
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-vault-surface/90 backdrop-blur-vault-xl border-t border-vault-border/30 safe-bottom">
        <div className="flex justify-around items-center h-16 px-2">
          {mobileNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[48px] ${
                  isActive
                    ? 'text-vault-accent bg-vault-accent/10'
                    : 'text-vault-muted active:text-vault-text active:bg-vault-surface-hover'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
