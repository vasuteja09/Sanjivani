import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import {
  ScanSearch,
  Upload,
  Code2,
  Trash2,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  FileText,
  X,
  Play,
  Loader2,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { scanService } from '../services/scanService';
import { systemService } from '../services/systemService';
import { EducationalSample, ScannerStatus } from '../types/scan';
import { useToast } from '../components/ui/Toast';

export const ScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const [inputMode, setInputMode] = useState<'editor' | 'upload'>('editor');
  const [code, setCode] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<string>('python');
  const [samples, setSamples] = useState<EducationalSample[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('');
  const [scannerStatus, setScannerStatus] = useState<ScannerStatus | null>(null);
  const [scanning, setScanning] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [status, sampleList] = await Promise.all([
        systemService.getScannerStatus(),
        scanService.getSamples(),
      ]);
      setScannerStatus(status);
      setSamples(sampleList);

      // Check URL query for sample param
      const sampleParam = searchParams.get('sample');
      if (sampleParam && sampleList.some((s) => s.id === sampleParam)) {
        loadSample(sampleParam);
      }
    } catch (err) {
      console.error('Failed to load scanner status or samples:', err);
    }
  };

  const loadSample = async (sampleId: string) => {
    if (!sampleId) return;
    try {
      setSelectedSampleId(sampleId);
      setInputMode('editor');
      setSelectedFile(null);
      setValidationError(null);
      const sample = await scanService.getSampleContent(sampleId);
      setCode(sample.code || '');
      showToast(`Loaded sample: ${sample.title}`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to load sample', 'error');
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setValidationError(null);
    if (!file.name.endsWith('.py') && !file.name.endsWith('.pyw')) {
      setValidationError('Only Python source files (.py) are currently supported.');
      return;
    }
    if (file.size > 1024 * 1024) {
      setValidationError('File size exceeds the 1 MB limit.');
      return;
    }
    setSelectedFile(file);
    showToast(`File selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`, 'info');
  };

  const handleAnalyze = async () => {
    setValidationError(null);

    if (inputMode === 'editor' && !code.trim()) {
      setValidationError('Please enter or paste source code before running the analysis.');
      return;
    }

    if (inputMode === 'upload' && !selectedFile) {
      setValidationError('Please select or upload a supported Python (.py) file.');
      return;
    }

    try {
      setScanning(true);
      let scanResult;

      if (inputMode === 'upload' && selectedFile) {
        scanResult = await scanService.submitScanFile(selectedFile, language);
      } else {
        const fileName = selectedSampleId
          ? `${selectedSampleId}.py`
          : 'source_snippet.py';
        scanResult = await scanService.submitScanJson(code, fileName, language);
      }

      showToast(`Scan completed: ${scanResult.total_findings} finding(s) detected`, 'success');
      navigate(`/results/${scanResult.id}`);
    } catch (err: any) {
      setValidationError(err.message || 'Scanning failed. Please check backend connection.');
      showToast(err.message || 'Scanning failed', 'error');
    } finally {
      setScanning(false);
    }
  };

  const handleClear = () => {
    if (code.length > 50 && !window.confirm('Clear current code in editor?')) {
      return;
    }
    setCode('');
    setSelectedFile(null);
    setSelectedSampleId('');
    setValidationError(null);
  };

  return (
    <div className="space-y-6">
      {/* 6.1 Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ScanSearch className="w-5 h-5 text-blue-600" />
            <span>Scan Your Code</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Analyze source code for common security weaknesses and receive actionable remediation guidance.
          </p>
        </div>

        {/* Live scanner availability pill */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              scannerStatus?.scanner_available
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                scannerStatus?.scanner_available ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
            <span>
              {scannerStatus?.scanner_available
                ? `Engine: ${scannerStatus.scanner_name} (v${scannerStatus.scanner_version})`
                : 'Scanner Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
        {/* Input Mode Toggle */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setInputMode('editor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              inputMode === 'editor'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Paste / Edit Code</span>
          </button>
          <button
            onClick={() => setInputMode('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              inputMode === 'upload'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File</span>
          </button>
        </div>

        {/* Sample Library & Language Selection */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Sample Picker */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Try Sample:</span>
            <select
              value={selectedSampleId}
              onChange={(e) => loadSample(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">-- Choose Sample --</option>
              {samples.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="python">Python (Bandit)</option>
              <option value="javascript" disabled>
                JavaScript (Semgrep - Coming Soon)
              </option>
              <option value="typescript" disabled>
                TypeScript (Semgrep - Coming Soon)
              </option>
              <option value="java" disabled>
                Java (Coming Soon)
              </option>
            </select>
          </div>

          {/* Clear Button */}
          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition"
            title="Clear code"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Inline Validation Alert */}
      {validationError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-medium animate-in fade-in">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Input Area: Monaco Editor or File Upload */}
      {inputMode === 'editor' ? (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-600" />
              <span>Monaco Code Editor</span>
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <span>Lines: {code ? code.split('\n').length : 0}</span>
              <span>Chars: {code.length}</span>
            </div>
          </div>
          <div className="relative h-[420px] w-full">
            <Editor
              height="100%"
              defaultLanguage="python"
              language={language}
              value={code}
              onChange={(value) => {
                setCode(value || '');
                if (validationError) setValidationError(null);
              }}
              theme="light"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                tabSize: 4,
                padding: { top: 12, bottom: 12 },
              }}
            />
            {!code && (
              <div className="absolute top-12 left-16 pointer-events-none text-slate-400 text-xs font-mono select-none">
                # Paste Python source code here, or choose an educational sample above...
              </div>
            )}
          </div>
        </div>
      ) : (
        /* File Upload Option */
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className="flex flex-col items-center justify-center p-12 bg-white border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl transition text-center shadow-xs"
        >
          {selectedFile ? (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-left max-w-md w-full">
              <FileText className="w-8 h-8 text-blue-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-slate-900 truncate">{selectedFile.name}</div>
                <div className="text-xs text-slate-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Python Source
                </div>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                title="Remove file"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-full mb-3">
                <Upload className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Drag and drop source file here</h3>
              <p className="text-xs text-slate-500 mb-4 max-w-sm">
                Upload a Python source file (.py) up to 1 MB for static security analysis.
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer transition shadow-xs">
                <span>Select Source File</span>
                <input
                  type="file"
                  accept=".py,.pyw"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelected(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </>
          )}
        </div>
      )}

      {/* Scan Button Action Area */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs text-slate-500">
          Source code is analyzed in an isolated sandbox and never executed.
        </div>
        <button
          onClick={handleAnalyze}
          disabled={scanning}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition shadow-xs text-sm cursor-pointer disabled:cursor-not-allowed"
        >
          {scanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing Code...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Analyze Code</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
