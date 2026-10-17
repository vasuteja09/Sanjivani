import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  FileCode2,
  AlertTriangle,
  Loader2,
  Clock
} from 'lucide-react';
import { scanService } from '../services/scanService';
import { ScanSummary } from '../types/scan';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../components/ui/Toast';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await scanService.listScans(0, 100);
      setScans(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to load scan history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(`Permanently delete scan record for "${fileName}" (${id})?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await scanService.deleteScan(id);
      setScans((prev) => prev.filter((s) => s.id !== id));
      showToast('Scan record and associated findings deleted', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete scan record', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const getHighestSeverity = (scan: ScanSummary) => {
    if (scan.critical_count > 0) return 'CRITICAL';
    if (scan.high_count > 0) return 'HIGH';
    if (scan.medium_count > 0) return 'MEDIUM';
    if (scan.low_count > 0) return 'LOW';
    if (scan.info_count > 0) return 'INFO';
    return 'CLEAN';
  };

  const filteredScans = useMemo(() => {
    return scans.filter((s) => {
      const matchSearch =
        !searchTerm ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.file_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLang = selectedLanguage === 'ALL' || s.language === selectedLanguage;
      return matchSearch && matchLang;
    });
  }, [scans, searchTerm, selectedLanguage]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>Scan History</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit logs and vulnerability findings persisted in SQLite database.
          </p>
        </div>
        <button
          onClick={() => navigate('/scanner')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition shadow-xs"
        >
          New Scan
        </button>
      </div>

      {/* Filter & Search Bar */}
      {scans.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter by filename or scan ID..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Language:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none"
            >
              <option value="ALL">All Languages</option>
              <option value="python">Python</option>
            </select>
          </div>
        </div>
      )}

      {/* History Table or Empty State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-200 rounded-xl shadow-xs">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600 mb-2" />
          <p className="text-xs text-slate-500">Loading audit history from database...</p>
        </div>
      ) : scans.length === 0 ? (
        <div className="p-8 bg-white border border-slate-200 rounded-xl shadow-xs">
          <EmptyState
            icon={History}
            title="Your scan history is empty."
            description="Analyze your first code sample to start tracking security findings and improvements."
            actionText="Start Your First Scan"
            onAction={() => navigate('/scanner')}
          />
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Scan ID</th>
                  <th className="px-5 py-3">Target File</th>
                  <th className="px-5 py-3">Language</th>
                  <th className="px-5 py-3">Scan Date</th>
                  <th className="px-5 py-3">Findings</th>
                  <th className="px-5 py-3">Highest Severity</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredScans.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-8 text-center text-xs text-slate-400">
                      No scans match the search filter.
                    </td>
                  </tr>
                ) : (
                  filteredScans.map((s) => {
                    const highestSev = getHighestSeverity(s);
                    const isDeleting = deletingId === s.id;
                    return (
                      <tr
                        key={s.id}
                        onClick={() => navigate(`/results/${s.id}`)}
                        className="hover:bg-slate-50/80 transition cursor-pointer"
                      >
                        <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-600">
                          {s.id}
                        </td>
                        <td className="px-5 py-3 font-medium text-slate-800 flex items-center gap-1.5">
                          <FileCode2 className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[200px]">{s.file_name}</span>
                        </td>
                        <td className="px-5 py-3 text-xs capitalize text-slate-600">{s.language}</td>
                        <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(s.scan_timestamp).toLocaleString()}
                        </td>
                        <td className="px-5 py-3 font-semibold text-slate-800">{s.total_findings}</td>
                        <td className="px-5 py-3">
                          {highestSev === 'CLEAN' ? (
                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Clean</span>
                            </span>
                          ) : (
                            <SeverityBadge severity={highestSev} />
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-500 font-mono">{s.duration_ms} ms</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/results/${s.id}`);
                              }}
                              className="px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                            >
                              Report
                            </button>
                            <button
                              onClick={(e) => handleDelete(s.id, s.file_name, e)}
                              disabled={isDeleting}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                              title="Delete scan record"
                            >
                              {isDeleting ? (
                                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
