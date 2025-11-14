import sqlite3
from pathlib import Path

DB_PATH = Path("kila.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS invoice_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT,
            uploaded_at TEXT,
            status TEXT,
            total INTEGER,
            ok_count INTEGER,
            partial_count INTEGER,
            error_count INTEGER
        );
    """)
    conn.commit()
    conn.close()

def insert_history(file_name, uploaded_at, status, total, ok, partial, error):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO invoice_history (file_name, uploaded_at, status, total, ok_count, partial_count, error_count)
        VALUES (?, ?, ?, ?, ?, ?, ?);
    """, (file_name, uploaded_at, status, total, ok, partial, error))
    conn.commit()
    conn.close()

def get_history():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM invoice_history ORDER BY id DESC;")
    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]
