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
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-vault-bg flex">
      <aside className="hidden lg:flex flex-col w-60 bg-vault-surface/60 backdrop-blur-vault-xl border-r border-vault-border/40 fixed h-full z-30">
        <div className="p-5 border-b border-vault-border/30">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src="/arc-vault-logo.png" alt="ArcVault" className="w-9 h-9 rounded-xl object-cover" />
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

      <main className="flex-1 lg:ml-60 pb-[72px] lg:pb-6">
        <header className="lg:hidden sticky top-0 z-20 bg-vault-bg/85 backdrop-blur-vault-xl border-b border-vault-border/30 safe-top">
          <div className="flex items-center gap-2.5 px-4 py-3">
            <img src="/arc-vault-logo.png" alt="ArcVault" className="w-8 h-8 rounded-lg object-cover" />
            <h1 className="text-[15px] font-display font-bold text-vault-text tracking-tight">ArcVault</h1>
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
                `flex flex-col items-center justify-center gap-[3px] px-1 min-w-[48px] rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'text-vault-accent'
                    : 'text-vault-muted active:text-vault-text'
                }`
              }
            >
              <item.icon className="w-[22px] h-[22px]" strokeWidth={2} />
              <span className="text-[10px] font-medium leading-tight">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
