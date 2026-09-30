const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
// Set DEBUG_SQL=1 to log every query
const db = new Database(dbPath, process.env.DEBUG_SQL ? { verbose: console.log } : {});

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Columns added after the first release. CREATE TABLE IF NOT EXISTS doesn't change
// existing tables, so older databases get them here before the schema runs.
const MIGRATIONS = [
  ['users', 'role', "TEXT DEFAULT 'customer'"],
  ['products', 'is_active', 'INTEGER DEFAULT 1'],
  ['orders', 'payment_status', "TEXT DEFAULT 'Pending'"],
  ['orders', 'payment_ref', 'TEXT'],
  ['orders', 'coupon_code', 'TEXT'],
  ['orders', 'delivery_fee', 'REAL DEFAULT 0'],
  ['orders', 'updated_at', 'DATETIME'],
  ['coupons', 'is_active', 'INTEGER DEFAULT 1'],
];
for (const [table, column, definition] of MIGRATIONS) {
  const exists = db.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?`).get(table);
  if (!exists) continue;
  const columns = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  if (!columns.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

// Automatically initialize schema
const schemaPath = path.resolve(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

console.log('Database initialized successfully.');

module.exports = db;
