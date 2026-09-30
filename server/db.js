const path = require('path');
const fs = require('fs');

// Determine database type
const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
const isPostgres = Boolean(databaseUrl);

let dbInstance = null;

if (isPostgres) {
  const { Pool } = require('pg');
  
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  // Helper to convert '?' placeholders to PostgreSQL '$1, $2, ...'
  // Also adapts SQLite functions to PostgreSQL equivalents
  const translateSql = (sql, params = []) => {
    let paramIndex = 1;
    let translated = sql
      .replace(/datetime\('now'\)/gi, 'NOW()')
      .replace(/CURRENT_TIMESTAMP/gi, 'CURRENT_TIMESTAMP')
      .replace(/json_extract\(([^,]+),\s*\?\)/gi, (_, col) => `${col}->>$${paramIndex++}`)
      .replace(/\s+IS\s+\?/gi, () => ` IS NOT DISTINCT FROM $${paramIndex++}`)
      .replace(/\?/g, () => `$${paramIndex++}`);

    return { sql: translated, params };
  };

  // Convert named params @name, @price if used
  const translateNamedSql = (sql, dataObj) => {
    const params = [];
    let paramIndex = 1;
    const translated = sql.replace(/@([a-zA-Z0-9_]+)/g, (_, key) => {
      params.push(dataObj[key] !== undefined ? dataObj[key] : null);
      return `$${paramIndex++}`;
    });
    return { sql: translated, params };
  };

  dbInstance = {
    isPostgres: true,
    pool,

    async query(sql, params = []) {
      const { sql: pSql, params: pParams } = Array.isArray(params)
        ? translateSql(sql, params)
        : translateNamedSql(sql, params);
      const res = await pool.query(pSql, pParams);
      return res;
    },

    async get(sql, ...params) {
      const flattened = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      const res = await this.query(sql, flattened);
      return res.rows[0] || null;
    },

    async all(sql, ...params) {
      const flattened = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      const res = await this.query(sql, flattened);
      return res.rows;
    },

    async run(sql, ...params) {
      const flattened = params.length === 1 && typeof params[0] === 'object' && !Array.isArray(params[0])
        ? params[0]
        : (params.length === 1 && Array.isArray(params[0]) ? params[0] : params);

      // If it's an INSERT without RETURNING, append RETURNING id to get lastInsertRowid
      let finalSql = sql;
      const isInsert = /^\s*INSERT\s+INTO/i.test(sql);
      if (isInsert && !/RETURNING/i.test(sql)) {
        finalSql = `${sql} RETURNING id`;
      }

      const res = await this.query(finalSql, flattened);
      const lastInsertRowid = res.rows && res.rows[0] ? res.rows[0].id : null;
      return {
        lastInsertRowid,
        changes: res.rowCount,
      };
    },

    async exec(sql) {
      return await pool.query(sql);
    },

    async transaction(callback) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        const txDb = {
          async query(sql, params = []) {
            const { sql: pSql, params: pParams } = Array.isArray(params)
              ? translateSql(sql, params)
              : translateNamedSql(sql, params);
            return await client.query(pSql, pParams);
          },
          async get(sql, ...params) {
            const flattened = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
            const res = await this.query(sql, flattened);
            return res.rows[0] || null;
          },
          async all(sql, ...params) {
            const flattened = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
            const res = await this.query(sql, flattened);
            return res.rows;
          },
          async run(sql, ...params) {
            const flattened = params.length === 1 && typeof params[0] === 'object' && !Array.isArray(params[0])
              ? params[0]
              : (params.length === 1 && Array.isArray(params[0]) ? params[0] : params);

            let finalSql = sql;
            if (/^\s*INSERT\s+INTO/i.test(sql) && !/RETURNING/i.test(sql)) {
              finalSql = `${sql} RETURNING id`;
            }
            const res = await this.query(finalSql, flattened);
            return {
              lastInsertRowid: res.rows && res.rows[0] ? res.rows[0].id : null,
              changes: res.rowCount,
            };
          },
          prepare(sql) {
            return {
              get: (...p) => txDb.get(sql, ...p),
              all: (...p) => txDb.all(sql, ...p),
              run: (...p) => txDb.run(sql, ...p),
            };
          },
        };

        const result = await callback(txDb);
        await client.query('COMMIT');
        return result;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },

    // Prepare compatibility method for smooth migration
    prepare(sql) {
      return {
        get: (...params) => this.get(sql, ...params),
        all: (...params) => this.all(sql, ...params),
        run: (...params) => this.run(sql, ...params),
      };
    },
  };

  console.log('Connected to Supabase / PostgreSQL database pool.');
} else {
  // Local SQLite fallback mode
  const Database = require('better-sqlite3');
  const dbPath = path.resolve(__dirname, 'database.sqlite');
  const sqlite = new Database(dbPath, process.env.DEBUG_SQL ? { verbose: console.log } : {});
  sqlite.pragma('foreign_keys = ON');

  // Columns added after first release
  const MIGRATIONS = [
    ['users', 'role', "TEXT DEFAULT 'customer'"],
    ['products', 'is_active', 'INTEGER DEFAULT 1'],
    ['orders', 'payment_status', "TEXT DEFAULT 'Pending'"],
    ['orders', 'payment_ref', 'TEXT'],
    ['orders', 'coupon_code', 'TEXT'],
    ['orders', 'delivery_fee', 'REAL DEFAULT 0'],
    ['orders', 'updated_at', 'DATETIME'],
    ['coupons', 'is_active', 'INTEGER DEFAULT 1'],
    ['products', 'specs', 'TEXT'],
    ['orders', 'courier', 'TEXT'],
    ['orders', 'tracking_number', 'TEXT'],
  ];

  for (const [table, column, definition] of MIGRATIONS) {
    const exists = sqlite.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?`).get(table);
    if (!exists) continue;
    const columns = sqlite.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
    if (!columns.includes(column)) sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }

  const schemaPath = path.resolve(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    sqlite.exec(schema);
  }

  dbInstance = {
    isPostgres: false,
    sqlite,

    async query(sql, params = []) {
      const stmt = sqlite.prepare(sql);
      if (/^\s*(SELECT|PRAGMA)/i.test(sql)) {
        const rows = Array.isArray(params) ? stmt.all(...params) : stmt.all(params);
        return { rows, rowCount: rows.length };
      } else {
        const res = Array.isArray(params) ? stmt.run(...params) : stmt.run(params);
        return { rowCount: res.changes, lastInsertRowid: res.lastInsertRowid };
      }
    },

    async get(sql, ...params) {
      const flattened = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      return sqlite.prepare(sql).get(...flattened) || null;
    },

    async all(sql, ...params) {
      const flattened = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
      return sqlite.prepare(sql).all(...flattened);
    },

    async run(sql, ...params) {
      const flattened = params.length === 1 && typeof params[0] === 'object' && !Array.isArray(params[0])
        ? params[0]
        : (params.length === 1 && Array.isArray(params[0]) ? params[0] : params);
      return typeof flattened === 'object' && !Array.isArray(flattened)
        ? sqlite.prepare(sql).run(flattened)
        : sqlite.prepare(sql).run(...(Array.isArray(flattened) ? flattened : [flattened]));
    },

    async exec(sql) {
      return sqlite.exec(sql);
    },

    async transaction(callback) {
      const tx = sqlite.transaction(async (txDb) => {
        return await callback(txDb || dbInstance);
      });
      return await tx(dbInstance);
    },

    prepare(sql) {
      const stmt = sqlite.prepare(sql);
      return {
        get: async (...params) => {
          const flattened = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          return stmt.get(...flattened) || null;
        },
        all: async (...params) => {
          const flattened = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          return stmt.all(...flattened);
        },
        run: async (...params) => {
          const flattened = params.length === 1 && typeof params[0] === 'object' && !Array.isArray(params[0])
            ? params[0]
            : (params.length === 1 && Array.isArray(params[0]) ? params[0] : params);
          return typeof flattened === 'object' && !Array.isArray(flattened)
            ? stmt.run(flattened)
            : stmt.run(...(Array.isArray(flattened) ? flattened : [flattened]));
        },
      };
    },
  };

  console.log('Database initialized (Local SQLite mode). Set DATABASE_URL to use Supabase.');
}

module.exports = dbInstance;
