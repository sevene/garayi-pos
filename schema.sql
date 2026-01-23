-- Drop tables if they exist to ensure clean slate for new vertical
DROP TABLE IF EXISTS ticket_items;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;

-- Create Products (Services) Table
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  price_sedan REAL NOT NULL,
  price_suv REAL NOT NULL,
  price_truck REAL NOT NULL,
  category TEXT, -- 'Wash', 'Detal', 'Addon'
  duration_minutes INTEGER DEFAULT 30
);

-- Create Customers Table (Vital for Carwash)
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT,
  plate_number TEXT UNIQUE,
  vehicle_type TEXT DEFAULT 'SEDAN', -- 'SEDAN', 'SUV', 'TRUCK'
  visits_count INTEGER DEFAULT 0,
  last_visit DATETIME
);

-- Create Tickets (Job Orders)
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  finished_at DATETIME,
  total REAL NOT NULL,
  status TEXT DEFAULT 'QUEUED', -- 'QUEUED', 'WASHING', 'DRYING', 'READY', 'PAID'
  payment_method TEXT,
  customer_id INTEGER,
  plate_number TEXT, -- Denormalized for quick lookup
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Create Ticket Items
CREATE TABLE IF NOT EXISTS ticket_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  product_id INTEGER,
  product_name TEXT NOT NULL,
  service_type TEXT, -- 'SEDAN', 'SUV' price applied
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price REAL NOT NULL,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);

-- Seed Data (Carwash Services)
INSERT INTO products (name, sku, price_sedan, price_suv, price_truck, category, duration_minutes) VALUES
('Basic Wash', 'W001', 150.00, 200.00, 250.00, 'Wash', 30),
('Premium Wax', 'W002', 300.00, 400.00, 500.00, 'Wash', 60),
('Interior Detail', 'D001', 1500.00, 1800.00, 2200.00, 'Detail', 180),
('Engine Wash', 'A001', 250.00, 300.00, 350.00, 'Addon', 45);

-- Create Users Table
DROP TABLE IF EXISTS users;
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed Admin User
-- Password is 'admin123' (hashed for demo purposes, in real app use robust hashing)
-- For this demo we will use simple direct comparison or a known hash if strict
-- To keep it simple for now, we will store a plain text password in the seed for the very first login logic to hashing it later,
-- OR better, we simply assume the auth logic will verify against this.
-- Let's use a placeholder hash for 'admin123' to be realistic.
-- SHA-256('admin123') = 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
INSERT INTO users (username, password_hash, role) VALUES
('admin', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin');

-- Create Employees Table
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role TEXT,
  phone TEXT,
  salary_rate REAL,
  salary_type TEXT, -- 'fixed', 'commission'
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed an employee
INSERT INTO employees (name, role, salary_type) VALUES ('Staff 1', 'Staff', 'commission');

-- Create Settings Table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  name TEXT DEFAULT 'Garayi Carwash',
  address TEXT,
  currency TEXT DEFAULT 'PHP',
  tax_rate REAL DEFAULT 0.08,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Settings
INSERT OR IGNORE INTO settings (id, name, currency) VALUES (1, 'Garayi Carwash', 'PHP');

