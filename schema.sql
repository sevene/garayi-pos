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
