-- ilovepdf-app database schema (MySQL)
-- Run this once against your MySQL database (e.g. on Hostinger) before starting the app.

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  trial_used TINYINT(1) NOT NULL DEFAULT 0,
  trial_start DATETIME NULL,
  trial_end DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS guest_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fingerprint VARCHAR(255) NOT NULL,
  ip_address VARCHAR(64) NOT NULL,
  used_count INT NOT NULL DEFAULT 0,
  first_tool_slug VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_fingerprint (fingerprint)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tool_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  guest_fingerprint VARCHAR(255) NULL,
  tool_slug VARCHAR(100) NOT NULL,
  usage_type ENUM('free','trial','subscription') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan_name VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  status ENUM('active','expired','cancelled') NOT NULL DEFAULT 'active',
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  paystack_reference VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  plan_name VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  status VARCHAR(50) NOT NULL,
  paystack_reference VARCHAR(255) NOT NULL,
  paystack_response_json JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  -- Generated column + unique index enforce "at most one successful payment row
  -- per reference" at the DB level, closing the race window between the
  -- browser callback and the server-to-server webhook (both can fire for the
  -- same transaction and race the application-level check-then-insert guard).
  -- MySQL has no partial/filtered unique index, so NULL-when-not-success is
  -- used instead (MySQL treats multiple NULLs in a UNIQUE index as distinct).
  success_reference VARCHAR(255) GENERATED ALWAYS AS (
    CASE WHEN status = 'success' THEN paystack_reference ELSE NULL END
  ) STORED,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uniq_success_reference (success_reference)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  stat_key VARCHAR(100) NOT NULL UNIQUE,
  stat_value VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
