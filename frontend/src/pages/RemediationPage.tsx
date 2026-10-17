import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  Wrench,
  ArrowLeft,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  Loader2,
  FileCode2,
  Info
} from 'lucide-react';
import { scanService } from '../services/scanService';
import { aiService } from '../services/aiService';
import { ScanDetail, Finding, AIFixResponse, RescanComparison } from '../types/scan';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { useToast } from '../components/ui/Toast';

export const RemediationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const scanId = searchParams.get('scanId');
  const findingId = searchParams.get('findingId');

  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [finding, setFinding] = useState<Finding | null>(null);
  const [loading, setLoading] = useState(true);

  // Suggested Fix state
  const [loadingFix, setLoadingFix] = useState(false);
  const [aiFix, setAiFix] = useState<AIFixResponse | null>(null);
  const [editableCode, setEditableCode] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Rescan results state
  const [rescanning, setRescanning] = useState(false);
  const [rescanDiff, setRescanDiff] = useState<RescanComparison | null>(null);

  useEffect(() => {
    if (scanId && findingId) {
      loadContext(scanId, findingId);
    } else {
      setLoading(false);
    }
  }, [scanId, findingId]);

  const loadContext = async (sId: string, fId: string) => {
    try {
      setLoading(true);
      const scanData = await scanService.getScan(sId);
      setScan(scanData);

      const targetFinding = scanData.findings.find((f) => f.id === fId);
      if (targetFinding) {
        setFinding(targetFinding);
        // Automatically fetch AI / Rule-based suggestion
        fetchRemediation(targetFinding);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load remediation context', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRemediation = async (f: Finding) => {
    try {
      setLoadingFix(true);
      const contextCode = f.evidence || f.description || '# Code context';
      const result = await aiService.suggestFix(f.id, contextCode);
      setAiFix(result);
      setEditableCode(result.suggested_code);
    } catch (err: any) {
      showToast(err.message || 'Failed to generate fix suggestion', 'error');
    } finally {
      setLoadingFix(false);
    }
  };

  const handleCopy = () => {
    if (!editableCode) return;
    navigator.clipboard.writeText(editableCode);
    setCopied(true);
    showToast('Suggested code copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRescan = async () => {
    if (!scanId || !editableCode.trim()) {
      showToast('No code available to rescan', 'warning');
      return;
    }

    try {
      setRescanning(true);
      const comparison = await scanService.rescanCode(scanId, editableCode);
      setRescanDiff(comparison);
      showToast('Rescan complete! Compare results below.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Rescan failed', 'error');
    } finally {
      setRescanning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm text-slate-500 font-medium">Loading remediation workspace...</p>
      </div>
    );
  }

  if (!scan || !finding) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-xl shadow-xs">
        <h3 className="text-base font-bold text-slate-800 mb-2">No Finding Selected</h3>
        <p className="text-xs text-slate-500 mb-4">Please select a finding from the scan results report.</p>
        <button
          onClick={() => navigate('/history')}
          className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          View Scan Reports
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to={`/results/${scan.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Findings Report</span>
        </Link>
        <span className="text-xs font-mono text-slate-400">Scan ID: {scan.id}</span>
      </div>

      {/* Target Finding Banner */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SeverityBadge severity={finding.severity} size="sm" />
            <span className="font-mono text-xs font-semibold text-slate-500">{finding.rule_id}</span>
            {finding.start_line && (
              <span className="text-xs text-slate-400">• Line {finding.start_line}</span>
            )}
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
            Engine: {finding.scanner_name}
          </span>
        </div>
        <h2 className="text-base font-bold text-slate-900">{finding.title}</h2>
        <p className="text-xs text-slate-600 leading-relaxed">{finding.description}</p>
      </div>

      {/* 8.1 Side-by-Side Comparison Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Original Code Snippet */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 bg-red-50/70 border-b border-red-100 text-xs font-medium text-red-900">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>Original Vulnerable Code</span>
            </span>
            <span className="font-mono text-red-700">Line {finding.start_line}</span>
          </div>
          <div className="p-4 bg-slate-900 flex-1 min-h-[280px]">
            <pre className="text-xs font-mono text-red-300 whitespace-pre-wrap break-all leading-relaxed">
              {finding.evidence || '# No evidence code recorded'}
            </pre>
          </div>
          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
            Identified by Bandit rule {finding.rule_id}. Untrusted inputs should be sanitized or parameterized.
          </div>
        </div>

        {/* Right: Suggested Fix */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50/70 border-b border-emerald-100 text-xs font-medium text-emerald-900">
            <span className="flex items-center gap-1.5 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Suggested Safer Implementation</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {aiFix?.ai_available ? 'AI Synthesized' : 'Rule-Based Pattern'}
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-emerald-200 text-emerald-800 text-xs transition"
                title="Copy suggested code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handleRescan}
                disabled={rescanning || !editableCode.trim()}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition shadow-xs disabled:bg-blue-300"
                title="Rescan with this fix"
              >
                {rescanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-white" />}
                <span>Rescan</span>
              </button>
            </div>
          </div>

          <div className="relative flex-1 min-h-[280px]">
            {loadingFix ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                <p className="text-xs text-slate-500 font-medium">Generating secure remediation...</p>
              </div>
            ) : (
              <Editor
                height="280px"
                defaultLanguage="python"
                value={editableCode}
                onChange={(val) => setEditableCode(val || '')}
                theme="light"
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  fontFamily: 'JetBrains Mono, monospace',
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  tabSize: 4,
                  padding: { top: 10, bottom: 10 },
                }}
              />
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <span>You can edit this code above before rescanning.</span>
            <button
              onClick={() => fetchRemediation(finding)}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Regenerate</span>
            </button>
          </div>
        </div>
      </div>

      {/* 8.2 Explanation of Changes & Limitations */}
      {aiFix && (
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Remediation Breakdown</span>
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed">{aiFix.explanation_of_changes}</p>
          {aiFix.limitations && (
            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-lg text-xs text-amber-900 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Limitations & Assumptions: </span>
                <span>{aiFix.limitations}</span>
              </div>
            </div>
          )}
          <div className="text-[11px] text-slate-400 italic">{aiFix.disclaimer}</div>
        </div>
      )}

      {/* 8.4 Rescan Workflow Action Card */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Verify Fix with Rescan</h3>
            <p className="text-xs text-slate-500">
              Run static analysis on the remediated code to verify whether the vulnerability is resolved.
            </p>
          </div>
          <button
            onClick={handleRescan}
            disabled={rescanning || !editableCode.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-xs font-semibold rounded-lg transition shadow-xs cursor-pointer"
          >
            {rescanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Rescanning...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Rescan Corrected Code</span>
              </>
            )}
          </button>
        </div>

        {/* Rescan Comparison Report */}
        {rescanDiff && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Rescan Comparison Report
              </span>
              <button
                onClick={() => navigate(`/results/${rescanDiff.new_scan_id}`)}
                className="text-xs text-blue-600 font-semibold hover:underline"
              >
                Open Full New Report →
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium">{rescanDiff.message}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {/* Resolved */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>No Longer Detected ({rescanDiff.resolved_findings.length})</span>
                </div>
                {rescanDiff.resolved_findings.length === 0 ? (
                  <p className="text-[11px] text-emerald-600 italic">None resolved</p>
                ) : (
                  <ul className="text-xs text-emerald-900 list-disc list-inside space-y-0.5">
                    {rescanDiff.resolved_findings.map((item, idx) => (
                      <li key={idx} className="truncate">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Persisting */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Still Detected ({rescanDiff.persisting_findings.length})</span>
                </div>
                {rescanDiff.persisting_findings.length === 0 ? (
                  <p className="text-[11px] text-amber-600 italic">0 persisting issues</p>
                ) : (
                  <ul className="text-xs text-amber-900 list-disc list-inside space-y-0.5">
                    {rescanDiff.persisting_findings.map((item, idx) => (
                      <li key={idx} className="truncate">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* New Findings */}
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-1.5 text-red-800 font-bold text-xs mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>Newly Introduced ({rescanDiff.new_findings.length})</span>
                </div>
                {rescanDiff.new_findings.length === 0 ? (
                  <p className="text-[11px] text-red-600 italic">No new issues detected</p>
                ) : (
                  <ul className="text-xs text-red-900 list-disc list-inside space-y-0.5">
                    {rescanDiff.new_findings.map((item, idx) => (
                      <li key={idx} className="truncate">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 italic pt-1">
              Note: "No longer detected by configured checks" means the specific static rule conditions are no
              longer triggered. Always conduct integration testing and peer review before deploying to production.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
