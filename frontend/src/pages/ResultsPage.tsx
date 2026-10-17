import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  Zap,
  Search,
  Filter,
  ArrowUpDown,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  X,
  Code2,
  Wrench,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { scanService } from '../services/scanService';
import { aiService } from '../services/aiService';
import { ScanDetail, Finding, AIExplanation } from '../types/scan';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';

export const ResultsPage: React.FC = () => {
  const { scanId } = useParams<{ scanId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [scan, setScan] = useState<ScanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);

  // Filters & search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverities, setSelectedSeverities] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // AI Explanation state
  const [aiExplanation, setAiExplanation] = useState<AIExplanation | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    if (scanId) {
      loadScanDetails(scanId);
    }
  }, [scanId]);

  const loadScanDetails = async (id: string) => {
    try {
      setLoading(true);
      const data = await scanService.getScan(id);
      setScan(data);
      if (data.findings && data.findings.length > 0) {
        setSelectedFinding(data.findings[0]);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load scan report', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFinding = (finding: Finding) => {
    setSelectedFinding(finding);
    setAiExplanation(null);
  };

  const handleExplainAI = async () => {
    if (!selectedFinding) return;
    try {
      setLoadingAI(true);
      const result = await aiService.explainFinding(selectedFinding.id);
      setAiExplanation(result);
      if (result.ai_available) {
        showToast('AI explanation generated', 'success');
      } else {
        showToast('Rule-based explanation provided (AI unconfigured)', 'info');
      }
    } catch (err: any) {
      showToast(err.message || 'AI explanation request failed', 'error');
    } finally {
      setLoadingAI(false);
    }
  };

  // Filtered findings calculation
  const filteredFindings = useMemo(() => {
    if (!scan) return [];
    return scan.findings.filter((f) => {
      // Search match
      const matchSearch =
        !searchTerm ||
        f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.rule_id && f.rule_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (f.category && f.category.toLowerCase().includes(searchTerm.toLowerCase()));

      // Severity match
      const matchSeverity =
        selectedSeverities.length === 0 || selectedSeverities.includes(f.severity.toUpperCase());

      // Category match
      const matchCategory =
        selectedCategory === 'ALL' || f.category === selectedCategory;

      return matchSearch && matchSeverity && matchCategory;
    });
  }, [scan, searchTerm, selectedSeverities, selectedCategory]);

  const allCategories = useMemo(() => {
    if (!scan) return [];
    const set = new Set<string>();
    scan.findings.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return Array.from(set);
  }, [scan]);

  const toggleSeverityFilter = (sev: string) => {
    setSelectedSeverities((prev) =>
      prev.includes(sev) ? prev.filter((s) => s !== sev) : [...prev, sev]
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm text-slate-500 font-medium">Loading scan report...</p>
      </div>
    );
  }

  if (!scan) {
    return (
      <EmptyState
        title="Scan Report Not Found"
        description="The requested scan ID does not exist or was deleted."
        actionText="Back to Scans"
        onAction={() => navigate('/history')}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 7.1 Scan Summary Metadata Banner */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold">
                {scan.id}
              </span>
              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium capitalize">
                {scan.language}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500">{new Date(scan.scan_timestamp).toLocaleString()}</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>{scan.file_name}</span>
            </h2>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-600">
            <div>
              <span className="text-slate-400">Scanner: </span>
              <span className="font-semibold text-slate-800">{scan.scanner_name}</span>
            </div>
            <div>
              <span className="text-slate-400">Scan Duration: </span>
              <span className="font-semibold text-slate-800">{scan.duration_ms} ms</span>
            </div>
          </div>
        </div>

        {/* Severity Metrics Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs font-semibold text-slate-500 mr-1">Total Findings: {scan.total_findings}</div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <span>Critical:</span>
            <span>{scan.critical_count}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
            <span>High:</span>
            <span>{scan.high_count}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <span>Medium:</span>
            <span>{scan.medium_count}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <span>Low:</span>
            <span>{scan.low_count}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
            <span>Info:</span>
            <span>{scan.info_count}</span>
          </span>
        </div>
      </div>

      {/* Main Content: Findings List & Details Panel */}
      {scan.total_findings === 0 ? (
        <div className="p-8 bg-white border border-slate-200 rounded-xl shadow-xs text-center">
          <div className="inline-flex p-3 bg-emerald-50 text-emerald-600 rounded-full mb-3">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">
            No vulnerabilities detected by configured checks
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            Bandit identified zero security weaknesses matching its rule set. Remember that static analysis tools do
            not guarantee code is completely bug-free or secure against all threat vectors.
          </p>
          <button
            onClick={() => navigate('/scanner')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
          >
            Scan Another File
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: 7.3 Findings Table & Filters */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 border-b border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search findings by rule, title, or category..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                  />
                </div>
                {allCategories.length > 0 && (
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
                  >
                    <option value="ALL">All Categories</option>
                    {allCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Severity check filters */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-medium mr-1">Filter Severity:</span>
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map((sev) => {
                  const active = selectedSeverities.includes(sev);
                  return (
                    <button
                      key={sev}
                      onClick={() => toggleSeverityFilter(sev)}
                      className={`px-2 py-0.5 rounded text-xs font-medium border transition ${
                        active
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {sev}
                    </button>
                  );
                })}
                {(selectedSeverities.length > 0 || searchTerm || selectedCategory !== 'ALL') && (
                  <button
                    onClick={() => {
                      setSelectedSeverities([]);
                      setSearchTerm('');
                      setSelectedCategory('ALL');
                    }}
                    className="text-xs text-blue-600 hover:underline ml-2"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Findings List Table */}
            <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
              {filteredFindings.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No findings match the current filter criteria.
                </div>
              ) : (
                filteredFindings.map((f) => {
                  const isSelected = selectedFinding?.id === f.id;
                  return (
                    <div
                      key={f.id}
                      onClick={() => handleSelectFinding(f)}
                      className={`p-4 transition cursor-pointer flex items-start justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-50/70 border-l-4 border-l-blue-600'
                          : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <SeverityBadge severity={f.severity} size="sm" />
                          <span className="font-mono text-xs text-slate-500 font-semibold">{f.rule_id}</span>
                          {f.start_line && (
                            <span className="text-xs text-slate-400">Line {f.start_line}</span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 truncate">{f.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">{f.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: 7.4 Finding Details Panel */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden sticky top-20">
            {selectedFinding ? (
              <div className="divide-y divide-slate-200">
                {/* Panel Header */}
                <div className="p-5 space-y-2">
                  <div className="flex items-center justify-between">
                    <SeverityBadge severity={selectedFinding.severity} size="md" />
                    <span className="text-xs font-mono font-medium text-slate-500">
                      Rule: {selectedFinding.rule_id}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{selectedFinding.title}</h3>
                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    {selectedFinding.category && (
                      <span className="px-2 py-0.5 bg-slate-100 rounded">Category: {selectedFinding.category}</span>
                    )}
                    {selectedFinding.cwe && (
                      <span className="px-2 py-0.5 bg-slate-100 rounded">CWE: {selectedFinding.cwe}</span>
                    )}
                    {selectedFinding.confidence && (
                      <span className="px-2 py-0.5 bg-slate-100 rounded">
                        Confidence: {selectedFinding.confidence}
                      </span>
                    )}
                    {selectedFinding.start_line && (
                      <span className="px-2 py-0.5 bg-slate-100 rounded">
                        Line: {selectedFinding.start_line}
                      </span>
                    )}
                  </div>
                </div>

                {/* Evidence Code Snippet */}
                {selectedFinding.evidence && (
                  <div className="p-5 bg-slate-900 text-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Code2 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Evidence Snippet (Secrets Redacted)</span>
                      </span>
                      <span>Line {selectedFinding.start_line}</span>
                    </div>
                    <pre className="text-xs font-mono p-3 bg-slate-950/80 rounded-lg overflow-x-auto text-emerald-400 whitespace-pre-wrap break-all border border-slate-800">
                      {selectedFinding.evidence}
                    </pre>
                  </div>
                )}

                {/* Problem & Impact Details */}
                <div className="p-5 space-y-4 text-xs">
                  <div>
                    <h5 className="font-bold text-slate-900 uppercase tracking-wider mb-1">
                      What is the problem?
                    </h5>
                    <p className="text-slate-600 leading-relaxed">{selectedFinding.description}</p>
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-900 uppercase tracking-wider mb-1">
                      How should it be fixed?
                    </h5>
                    <p className="text-slate-600 leading-relaxed">{selectedFinding.recommendation}</p>
                  </div>

                  {/* AI Explanation Section */}
                  <div className="pt-2">
                    {!aiExplanation ? (
                      <button
                        onClick={handleExplainAI}
                        disabled={loadingAI}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition shadow-xs text-xs"
                      >
                        {loadingAI ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Requesting AI Analysis...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Explain with AI</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 font-bold text-blue-900">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            <span>AI Security Assessment</span>
                          </span>
                          <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-200 text-blue-800">
                            {aiExplanation.ai_available ? 'AI-Generated' : 'Rule-Based Fallback'}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed font-normal">
                          {aiExplanation.vulnerability_explanation}
                        </p>
                        <div className="text-[11px] text-slate-600">
                          <span className="font-semibold text-slate-800">Potential Impact: </span>
                          <span>{aiExplanation.impact}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 italic">
                          {aiExplanation.disclaimer}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action to Remediate */}
                  <button
                    onClick={() => {
                      navigate(`/remediation?scanId=${scan.id}&findingId=${selectedFinding.id}`);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition text-xs shadow-xs"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Launch AI Remediation Assistant</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                Select a finding from the list to view vulnerability details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
