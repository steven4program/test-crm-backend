-- Initialize CRM Database
-- This script runs when MySQL container starts for the first time

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS simple_crm;

-- Use the database
USE simple_crm;

-- Grant privileges to users
GRANT ALL PRIVILEGES ON simple_crm.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON simple_crm.* TO 'crm_user'@'%';

-- Note: The actual table creation is handled by the NestJS migration system
-- This script only ensures the database exists and permissions are set