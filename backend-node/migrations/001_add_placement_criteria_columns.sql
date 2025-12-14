-- Migration: Add Placement Criteria Columns to student_profiles
-- Description: Adds academic performance and backlog tracking fields
-- Author: Placement Management System
-- Date: 2025-12-14

-- ============================================================================
-- MIGRATION UP: Add new columns
-- ============================================================================

BEGIN;

-- Add mark_10th column (Decimal with 2 decimal places)
ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS mark_10th DECIMAL(5, 2) DEFAULT NULL
CHECK (mark_10th >= 0);

-- Add mark_12th column (Decimal with 2 decimal places)
ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS mark_12th DECIMAL(5, 2) DEFAULT NULL
CHECK (mark_12th >= 0);

-- Add current_backlogs column (Integer, default 0)
ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS current_backlogs INTEGER DEFAULT 0 NOT NULL
CHECK (current_backlogs >= 0);

-- Add history_of_arrears column (Integer, default 0)
ALTER TABLE student_profiles 
ADD COLUMN IF NOT EXISTS history_of_arrears INTEGER DEFAULT 0 NOT NULL
CHECK (history_of_arrears >= 0);

-- Add comments for documentation
COMMENT ON COLUMN student_profiles.mark_10th IS '10th standard marks/percentage (0-100 scale with 2 decimal precision)';
COMMENT ON COLUMN student_profiles.mark_12th IS '12th standard marks/percentage (0-100 scale with 2 decimal precision)';
COMMENT ON COLUMN student_profiles.current_backlogs IS 'Number of active backlogs/failures that are not yet cleared';
COMMENT ON COLUMN student_profiles.history_of_arrears IS 'Total number of arrears/failures in academic history, including cleared ones';

-- Create index for placement eligibility queries (common filter criteria)
CREATE INDEX IF NOT EXISTS idx_student_profiles_placement_criteria 
ON student_profiles (current_backlogs, history_of_arrears, mark_10th, mark_12th);

-- Create index for students with no backlogs (common query pattern)
CREATE INDEX IF NOT EXISTS idx_student_profiles_no_backlogs 
ON student_profiles (current_backlogs) 
WHERE current_backlogs = 0;

COMMIT;

-- ============================================================================
-- MIGRATION DOWN: Rollback changes (if needed)
-- ============================================================================

-- Uncomment the following section to rollback this migration:
/*
BEGIN;

-- Drop indexes
DROP INDEX IF EXISTS idx_student_profiles_placement_criteria;
DROP INDEX IF EXISTS idx_student_profiles_no_backlogs;

-- Drop columns
ALTER TABLE student_profiles DROP COLUMN IF EXISTS mark_10th;
ALTER TABLE student_profiles DROP COLUMN IF EXISTS mark_12th;
ALTER TABLE student_profiles DROP COLUMN IF EXISTS current_backlogs;
ALTER TABLE student_profiles DROP COLUMN IF EXISTS history_of_arrears;

COMMIT;
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify columns were added successfully
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE table_name = 'student_profiles'
  AND column_name IN ('mark_10th', 'mark_12th', 'current_backlogs', 'history_of_arrears')
ORDER BY ordinal_position;

-- Verify check constraints
SELECT 
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'student_profiles'
  AND con.contype = 'c'
  AND pg_get_constraintdef(con.oid) LIKE '%mark_%' 
   OR pg_get_constraintdef(con.oid) LIKE '%backlog%'
   OR pg_get_constraintdef(con.oid) LIKE '%arrear%';

-- Verify indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'student_profiles'
  AND (indexname LIKE '%placement_criteria%' OR indexname LIKE '%backlogs%');

-- Sample data check (after migration)
SELECT 
    COUNT(*) as total_students,
    COUNT(mark_10th) as students_with_10th_marks,
    COUNT(mark_12th) as students_with_12th_marks,
    AVG(mark_10th) as avg_10th_marks,
    AVG(mark_12th) as avg_12th_marks,
    SUM(CASE WHEN current_backlogs = 0 THEN 1 ELSE 0 END) as students_no_backlogs,
    SUM(CASE WHEN current_backlogs > 0 THEN 1 ELSE 0 END) as students_with_backlogs,
    MAX(current_backlogs) as max_current_backlogs,
    MAX(history_of_arrears) as max_history_arrears
FROM student_profiles;
