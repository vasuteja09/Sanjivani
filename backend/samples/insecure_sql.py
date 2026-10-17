# Educational Demonstration Sample - Insecure SQL Query Construction
# Purpose: Demonstrates string-concatenated SQL queries susceptible to SQL Injection.

import sqlite3

def get_user_profile(user_input_id: str):
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()

    # VULNERABILITY: Direct string formatting into SQL query allows SQL Injection (CWE-89)
    # Bandit Rule: B608 (hardcoded_sql_expressions)
    query = "SELECT id, username, email, role FROM users WHERE id = '" + user_input_id + "'"
    cursor.execute(query)
    
    user = cursor.fetchone()
    conn.close()
    return user

if __name__ == "__main__":
    # Example attack payload: ' OR '1'='1
    print(get_user_profile("admin' OR '1'='1"))
