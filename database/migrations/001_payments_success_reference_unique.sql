-- Migration: enforce DB-level idempotency on successful Paystack payments.
--
-- Run this once against an EXISTING production database that was created before this
-- migration (fresh installs already get this via database/schema.sql, so this file is
-- redundant for them).
--
-- Paystack fires both the browser callback (GET /payment/callback) and a server-to-server
-- webhook for the same successful transaction. The application already guards against double
-- crediting with a check-then-insert, but that alone is race-prone under concurrent requests.
-- This adds a generated column + UNIQUE index so the database itself rejects a second
-- 'success' row for the same paystack_reference, no matter which handler wins the race.
--
-- Safe to run multiple times (guarded checks below); back up the payments table first if you
-- want to be extra cautious, though this migration is purely additive (no data is deleted).

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payments' AND COLUMN_NAME = 'success_reference'
);

SET @sql := IF(@col_exists = 0,
  'ALTER TABLE payments
     ADD COLUMN success_reference VARCHAR(255) GENERATED ALWAYS AS (
       CASE WHEN status = ''success'' THEN paystack_reference ELSE NULL END
     ) STORED,
     ADD UNIQUE KEY uniq_success_reference (success_reference)',
  'SELECT ''success_reference already exists, skipping'' AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
