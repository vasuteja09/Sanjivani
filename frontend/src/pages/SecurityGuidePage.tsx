import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Database,
  KeyRound,
  Terminal,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Code2,
  FileCheck
} from 'lucide-react';

interface GuideTopic {
  id: string;
  title: string;
  category: string;
  cwe: string;
  whatIsIt: string;
  whyItMatters: string;
  unsafeCode: string;
  safeCode: string;
  commonMistakes: string[];
  sampleId?: string;
}

const GUIDE_TOPICS: GuideTopic[] = [
  {
    id: 'sql-injection',
    title: 'SQL Injection & Parameterized Queries',
    category: 'Injection Flaws',
    cwe: 'CWE-89: SQL Injection',
    whatIsIt:
      'SQL injection occurs when untrusted user input is directly concatenated or formatted into a database query string instead of being passed as isolated parameter placeholders.',
    whyItMatters:
      'Attackers can inject malicious SQL syntax (such as "\' OR \'1\'=\'1") to bypass authentication, dump sensitive database tables, modify data, or execute arbitrary database commands.',
    unsafeCode: `# UNSAFE: Direct string formatting into SQL statement\nquery = f"SELECT * FROM users WHERE username = '{username}'"\ncursor.execute(query)`,
    safeCode: `# SAFE: Parameterized query placeholder prevents SQL injection\ncursor.execute("SELECT * FROM users WHERE username = ?", (username,))`,
    commonMistakes: [
      'Using str.format() or % string formatting instead of parameterized placeholders.',
      'Relying on basic string replacements (like escaping single quotes) instead of native parameterized drivers.',
      'Concatenating table or column names dynamically without strict whitelisting.',
    ],
    sampleId: 'insecure_sql',
  },
  {
    id: 'hardcoded-secrets',
    title: 'Hardcoded Secrets & Environment Variables',
    category: 'Credential Management',
    cwe: 'CWE-798: Use of Hard-coded Credentials',
    whatIsIt:
      'Hardcoding cryptographic keys, API tokens, database passwords, or private certificates directly into source code repositories.',
    whyItMatters:
      'Source code is routinely cloned, pushed to public or private version control systems, stored in backups, and exposed in build logs. Once leaked, credentials allow immediate unauthorized system access.',
    unsafeCode: `# UNSAFE: Plaintext credentials embedded in repository\nAWS_SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"\nDB_PASSWORD = "SuperSecretPassword123!"`,
    safeCode: `# SAFE: Load secrets dynamically from environment variables\nimport os\nAWS_SECRET_KEY = os.environ.get("AWS_SECRET_KEY")\nDB_PASSWORD = os.environ.get("DB_PASSWORD")`,
    commonMistakes: [
      'Committing .env files into git repositories instead of adding them to .gitignore.',
      'Logging configuration dictionaries or environment variables that contain secret keys.',
      'Assuming private GitHub or GitLab repositories are 100% immune to employee account compromises.',
    ],
    sampleId: 'hardcoded_secret',
  },
  {
    id: 'unsafe-command-execution',
    title: 'Unsafe Command Execution & Subprocess Isolation',
    category: 'Command Injection',
    cwe: 'CWE-78: OS Command Injection',
    whatIsIt:
      'Invoking system commands through a command shell (such as os.system() or subprocess.call(..., shell=True)) with unvalidated external user arguments.',
    whyItMatters:
      'Shell interpreters recognize separators like ";", "&&", and "|". An attacker can append additional arbitrary commands (e.g., "; rm -rf /" or reverse shell payloads) executed under the application process.',
    unsafeCode: `# UNSAFE: Shell expansion with string concatenation\nos.system("ping -c 1 " + user_ip)\nsubprocess.call("process " + filename, shell=True)`,
    safeCode: `# SAFE: shell=False with argument tokens array\nimport subprocess\nsubprocess.run(["ping", "-c", "1", user_ip], shell=False, check=True)`,
    commonMistakes: [
      'Setting shell=True because it looks simpler to pass a single string.',
      'Using string formatting without validating that parameters only contain expected characters (e.g. alphanumeric).',
      'Using partial binary names (e.g. "python") instead of resolved absolute executable paths.',
    ],
    sampleId: 'unsafe_command',
  },
  {
    id: 'eval-code-injection',
    title: 'Dangerous Dynamic Code Evaluation (eval / exec)',
    category: 'Code Injection',
    cwe: 'CWE-95: Improper Neutralization of Directives in Dynamically Evaluated Code',
    whatIsIt:
      'Executing arbitrary Python code passed as string arguments to eval(), exec(), or compile().',
    whyItMatters:
      'If an attacker controls any portion of the evaluated string, they can execute arbitrary Python statements, access built-in modules (__import__), and take over the server.',
    unsafeCode: `# UNSAFE: Evaluating user-provided string dynamically\nresult = eval(user_calculation_string)`,
    safeCode: `# SAFE: Use safe literal evaluation or dedicated mathematical parsers\nimport ast\nsafe_data = ast.literal_eval(safe_literal_string)`,
    commonMistakes: [
      'Assuming passing empty __builtins__ dictionary to eval() provides a secure sandbox (it is easily bypassed).',
      'Using eval() to parse JSON or dictionary representations instead of json.loads().',
    ],
  },
  {
    id: 'http-timeouts',
    title: 'Missing HTTP Timeouts & Denial of Service',
    category: 'Resource Management',
    cwe: 'CWE-400: Uncontrolled Resource Consumption',
    whatIsIt:
      'Making outgoing HTTP requests with libraries like requests without specifying an explicit timeout parameter.',
    whyItMatters:
      'By default, requests without timeouts wait indefinitely for the socket to close. If the remote service hangs or drops packets, the worker thread is permanently locked, leading to complete server starvation.',
    unsafeCode: `# UNSAFE: Request hangs indefinitely if host is unresponsive\nresponse = requests.get("https://api.external.com/data")`,
    safeCode: `# SAFE: Set connection and read timeouts\nresponse = requests.get("https://api.external.com/data", timeout=(3.05, 10))`,
    commonMistakes: [
      'Assuming high-level HTTP client libraries enforce default connection timeouts.',
      'Only handling successful HTTP status codes without catching requests.exceptions.Timeout.',
    ],
  },
  {
    id: 'path-traversal',
    title: 'Path Traversal & Unvalidated File Operations',
    category: 'File System Security',
    cwe: 'CWE-22: Path Traversal (Dot-Dot-Slash)',
    whatIsIt:
      'Constructing local file system paths by concatenating user-supplied filenames without stripping directory navigation sequences like "../".',
    whyItMatters:
      'An attacker can supply "../../etc/passwd" or sensitive application configuration files, reading or overwriting unauthorized files on the server.',
    unsafeCode: `# UNSAFE: Directory traversal vector\nwith open("uploads/" + user_filename, "r") as f:\n    data = f.read()`,
    safeCode: `# SAFE: Validate resolved path against permitted base directory\nfrom pathlib import Path\nsafe_name = Path(user_filename).name\nfile_path = (Path("uploads") / safe_name).resolve()`,
    commonMistakes: [
      'Only checking for "../" once (attackers bypass with "....//").',
      'Trusting the browser-provided Content-Disposition filename header blindly.',
    ],
  },
];

export const SecurityGuidePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTopicId, setSelectedTopicId] = useState<string>(GUIDE_TOPICS[0].id);

  const activeTopic = GUIDE_TOPICS.find((t) => t.id === selectedTopicId) || GUIDE_TOPICS[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <span>Security Knowledge Guide</span>
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Practical secure development best practices and vulnerability explanations for supported checks.
        </p>
      </div>

      {/* Guide Content: Topic Nav + Topic Body */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Topic Index */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl shadow-xs p-3 space-y-1">
          <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Topics Index
          </div>
          {GUIDE_TOPICS.map((topic) => {
            const isSelected = topic.id === selectedTopicId;
            return (
              <button
                key={topic.id}
                onClick={() => setSelectedTopicId(topic.id)}
                className={`w-full text-left p-3 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div>
                  <div className="truncate">{topic.title}</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">{topic.category}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            );
          })}
        </div>

        {/* Right Topic Detail */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl shadow-xs p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold font-mono">
                {activeTopic.cwe}
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">{activeTopic.title}</h3>
            </div>
            {activeTopic.sampleId && (
              <button
                onClick={() => navigate(`/scanner?sample=${activeTopic.sampleId}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition shadow-xs shrink-0"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Test in Scanner</span>
              </button>
            )}
          </div>

          {/* What is the problem? */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">What is this issue?</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{activeTopic.whatIsIt}</p>
          </div>

          {/* Why it matters */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Why does it matter?</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{activeTopic.whyItMatters}</p>
          </div>

          {/* Code Examples */}
          <div className="space-y-4">
            {/* Unsafe Example */}
            <div className="border border-red-200 rounded-xl overflow-hidden shadow-xs">
              <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-900 font-semibold text-xs border-b border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Vulnerable Implementation Pattern</span>
              </div>
              <pre className="p-4 bg-slate-900 text-red-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {activeTopic.unsafeCode}
              </pre>
            </div>

            {/* Safer Approach */}
            <div className="border border-emerald-200 rounded-xl overflow-hidden shadow-xs">
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-900 font-semibold text-xs border-b border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Recommended Secure Pattern</span>
              </div>
              <pre className="p-4 bg-slate-900 text-emerald-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
                {activeTopic.safeCode}
              </pre>
            </div>
          </div>

          {/* Common Mistakes to Avoid */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Common Mistakes to Avoid</h4>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
              {activeTopic.commonMistakes.map((mistake, index) => (
                <li key={index} className="leading-relaxed">
                  {mistake}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
