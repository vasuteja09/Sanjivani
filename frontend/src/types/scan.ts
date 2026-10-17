export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export interface Finding {
  id: string;
  scan_id: string;
  rule_id: string | null;
  title: string;
  severity: SeverityLevel;
  category: string | null;
  file_path: string | null;
  start_line: number | null;
  end_line: number | null;
  cwe: string | null;
  confidence: string | null;
  scanner_name: string;
  description: string | null;
  recommendation: string | null;
  evidence: string | null;
}

export interface ScanSummary {
  id: string;
  file_name: string;
  language: string;
  scanner_name: string;
  scan_status: string;
  scan_timestamp: string;
  duration_ms: number;
  total_findings: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  info_count: number;
}

export interface ScanDetail extends ScanSummary {
  findings: Finding[];
}

export interface AIExplanation {
  finding_id: string;
  ai_available: boolean;
  vulnerability_explanation: string;
  impact: string;
  remediation_approach: string;
  safe_code_example?: string | null;
  limitations?: string | null;
  disclaimer: string;
  fallback_reason?: string | null;
}

export interface AIFixResponse {
  finding_id: string;
  ai_available: boolean;
  original_snippet: string;
  suggested_code: string;
  explanation_of_changes: string;
  limitations?: string | null;
  disclaimer: string;
  fallback_reason?: string | null;
}

export interface RescanComparison {
  previous_scan_id: string;
  new_scan_id: string;
  resolved_findings: string[];
  persisting_findings: string[];
  new_findings: string[];
  new_scan: ScanDetail;
  message: string;
}

export interface SystemHealth {
  status: string;
  version: string;
  ai_configured: boolean;
  scanner_available: boolean;
  timestamp: string;
}

export interface ScannerStatus {
  scanner_available: boolean;
  scanner_name: string;
  scanner_version: string;
  supported_languages: string[];
  max_upload_size_mb: number;
  scan_timeout_seconds: number;
}

export interface EducationalSample {
  id: string;
  file_name: string;
  title: string;
  category: string;
  language: string;
  description: string;
  code?: string;
}
