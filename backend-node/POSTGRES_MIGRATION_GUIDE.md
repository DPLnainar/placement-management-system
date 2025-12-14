# PostgreSQL Migration Quick Start Guide

## 🎯 Overview

This guide helps you add placement criteria columns to your `student_profiles` table in PostgreSQL.

## 📋 What Gets Added

The migration adds these columns to `student_profiles`:

| Column Name | Type | Default | Constraint | Description |
|------------|------|---------|------------|-------------|
| `mark_10th` | DECIMAL(5,2) | NULL | >= 0 | 10th standard marks/percentage |
| `mark_12th` | DECIMAL(5,2) | NULL | >= 0 | 12th standard marks/percentage |
| `current_backlogs` | INTEGER | 0 | >= 0 | Active backlogs (not cleared) |
| `history_of_arrears` | INTEGER | 0 | >= 0 | Total arrears (including cleared) |

## 🚀 Quick Start (3 Steps)

### Step 1: Install PostgreSQL Driver (if not already installed)

```bash
npm install pg
```

### Step 2: Configure Database Connection

Create a `.env.postgres` file (copy from `env.postgres.example`):

```bash
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=placement_management
```

### Step 3: Run the Migration

**Option A: Using the Node.js script**
```bash
node run-migration.js 001_add_placement_criteria_columns.sql
```

**Option B: Using psql directly**
```bash
psql -U postgres -d placement_management -f migrations/001_add_placement_criteria_columns.sql
```

**Option C: Using pgAdmin**
1. Open pgAdmin
2. Connect to your database
3. Open Query Tool
4. Load `migrations/001_add_placement_criteria_columns.sql`
5. Execute (F5)

## ✅ Verify Migration

Run this query to verify columns were added:

```sql
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'student_profiles'
  AND column_name IN ('mark_10th', 'mark_12th', 'current_backlogs', 'history_of_arrears');
```

Expected output:
```
column_name         | data_type | column_default | is_nullable
--------------------+-----------+----------------+-------------
mark_10th           | numeric   | NULL           | YES
mark_12th           | numeric   | NULL           | YES
current_backlogs    | integer   | 0              | NO
history_of_arrears  | integer   | 0              | NO
```

## 📊 Sample Usage

### Insert student with placement criteria:
```sql
INSERT INTO student_profiles (
  user_id, 
  college_id, 
  mark_10th, 
  mark_12th, 
  current_backlogs, 
  history_of_arrears
) VALUES (
  1, 
  1, 
  85.50, 
  92.75, 
  0, 
  2
);
```

### Update existing student:
```sql
UPDATE student_profiles
SET mark_10th = 88.00,
    mark_12th = 91.50,
    current_backlogs = 1,
    history_of_arrears = 3
WHERE user_id = 123;
```

### Query students with no backlogs:
```sql
SELECT * FROM student_profiles
WHERE current_backlogs = 0
ORDER BY mark_10th DESC, mark_12th DESC;
```

### Query students eligible for placement (example criteria):
```sql
SELECT 
  sp.*,
  u.name,
  u.email
FROM student_profiles sp
JOIN users u ON sp.user_id = u.id
WHERE sp.mark_10th >= 60
  AND sp.mark_12th >= 60
  AND sp.current_backlogs = 0
  AND sp.history_of_arrears <= 2
ORDER BY sp.mark_10th DESC;
```

## 🔄 Rollback (If Needed)

If you need to undo the migration:

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

## 🛡️ Important Notes

### Before Running Migration:
1. ✅ **Backup your database**
   ```bash
   pg_dump -U postgres placement_management > backup_$(date +%Y%m%d).sql
   ```

2. ✅ **Test on development database first**

3. ✅ **Ensure you have proper permissions**

### Constraints:
- All numeric values must be **non-negative** (>= 0)
- `mark_10th` and `mark_12th` allow **2 decimal places** (e.g., 85.75)
- `current_backlogs` and `history_of_arrears` are **integers only**

### Indexes Created:
- Composite index on all 4 columns for placement eligibility queries
- Partial index on `current_backlogs = 0` for fast "no backlogs" queries

## 🔧 Troubleshooting

### Error: "relation student_profiles does not exist"
**Solution:** Create the table first or verify the table name is correct.

### Error: "column already exists"
**Solution:** The migration uses `IF NOT EXISTS`, so it's safe to re-run. If issues persist, the migration may have been partially applied.

### Error: "permission denied"
**Solution:** Ensure your database user has ALTER TABLE permissions:
```sql
GRANT ALTER ON TABLE student_profiles TO your_user;
```

## 📞 Need Help?

- Check the detailed [migrations/README.md](migrations/README.md)
- Review the migration file: [migrations/001_add_placement_criteria_columns.sql](migrations/001_add_placement_criteria_columns.sql)
- Run with `--help` flag: `node run-migration.js --help`

## 🎓 Next Steps

After running the migration:

1. **Update your application code** to use the new columns
2. **Update API endpoints** to accept/return these fields
3. **Update frontend forms** to collect this data
4. **Test thoroughly** with sample data
5. **Document** the new fields in your API documentation

## 📝 Example Application Code (Node.js)

```javascript
// Update student placement criteria
async function updateStudentCriteria(userId, data) {
  const query = `
    UPDATE student_profiles
    SET mark_10th = $1,
        mark_12th = $2,
        current_backlogs = $3,
        history_of_arrears = $4
    WHERE user_id = $5
    RETURNING *;
  `;
  
  const values = [
    data.mark_10th,
    data.mark_12th,
    data.current_backlogs,
    data.history_of_arrears,
    userId
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0];
}

// Check placement eligibility
async function checkEligibility(userId, jobCriteria) {
  const query = `
    SELECT 
      mark_10th >= $1 as meets_10th_criteria,
      mark_12th >= $2 as meets_12th_criteria,
      current_backlogs <= $3 as meets_backlog_criteria,
      history_of_arrears <= $4 as meets_arrear_criteria
    FROM student_profiles
    WHERE user_id = $5;
  `;
  
  const values = [
    jobCriteria.min_10th || 0,
    jobCriteria.min_12th || 0,
    jobCriteria.max_backlogs || 0,
    jobCriteria.max_arrears || 0,
    userId
  ];
  
  const result = await pool.query(query, values);
  return result.rows[0];
}
```
