# Database Migrations

This directory contains SQL migration scripts for the PostgreSQL database.

## Overview

Migration scripts are used to version control database schema changes. Each migration file is numbered sequentially and should be executed in order.

## Migration Files

### 001_add_placement_criteria_columns.sql
Adds placement criteria columns to the `student_profiles` table:
- `mark_10th` - 10th standard marks (DECIMAL(5,2))
- `mark_12th` - 12th standard marks (DECIMAL(5,2))
- `current_backlogs` - Active backlogs count (INTEGER, default 0)
- `history_of_arrears` - Total arrears history (INTEGER, default 0)

**Features:**
- ✅ Check constraints to prevent negative values
- ✅ Indexes for efficient placement eligibility queries
- ✅ Column comments for documentation
- ✅ Rollback script included
- ✅ Verification queries

## How to Run Migrations

### Option 1: Using psql (PostgreSQL Command Line)

```bash
# Connect to your database
psql -U your_username -d your_database_name

# Run the migration
\i backend-node/migrations/001_add_placement_criteria_columns.sql
```

### Option 2: Using psql with file input

```bash
psql -U your_username -d your_database_name -f backend-node/migrations/001_add_placement_criteria_columns.sql
```

### Option 3: Using pgAdmin

1. Open pgAdmin
2. Connect to your database
3. Open Query Tool (Tools → Query Tool)
4. Open the migration file
5. Execute the script (F5 or click Execute)

### Option 4: Using Node.js with pg library

```javascript
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: 'your_username',
  host: 'localhost',
  database: 'your_database_name',
  password: 'your_password',
  port: 5432,
});

async function runMigration() {
  const migrationPath = path.join(__dirname, '001_add_placement_criteria_columns.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  
  try {
    await pool.query(sql);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
```

## Migration Best Practices

1. **Always backup your database before running migrations**
   ```bash
   pg_dump -U your_username your_database_name > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Test migrations on a development database first**

3. **Run migrations in a transaction** (already included in the scripts)

4. **Keep track of which migrations have been applied**

5. **Never modify existing migration files** - create new ones instead

## Rollback Instructions

If you need to rollback the migration:

1. Open the migration file
2. Uncomment the "MIGRATION DOWN" section
3. Run only that section in your database

Or manually run:

```sql
BEGIN;

DROP INDEX IF EXISTS idx_student_profiles_placement_criteria;
DROP INDEX IF EXISTS idx_student_profiles_no_backlogs;

ALTER TABLE student_profiles DROP COLUMN IF EXISTS mark_10th;
ALTER TABLE student_profiles DROP COLUMN IF EXISTS mark_12th;
ALTER TABLE student_profiles DROP COLUMN IF EXISTS current_backlogs;
ALTER TABLE student_profiles DROP COLUMN IF EXISTS history_of_arrears;

COMMIT;
```

## Verification

After running the migration, verify it was successful:

```sql
-- Check if columns exist
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'student_profiles'
  AND column_name IN ('mark_10th', 'mark_12th', 'current_backlogs', 'history_of_arrears');

-- Check constraints
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'student_profiles'::regclass
  AND contype = 'c';

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'student_profiles';
```

## Migration Tracking

Consider creating a migrations tracking table:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  version VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- After running a migration, record it:
INSERT INTO schema_migrations (version, description)
VALUES ('001', 'Add placement criteria columns');
```

## Environment-Specific Notes

### Development
- Test all migrations thoroughly
- Use sample data to verify constraints work correctly

### Staging
- Run migrations during low-traffic periods
- Monitor for any errors or performance issues

### Production
- **ALWAYS backup first**
- Schedule migrations during maintenance windows
- Have a rollback plan ready
- Monitor application logs after migration

## Common Issues and Solutions

### Issue: "relation student_profiles does not exist"
**Solution:** Ensure the table exists or create it first. You may need to run initial schema creation scripts.

### Issue: "column already exists"
**Solution:** The migration uses `IF NOT EXISTS` clauses, so it should be safe to re-run. If issues persist, check if the migration was partially applied.

### Issue: "check constraint violated"
**Solution:** If you have existing data with negative values, clean it up before running the migration:
```sql
UPDATE student_profiles SET some_column = 0 WHERE some_column < 0;
```

## Contact

For questions or issues with migrations, please contact the development team.
