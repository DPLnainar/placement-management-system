/**
 * PostgreSQL Migration Runner
 * 
 * This script helps you run database migrations programmatically.
 * 
 * Usage:
 *   node run-migration.js <migration-file-name>
 * 
 * Example:
 *   node run-migration.js 001_add_placement_criteria_columns.sql
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// PostgreSQL connection configuration
// Update these values according to your database setup
const config = {
    user: process.env.POSTGRES_USER || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    database: process.env.POSTGRES_DB || 'placement_management',
    password: process.env.POSTGRES_PASSWORD || 'your_password',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
};

const pool = new Pool(config);

/**
 * Run a migration file
 */
async function runMigration(migrationFileName) {
    const migrationPath = path.join(__dirname, 'migrations', migrationFileName);

    // Check if file exists
    if (!fs.existsSync(migrationPath)) {
        console.error(`❌ Migration file not found: ${migrationPath}`);
        process.exit(1);
    }

    console.log(`📄 Reading migration file: ${migrationFileName}`);
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Extract only the UP migration (before the DOWN section)
    const upMigrationMatch = sql.match(/BEGIN;([\s\S]*?)COMMIT;/);
    if (!upMigrationMatch) {
        console.error('❌ Could not find valid migration SQL (BEGIN...COMMIT block)');
        process.exit(1);
    }

    const migrationSql = upMigrationMatch[0];

    console.log('🔄 Connecting to database...');
    console.log(`   Host: ${config.host}:${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}`);

    try {
        // Test connection
        await pool.query('SELECT NOW()');
        console.log('✅ Database connection successful\n');

        console.log('🚀 Running migration...');
        console.log('─'.repeat(60));

        // Run the migration
        const result = await pool.query(migrationSql);

        console.log('─'.repeat(60));
        console.log('✅ Migration completed successfully!\n');

        // Run verification queries if they exist
        const verificationMatch = sql.match(/-- VERIFICATION QUERIES[\s\S]*?-- Verify columns were added successfully([\s\S]*?)$/);
        if (verificationMatch) {
            console.log('🔍 Running verification queries...\n');

            // Extract individual verification queries
            const verificationSql = verificationMatch[1];
            const queries = verificationSql
                .split(';')
                .map(q => q.trim())
                .filter(q => q && !q.startsWith('--') && q.toLowerCase().includes('select'));

            for (const query of queries) {
                try {
                    const verifyResult = await pool.query(query);
                    if (verifyResult.rows.length > 0) {
                        console.log('📊 Verification Result:');
                        console.table(verifyResult.rows);
                    }
                } catch (err) {
                    console.log(`⚠️  Verification query skipped: ${err.message}`);
                }
            }
        }

        console.log('\n✨ All done! Migration applied successfully.');

    } catch (error) {
        console.error('\n❌ Migration failed!');
        console.error('Error details:', error.message);

        if (error.code) {
            console.error('Error code:', error.code);
        }

        if (error.detail) {
            console.error('Detail:', error.detail);
        }

        if (error.hint) {
            console.error('Hint:', error.hint);
        }

        process.exit(1);
    } finally {
        await pool.end();
    }
}

/**
 * List available migrations
 */
function listMigrations() {
    const migrationsDir = path.join(__dirname, 'migrations');

    if (!fs.existsSync(migrationsDir)) {
        console.log('No migrations directory found.');
        return;
    }

    const files = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

    if (files.length === 0) {
        console.log('No migration files found.');
        return;
    }

    console.log('\n📋 Available migrations:\n');
    files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file}`);
    });
    console.log('');
}

/**
 * Create migrations tracking table
 */
async function createMigrationsTable() {
    const createTableSql = `
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      version VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

    try {
        await pool.query(createTableSql);
        console.log('✅ Migrations tracking table created/verified');
    } catch (error) {
        console.error('❌ Failed to create migrations table:', error.message);
    }
}

/**
 * Record migration in tracking table
 */
async function recordMigration(version, description) {
    const insertSql = `
    INSERT INTO schema_migrations (version, description)
    VALUES ($1, $2)
    ON CONFLICT (version) DO NOTHING;
  `;

    try {
        await pool.query(insertSql, [version, description]);
        console.log(`✅ Migration ${version} recorded in tracking table`);
    } catch (error) {
        console.error('⚠️  Could not record migration:', error.message);
    }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--list' || args[0] === '-l') {
    listMigrations();
    process.exit(0);
}

if (args[0] === '--help' || args[0] === '-h') {
    console.log(`
PostgreSQL Migration Runner

Usage:
  node run-migration.js <migration-file-name>
  node run-migration.js --list              List all available migrations
  node run-migration.js --help              Show this help message

Examples:
  node run-migration.js 001_add_placement_criteria_columns.sql
  node run-migration.js --list

Environment Variables:
  POSTGRES_USER      Database user (default: postgres)
  POSTGRES_HOST      Database host (default: localhost)
  POSTGRES_DB        Database name (default: placement_management)
  POSTGRES_PASSWORD  Database password (default: your_password)
  POSTGRES_PORT      Database port (default: 5432)

Before running:
  1. Make sure PostgreSQL is running
  2. Update the database credentials in this file or set environment variables
  3. Backup your database
  4. Test on development environment first
  `);
    process.exit(0);
}

const migrationFile = args[0];
runMigration(migrationFile);
