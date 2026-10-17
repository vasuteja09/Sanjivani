import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ScanSearch,
  BookOpen,
  ShieldAlert,
  Bug,
  History,
  Clock,
  ArrowRight,
  Code2,
  CheckCircle2,
  FileCode2,
  Layers
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { scanService } from '../services/scanService';
import { ScanSummary } from '../types/scan';
import { SeverityBadge } from '../components/ui/SeverityBadge';
import { EmptyState } from '../components/ui/EmptyState';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await scanService.listScans(0, 10);
      setScans(data);
    } catch (err) {
      console.error('Failed to load scans:', err);
    } finally {
      setLoading(false);
    }
  };

  // Metrics from real backend data
  const totalScans = scans.length;
  const totalFindings = scans.reduce((acc, s) => acc + s.total_findings, 0);
  const highAndCritFindings = scans.reduce(
    (acc, s) => acc + s.critical_count + s.high_count,
    0
  );
  const lastScan = scans.length > 0 ? new Date(scans[0].scan_timestamp).toLocaleString() : 'No scans yet';

  // Aggregate findings by severity from actual completed scans
  const severityData = [
    { name: 'Critical', count: scans.reduce((a, s) => a + s.critical_count, 0), color: '#DC2626' },
    { name: 'High', count: scans.reduce((a, s) => a + s.high_count, 0), color: '#EA580C' },
    { name: 'Medium', count: scans.reduce((a, s) => a + s.medium_count, 0), color: '#D97706' },
    { name: 'Low', count: scans.reduce((a, s) => a + s.low_count, 0), color: '#2563EB' },
    { name: 'Info', count: scans.reduce((a, s) => a + s.info_count, 0), color: '#64748B' },
  ];

  const hasFindings = severityData.some((d) => d.count > 0);

  const getHighestSeverity = (scan: ScanSummary) => {
    if (scan.critical_count > 0) return 'CRITICAL';
    if (scan.high_count > 0) return 'HIGH';
    if (scan.medium_count > 0) return 'MEDIUM';
    if (scan.low_count > 0) return 'LOW';
    if (scan.info_count > 0) return 'INFO';
    return 'CLEAN';
  };

  return (
    <div className="space-y-6">
      {/* 5.1 Welcome Hero Banner */}
      <section className="p-6 md:p-8 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-2xl text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-xs rounded-full text-xs font-semibold tracking-wide uppercase mb-3">
            <Code2 className="w-3.5 h-3.5" />
            <span>Developer Security Platform</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">
            Secure your code before it ships.
          </h2>
          <p className="text-blue-100 text-sm md:text-base leading-relaxed mb-6 max-w-2xl">
            Find potential security vulnerabilities, understand their impact, and explore safer implementations
            with static analysis and AI-assisted remediation.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/scanner')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-blue-700 font-semibold rounded-lg hover:bg-blue-50 transition shadow-sm text-sm"
            >
              <ScanSearch className="w-4 h-4" />
              <span>Scan Your Code</span>
            </button>
            <button
              onClick={() => navigate('/guide')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-800/60 hover:bg-blue-800/90 text-white font-medium rounded-lg border border-blue-400/30 transition text-sm"
            >
              <BookOpen className="w-4 h-4" />
              <span>Explore Security Guide</span>
            </button>
          </div>
        </div>
      </section>

      {/* 5.2 Summary Metric Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/history')}
          className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-blue-300 hover:shadow-sm transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Scans</span>
            <History className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalScans}</div>
          <p className="text-xs text-slate-400 mt-1">Completed audit runs</p>
        </div>

        <div
          onClick={() => navigate('/history')}
          className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-amber-300 hover:shadow-sm transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Findings</span>
            <Bug className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalFindings}</div>
          <p className="text-xs text-slate-400 mt-1">Static analysis detections</p>
        </div>

        <div
          onClick={() => navigate('/history')}
          className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-red-300 hover:shadow-sm transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">High & Critical</span>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">{highAndCritFindings}</div>
          <p className="text-xs text-slate-400 mt-1">High priority security flaws</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Last Scan</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-sm font-semibold text-slate-800 truncate" title={lastScan}>
            {lastScan}
          </div>
          <p className="text-xs text-slate-400 mt-1">Most recent audit timestamp</p>
        </div>
      </section>

      {/* 5.3 & 5.5 Chart and Quick Action */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Chart */}
        <div className="lg:col-span-2 p-5 bg-white border border-slate-200 rounded-xl shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Vulnerability Findings by Severity
              </h3>
              <p className="text-xs text-slate-500">Distribution of issues detected by static analysis engines</p>
            </div>
          </div>

          <div className="flex-1 min-h-[220px]">
            {hasFindings ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={severityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '8px',
                      border: '1px solid #E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {severityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-8 text-center text-slate-400">
                <Layers className="w-8 h-8 mb-2 text-slate-300" />
                <p className="text-sm font-medium text-slate-600">No scan findings to display</p>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Run a scan using the source code analyzer to view severity distribution metrics.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 5.5 Quick Action Card */}
        <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg inline-block mb-3">
              <ScanSearch className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold tracking-tight mb-2">Ready to inspect your code?</h3>
            <p className="text-slate-300 text-xs leading-relaxed mb-4">
              Paste a code snippet or upload a supported source file to identify potential SQL injection, command
              execution, or exposed secret weaknesses.
            </p>
          </div>
          <button
            onClick={() => navigate('/scanner')}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition shadow-xs"
          >
            <span>Start New Scan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 5.4 Recent Scan Activity Table */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Recent Scan Activity</h3>
            <p className="text-xs text-slate-500">Latest static analysis security assessments</p>
          </div>
          {scans.length > 0 && (
            <Link
              to="/history"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              <span>View All History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {scans.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={FileCode2}
              title="No scans yet"
              description="Analyze a vulnerable code sample or upload a Python script to start tracking findings and remediations."
              actionText="Load Educational Sample in Scanner"
              onAction={() => navigate('/scanner?sample=insecure_sql')}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Scan ID</th>
                  <th className="px-5 py-3">File Name</th>
                  <th className="px-5 py-3">Language</th>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Total Findings</th>
                  <th className="px-5 py-3">Highest Severity</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scans.map((s) => {
                  const highestSev = getHighestSeverity(s);
                  return (
                    <tr
                      key={s.id}
                      onClick={() => navigate(`/results/${s.id}`)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-slate-600 font-semibold">{s.id}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">{s.file_name}</td>
                      <td className="px-5 py-3 text-xs capitalize text-slate-600">{s.language}</td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {new Date(s.scan_timestamp).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-800">{s.total_findings}</td>
                      <td className="px-5 py-3">
                        {highestSev === 'CLEAN' ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>No Findings</span>
                          </span>
                        ) : (
                          <SeverityBadge severity={highestSev} />
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                          {s.scan_status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/results/${s.id}`);
                          }}
                          className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
