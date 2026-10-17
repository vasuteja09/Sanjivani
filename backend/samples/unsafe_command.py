# Educational Demonstration Sample - Unsafe Shell Command Execution
# Purpose: Demonstrates command injection risks when invoking OS commands with shell=True.

import os
import subprocess

def process_user_report(report_filename: str):
    # VULNERABILITY: os.system with untrusted string concatenation (CWE-78)
    # Bandit Rule: B605 (start_process_with_a_shell)
    os.system("cat reports/" + report_filename)

    # VULNERABILITY: subprocess call with shell=True and unvalidated input (CWE-78)
    # Bandit Rule: B602 (subprocess_popen_with_shell_equals_true)
    subprocess.call("echo Generating backup for " + report_filename, shell=True)

if __name__ == "__main__":
    # Example attack payload: sample.txt; rm -rf /
    process_user_report("quarterly.pdf")
