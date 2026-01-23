-- Create Products Table
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sku TEXT,
  volume TEXT,
  price REAL NOT NULL,
  cost REAL,
  category TEXT,
  image TEXT,
  stock INTEGER DEFAULT 0
);

-- Create Tickets (Sales) Table
CREATE TABLE IF NOT EXISTS tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  total REAL NOT NULL,
  status TEXT DEFAULT 'COMPLETED',
  payment_method TEXT,
  customer_id TEXT
);

-- Create Ticket Items Table (Many-to-Many link)
CREATE TABLE IF NOT EXISTS ticket_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  product_id INTEGER,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  unit_cost REAL,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id)
);

-- Initial Seed Data
INSERT INTO products (name, sku, volume, price, cost, category) VALUES
('Espresso Blend', 'E001', '100ml', 12.50, 10.00, 'Coffee'),
('Latte Syrup Vanilla', 'S001', '100ml', 8.75, 8.00, 'Syrups'),
('French Press', 'A205', '1 unit', 29.99, 25.00, 'Equipment');
