import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ScanSearch,
  History,
  BookOpen,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface Props {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<Props> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/scanner', label: 'Scan Code', icon: ScanSearch },
    { to: '/history', label: 'Scan History', icon: History },
    { to: '/guide', label: 'Security Guide', icon: BookOpen },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen z-50 flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out shrink-0 ${
          collapsed ? 'w-18' : 'w-64'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-600 text-white shadow-xs shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-base font-bold text-slate-900 tracking-tight leading-none truncate">
                  Sanjivani AI
                </span>
                <span className="text-xs text-slate-500 font-medium tracking-normal mt-0.5 truncate">
                  Write Safer Code
                </span>
              </div>
            )}
          </div>
          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex items-center justify-center w-7 h-7 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Educational Banner / Info */}
        {!collapsed && (
          <div className="p-4 m-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 mb-1">
              <span>Security Tip</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Never rely solely on LLMs or simple regex for security checks. Static analysis provides deterministic detection.
            </p>
          </div>
        )}
      </aside>
    </>
  );
};
