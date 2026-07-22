import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../controllers/authHooks.js';
import { NAV_BY_ROLE } from '../routes/navConfig';
import logo from '../assets/logo.jpg';

// Global navigation shell — role-aware.
// Mobile-first: top bar (Navy) with a hamburger that opens a drawer; the
// desktop sidebar (Navy, persistent) appears at lg. Active state = Yellow.
//
// Phase 2: the in-shell role-switcher is gone — role now comes from a real
// login (Login.jsx → useAuth.loginWithCredentials). To change role, sign out
// and sign back in as a different account.
export default function NavShell({ children }) {
  const { user, role, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const items = NAV_BY_ROLE[role] ?? [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    [
      'flex items-center gap-3 px-3 py-2 rounded-nested text-sm font-medium transition-colors',
      isActive
        ? 'bg-secondary text-primary-900'
        : 'text-white/80 hover:bg-primary-600 hover:text-white',
    ].join(' ');

  const Brand = (
    <div className="flex items-center gap-2">
      <img src={logo} alt="JBLCF-B Logo" className="w-10 h-10 rounded-full object-cover shrink-0 bg-white" />
      <div className="leading-tight">
        <p className="text-white font-semibold text-sm">JBLCF-B</p>
        <p className="text-white/60 text-xs">Attendance</p>
      </div>
    </div>
  );

  return (
    <div className="h-svh bg-base flex overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-primary border-r border-primary-800/50 shadow-2xl">
        <div className="h-16 flex items-center px-4 border-b border-primary-800/50 shrink-0">
          {Brand}
        </div>
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/admin'} className={linkClass}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="opacity-80">
                <path d={item.icon} />
              </svg>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-primary-800/50 shrink-0">
          {user && (
            <div className="mb-3 px-2">
              <p className="text-sm font-semibold text-white">{user.fullName}</p>
              <p className="text-xs text-white/60 capitalize">{user.role}</p>
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-nested text-sm font-medium text-white/80 hover:bg-error/20 hover:text-error-light transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (Sheet) */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-primary-900/40 backdrop-blur-sm transition-opacity" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
          <div className="relative flex flex-col w-[280px] max-w-[80%] bg-primary shadow-2xl h-full animate-in slide-in-from-left duration-300">
            <div className="h-16 flex items-center justify-between px-4 border-b border-primary-800/50 shrink-0">
              {Brand}
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close navigation"
                className="p-2 -mr-2 text-white/80 hover:text-secondary rounded-nested focus-visible:outline focus-visible:outline-secondary"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
              {items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.to === '/admin'} onClick={() => setDrawerOpen(false)} className={linkClass}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="opacity-80">
                    <path d={item.icon} />
                  </svg>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-primary-800/50 shrink-0">
              {user && (
                <div className="mb-3 px-2">
                  <p className="text-sm font-semibold text-white">{user.fullName}</p>
                  <p className="text-xs text-white/60 capitalize">{user.role}</p>
                </div>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-nested text-sm font-medium text-white/80 hover:bg-error/20 hover:text-error-light transition-colors focus-visible:outline focus-visible:outline-secondary"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 shrink-0 bg-primary text-white flex items-center px-4 shadow-card z-40">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="p-2 -ml-2 mr-3 rounded-nested hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-secondary"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          {Brand}
        </header>

        <main className="flex-1 overflow-y-auto bg-surface relative">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
