CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    photo VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'employee',
    branch_id INT REFERENCES branches(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    jewelry_type VARCHAR(50) NOT NULL CHECK (jewelry_type IN ('Gold', 'Diamond')),
    category_name VARCHAR(100),
    level INT DEFAULT 0,
    parent_id INT REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE karats (
    id SERIAL PRIMARY KEY,
    jewelry_type VARCHAR(50) NOT NULL CHECK (jewelry_type IN ('Gold', 'Diamond')),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE current_pricing (
    id SERIAL PRIMARY KEY,
    amount DECIMAL(12, 2) NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,
    category_id INT REFERENCES categories(id),
    karat_id INT REFERENCES karats(id),
    base_price DECIMAL(12, 2) NOT NULL,
    current_price DECIMAL(12, 2) NOT NULL,
    weight_grams DECIMAL(10, 3) NOT NULL,
    is_sold BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    employee_id INT REFERENCES employees(id),
    inventory_id INT REFERENCES inventory(id),
    sale_date DATE DEFAULT CURRENT_DATE,
    sale_amount DECIMAL(12, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default admin
INSERT INTO branches (name, location) VALUES ('Main Branch', 'Headquarters');