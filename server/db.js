import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'jewelry.db');

let db;

export async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');

  db.run(`
    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT DEFAULT ''
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      phone_number TEXT NOT NULL,
      photo TEXT DEFAULT '',
      password TEXT NOT NULL,
      branch_id INTEGER NOT NULL,
      sales REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (branch_id) REFERENCES branches(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jewelry_type TEXT NOT NULL DEFAULT 'Gold',
      category_name TEXT DEFAULT '',
      name TEXT NOT NULL,
      level INTEGER DEFAULT 0,
      parent_id INTEGER,
      image TEXT DEFAULT '',
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS karats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jewelry_type TEXT NOT NULL DEFAULT 'Gold',
      name TEXT NOT NULL
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS pricing (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      jewelry_type TEXT NOT NULL DEFAULT 'Gold',
      category_id INTEGER,
      karat_id INTEGER NOT NULL,
      base_price REAL NOT NULL,
      current_price REAL NOT NULL,
      weight_grams REAL NOT NULL,
      is_sold INTEGER DEFAULT 0,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (karat_id) REFERENCES karats(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL,
      sale_date TEXT NOT NULL,
      sale_amount REAL NOT NULL DEFAULT 0,
      discount REAL DEFAULT 0,
      notes TEXT DEFAULT '',
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      inventory_id INTEGER,
      item_name TEXT NOT NULL,
      karat TEXT DEFAULT '',
      weight_grams REAL NOT NULL,
      price_per_gram REAL NOT NULL,
      discount REAL DEFAULT 0,
      is_taxed INTEGER DEFAULT 1,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (inventory_id) REFERENCES inventory(id)
    )
  `);

  const row = db.exec('SELECT COUNT(*) as count FROM branches');
  const count = row.length > 0 ? row[0].values[0][0] : 0;

  if (count === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);

    db.run('INSERT INTO branches (name, location) VALUES (?, ?)', ['Main Branch', 'Downtown']);
    db.run('INSERT INTO branches (name, location) VALUES (?, ?)', ['Branch 2', 'Mall Center']);
    db.run('INSERT INTO branches (name, location) VALUES (?, ?)', ['Branch 3', 'Airport']);

    db.run('INSERT INTO employees (full_name, phone_number, password, branch_id, sales, is_active) VALUES (?, ?, ?, ?, ?, ?)', ['Admin', '1234567890', hashedPassword, 1, 0, 1]);
    db.run('INSERT INTO employees (full_name, phone_number, password, branch_id, sales, is_active) VALUES (?, ?, ?, ?, ?, ?)', ['John Doe', '0987654321', hashedPassword, 2, 1500.50, 1]);

    db.run('INSERT INTO karats (jewelry_type, name) VALUES (?, ?)', ['Gold', '24K']);
    db.run('INSERT INTO karats (jewelry_type, name) VALUES (?, ?)', ['Gold', '22K']);
    db.run('INSERT INTO karats (jewelry_type, name) VALUES (?, ?)', ['Gold', '21K']);
    db.run('INSERT INTO karats (jewelry_type, name) VALUES (?, ?)', ['Gold', '18K']);
    db.run('INSERT INTO karats (jewelry_type, name) VALUES (?, ?)', ['Diamond', '1 Carat']);
    db.run('INSERT INTO karats (jewelry_type, name) VALUES (?, ?)', ['Diamond', '0.5 Carat']);

    db.run('INSERT INTO categories (jewelry_type, name, level, parent_id) VALUES (?, ?, ?, ?)', ['Gold', 'Rings', 0, null]);
    db.run('INSERT INTO categories (jewelry_type, name, level, parent_id) VALUES (?, ?, ?, ?)', ['Gold', 'Necklaces', 0, null]);
    db.run('INSERT INTO categories (jewelry_type, name, level, parent_id) VALUES (?, ?, ?, ?)', ['Diamond', 'Diamond Rings', 0, null]);

    db.run('INSERT INTO pricing (amount) VALUES (?)', [65.00]);

    saveDb();
  }

  return db;
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
  return { changes: db.getRowsModified(), lastInsertRowid: db.exec("SELECT last_insert_rowid() as id")[0]?.values[0]?.[0] };
}

function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

export { queryAll, queryOne, run };
export default { initDb, queryAll, queryOne, run };
