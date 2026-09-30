require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { Pool } = require('pg');

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL (or SUPABASE_DB_URL) is not set in server/.env');
    console.error('Please add your Supabase connection string to server/.env like:');
    console.error('DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require');
    process.exit(1);
  }

  const sqlitePath = path.resolve(__dirname, 'database.sqlite');
  if (!fs.existsSync(sqlitePath)) {
    console.error('❌ Error: database.sqlite file not found at:', sqlitePath);
    process.exit(1);
  }

  console.log('📦 Reading local SQLite database...');
  const sqlite = new Database(sqlitePath);

  console.log('🚀 Connecting to Supabase / PostgreSQL...');
  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();

  try {
    console.log('📄 Initializing schema in Supabase...');
    const schemaSql = fs.readFileSync(path.resolve(__dirname, 'supabase_schema.sql'), 'utf8');
    await client.query(schemaSql);
    console.log('✅ Schema created / verified in Supabase.');

    // Helper to insert rows with matching columns and JSON types
    async function migrateTable(tableName, jsonCols = [], dateCols = []) {
      const rows = sqlite.prepare(`SELECT * FROM ${tableName}`).all();
      console.log(`⏳ Migrating table "${tableName}" (${rows.length} rows)...`);
      if (!rows.length) return;

      for (const row of rows) {
        const keys = Object.keys(row);
        const values = keys.map((k) => {
          const val = row[k];
          if (val === null || val === undefined) return null;
          if (jsonCols.includes(k)) {
            try {
              return typeof val === 'string' ? JSON.parse(val) : val;
            } catch {
              return val;
            }
          }
          return val;
        });

        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const columns = keys.map((k) => `"${k}"`).join(', ');

        const insertSql = `
          INSERT INTO "${tableName}" (${columns})
          VALUES (${placeholders})
          ON CONFLICT (id) DO UPDATE SET
          ${keys.filter(k => k !== 'id').map(k => `"${k}" = EXCLUDED."${k}"`).join(', ')}
        `;

        await client.query(insertSql, values);
      }

      // Reset sequence
      await client.query(`SELECT setval(pg_get_serial_sequence('"${tableName}"', 'id'), COALESCE((SELECT MAX(id) + 1 FROM "${tableName}"), 1), false)`);
      console.log(`✅ Finished "${tableName}".`);
    }

    await migrateTable('users');
    await migrateTable('products', ['colors', 'sizes', 'images', 'specs']);
    await migrateTable('addresses');
    await migrateTable('coupons');
    await migrateTable('offers');
    await migrateTable('cart_items');
    await migrateTable('wishlist_items');
    await migrateTable('orders', ['address_snapshot']);
    await migrateTable('order_items');
    await migrateTable('reviews');
    await migrateTable('order_status_history');
    await migrateTable('inventory_movements');

    console.log('\n🎉 ALL DATA MIGRATED TO SUPABASE SUCCESSFULLY! 🎉\n');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
    sqlite.close();
  }
}

migrate();
