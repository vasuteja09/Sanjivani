import React, { useEffect, useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Sparkles,
  Lock,
  Server,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Info
} from 'lucide-react';
import { systemService } from '../services/systemService';
import { SystemHealth, ScannerStatus } from '../types/scan';
import { useToast } from '../components/ui/Toast';

export const SettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    try {
      setLoading(true);
      const [h, s] = await Promise.all([
        systemService.getHealth(),
        systemService.getScannerStatus(),
      ]);
      setHealth(h);
      setScannerStatus(s);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch settings status', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>Platform Settings & Diagnostics</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Real runtime configuration, static engine capabilities, and privacy transparency disclosures.
          </p>
        </div>
        <button
          onClick={loadSettingsData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 13.1 Scanner Engine Settings */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Cpu className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Static Analysis Scanner
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Backend Connection</span>
              <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Connected (127.0.0.1:8000)</span>
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Primary Engine</span>
              <span className="font-semibold text-slate-800">
                {scannerStatus?.scanner_name || 'Bandit Security Linter'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Engine Version</span>
              <span className="font-mono text-slate-700 font-medium">
                {scannerStatus?.scanner_version || '1.9.4'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Supported Languages</span>
              <span className="font-semibold text-blue-700">Python (.py)</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Max Upload File Size</span>
              <span className="font-medium text-slate-700">
                {scannerStatus?.max_upload_size_mb || 1} MB
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500">Execution Timeout</span>
              <span className="font-medium text-slate-700">
                {scannerStatus?.scan_timeout_seconds || 30} seconds
              </span>
            </div>
          </div>
        </div>

        {/* 13.2 AI Integration Settings */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              AI Remediation Engine
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Integration Status</span>
              {health?.ai_configured ? (
                <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>AI Configured (Active)</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 font-semibold text-amber-700">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Rule Fallback (Key Not Set)</span>
                </span>
              )}
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Provider Compatibility</span>
              <span className="font-semibold text-slate-800">OpenAI Compatible (REST)</span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Default Model</span>
              <span className="font-mono text-slate-700">gpt-4o-mini</span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-slate-500">API Key Masking</span>
              <span className="font-mono text-slate-400">••••••••••••••••</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">How to configure AI assistance:</div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Add <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">AI_API_KEY</code> and{' '}
              <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">AI_MODEL</code> in the backend{' '}
              <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-mono">.env</code> file, then restart the
              backend server.
            </p>
          </div>
        </div>
      </div>

      {/* 13.3 Privacy & Data Security Policy Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Lock className="w-5 h-5 text-teal-600" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Privacy & Source Code Security Safeguards
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-lg space-y-1.5">
            <div className="font-bold text-slate-900">Zero Source Code Retention</div>
            <p className="text-slate-500 leading-relaxed">
              Uploaded and pasted source files are processed in volatile temporary sandbox files and unlinked immediately
              after static analysis completes. Full source files are never stored in the database.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-lg space-y-1.5">
            <div className="font-bold text-slate-900">Automatic Secret Redaction</div>
            <p className="text-slate-500 leading-relaxed">
              All credentials, API keys (AWS, OpenAI), and passwords detected in code evidence are masked as{' '}
              <span className="font-mono text-slate-800">[REDACTED]</span> before persistence or transmission to any AI
              service.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-lg space-y-1.5">
            <div className="font-bold text-slate-900">Complete Data Ownership</div>
            <p className="text-slate-500 leading-relaxed">
              All audit records reside in a local SQLite file (<code className="font-mono">sanjivani.db</code>). You can
              delete any individual scan report or wipe history permanently at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
