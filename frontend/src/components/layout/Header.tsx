import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Menu, HelpCircle, Sparkles, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { systemService } from '../../services/systemService';
import { SystemHealth } from '../../types/scan';

interface Props {
  onOpenMobile: () => void;
}

export const Header: React.FC<Props> = ({ onOpenMobile }) => {
  const location = useLocation();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await systemService.getHealth();
      setHealth(data);
    } catch (err) {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Application Overview';
    if (path.startsWith('/scanner')) return 'Source Code Scanner';
    if (path.startsWith('/results')) return 'Vulnerability Findings Report';
    if (path.startsWith('/remediation')) return 'AI Remediation Assistant';
    if (path.startsWith('/history')) return 'Scan History';
    if (path.startsWith('/guide')) return 'Security Knowledge Guide';
    if (path.startsWith('/settings')) return 'Platform Settings';
    return 'Dashboard';
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-6 bg-white/95 backdrop-blur-xs border-b border-slate-200">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={onOpenMobile}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg md:hidden transition"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight leading-tight">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Service status indicators */}
      <div className="flex items-center gap-2.5 md:gap-4">
        {/* Static analysis engine status */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border bg-slate-50 border-slate-200 text-slate-700"
          title={health?.scanner_available ? 'Bandit static scanner is online and ready' : 'Scanner offline or unavailable'}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              health?.scanner_available ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="hidden sm:inline">Engine:</span>
          <span className="font-semibold">{health?.scanner_available ? 'Bandit Online' : 'Scanner Offline'}</span>
        </div>

        {/* AI status indicator */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border bg-slate-50 border-slate-200 text-slate-700"
          title={health?.ai_configured ? 'AI assistance configured (OpenAI-compatible)' : 'Rule-based fallback active (AI key not set)'}
        >
          <Sparkles className={`w-3.5 h-3.5 ${health?.ai_configured ? 'text-blue-600' : 'text-amber-500'}`} />
          <span className="hidden sm:inline">AI:</span>
          <span className="font-semibold">{health?.ai_configured ? 'Enabled' : 'Rule Fallback'}</span>
        </div>

        {/* Help Link */}
        <Link
          to="/guide"
          className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
          title="Security Reference Guide"
        >
          <HelpCircle className="w-5 h-5" />
        </Link>
      </div>
    </header>
  );
};
