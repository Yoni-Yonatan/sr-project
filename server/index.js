import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, queryAll, queryOne, run } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 5000;
const JWT_SECRET = 'jewelry-admin-secret-key-2024';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

await initDb();

// Auth
app.post('/api/auth/login', (req, res) => {
  const { full_name, password } = req.body;
  if (!full_name || !password) return res.status(400).json({ error: 'Full name and password required' });

  const user = queryOne('SELECT * FROM employees WHERE full_name = ?', [full_name]);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  if (!bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
  if (!user.is_active) return res.status(403).json({ error: 'Account is disabled' });

  const token = jwt.sign({ id: user.id, full_name: user.full_name }, JWT_SECRET, { expiresIn: '24h' });
  res.json({
    token,
    user: { id: user.id, full_name: user.full_name, phone_number: user.phone_number, branch_id: user.branch_id, photo: user.photo, is_active: user.is_active },
  });
});

app.post('/api/auth/signup', upload.single('photo'), (req, res) => {
  const { full_name, phone_number, password, branch_id } = req.body;
  const photo = req.file ? req.file.filename : '';

  if (!full_name || !phone_number || !password || !branch_id) return res.status(400).json({ error: 'All fields required' });

  const existing = queryOne('SELECT id FROM employees WHERE full_name = ?', [full_name]);
  if (existing) return res.status(409).json({ error: 'Full name already exists' });

  const hashedPassword = bcrypt.hashSync(password, 10);
  run('INSERT INTO employees (full_name, phone_number, password, branch_id, photo) VALUES (?, ?, ?, ?, ?)', [full_name, phone_number, hashedPassword, branch_id, photo]);
  res.status(201).json({ message: 'Account created' });
});

// Employees
app.get('/api/employees', authMiddleware, (req, res) => {
  const employees = queryAll(`
    SELECT e.*, b.name as branch_name
    FROM employees e
    LEFT JOIN branches b ON e.branch_id = b.id
    ORDER BY e.id DESC
  `);
  res.json(employees);
});

app.post('/api/employees', authMiddleware, upload.single('photo'), (req, res) => {
  const { full_name, phone_number, password, branch_id, sales } = req.body;
  const photo = req.file ? req.file.filename : '';
  const hashedPassword = password ? bcrypt.hashSync(password, 10) : '';
  run('INSERT INTO employees (full_name, phone_number, photo, password, branch_id, sales) VALUES (?, ?, ?, ?, ?, ?)', [full_name, phone_number, photo, hashedPassword, branch_id, sales || 0]);
  res.status(201).json({ message: 'Employee added' });
});

app.put('/api/employees/:id', authMiddleware, upload.single('photo'), (req, res) => {
  const { full_name, phone_number, password, branch_id, sales } = req.body;
  const employee = queryOne('SELECT * FROM employees WHERE id = ?', [req.params.id]);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });

  const photo = req.file ? req.file.filename : employee.photo;
  let query = 'UPDATE employees SET full_name = ?, phone_number = ?, branch_id = ?, sales = ?, photo = ?';
  const params = [full_name, phone_number, branch_id, sales || 0, photo];

  if (password) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    query += ', password = ?';
    params.push(hashedPassword);
  }

  query += ' WHERE id = ?';
  params.push(req.params.id);
  run(query, params);
  res.json({ message: 'Employee updated' });
});

app.patch('/api/employees/:id/toggle-status', authMiddleware, (req, res) => {
  const employee = queryOne('SELECT * FROM employees WHERE id = ?', [req.params.id]);
  if (!employee) return res.status(404).json({ error: 'Employee not found' });
  run('UPDATE employees SET is_active = ? WHERE id = ?', [employee.is_active ? 0 : 1, req.params.id]);
  res.json({ message: 'Status updated' });
});

// Categories
app.get('/api/categories', authMiddleware, (req, res) => {
  const categories = queryAll('SELECT * FROM categories ORDER BY level, name');
  res.json(categories);
});

app.post('/api/categories', authMiddleware, upload.single('image'), (req, res) => {
  const { jewelry_type, category_name, name, level, parent_id } = req.body;
  const image = req.file ? req.file.filename : '';
  run('INSERT INTO categories (jewelry_type, category_name, name, level, parent_id, image) VALUES (?, ?, ?, ?, ?, ?)', [jewelry_type, category_name || '', name, level, parent_id || null, image]);
  res.status(201).json({ message: 'Category added' });
});

app.put('/api/categories/:id', authMiddleware, upload.single('image'), (req, res) => {
  const { jewelry_type, category_name, name, level, parent_id } = req.body;
  const category = queryOne('SELECT * FROM categories WHERE id = ?', [req.params.id]);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  const image = req.file ? req.file.filename : category.image;
  run('UPDATE categories SET jewelry_type = ?, category_name = ?, name = ?, level = ?, parent_id = ?, image = ? WHERE id = ?', [jewelry_type, category_name || '', name, level, parent_id || null, image, req.params.id]);
  res.json({ message: 'Category updated' });
});

app.delete('/api/categories/:id', authMiddleware, (req, res) => {
  const cat = queryOne('SELECT * FROM categories WHERE id = ?', [req.params.id]);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  run('UPDATE categories SET parent_id = NULL WHERE parent_id = ?', [req.params.id]);
  run('DELETE FROM categories WHERE id = ?', [req.params.id]);
  res.json({ message: 'Category deleted' });
});

// Karats
app.get('/api/karats', authMiddleware, (req, res) => {
  const karats = queryAll('SELECT * FROM karats ORDER BY jewelry_type, name');
  res.json(karats);
});

app.get('/api/karats/type/:type', authMiddleware, (req, res) => {
  const karats = queryAll('SELECT * FROM karats WHERE jewelry_type = ?', [req.params.type]);
  res.json(karats);
});

app.post('/api/karats', authMiddleware, (req, res) => {
  const { jewelry_type, name } = req.body;
  run('INSERT INTO karats (jewelry_type, name) VALUES (?, ?)', [jewelry_type, name]);
  res.status(201).json({ message: 'Karat added' });
});

app.put('/api/karats/:id', authMiddleware, (req, res) => {
  const { jewelry_type, name } = req.body;
  run('UPDATE karats SET jewelry_type = ?, name = ? WHERE id = ?', [jewelry_type, name, req.params.id]);
  res.json({ message: 'Karat updated' });
});

app.delete('/api/karats/:id', authMiddleware, (req, res) => {
  run('DELETE FROM karats WHERE id = ?', [req.params.id]);
  res.json({ message: 'Karat deleted' });
});

// Pricing
app.get('/api/pricing', authMiddleware, (req, res) => {
  const price = queryOne('SELECT * FROM pricing ORDER BY id DESC LIMIT 1');
  res.json(price || { amount: 0 });
});

app.post('/api/pricing', authMiddleware, (req, res) => {
  const { amount } = req.body;
  const result = run('INSERT INTO pricing (amount) VALUES (?)', [amount]);
  const price = queryOne('SELECT * FROM pricing WHERE id = ?', [result.lastInsertRowid]);
  res.status(201).json(price);
});

// Branches
app.get('/api/branches', authMiddleware, (req, res) => {
  const branches = queryAll('SELECT * FROM branches');
  res.json(branches);
});

app.post('/api/branches', authMiddleware, (req, res) => {
  const { name, location } = req.body;
  run('INSERT INTO branches (name, location) VALUES (?, ?)', [name, location || '']);
  res.status(201).json({ message: 'Branch added' });
});

app.put('/api/branches/:id', authMiddleware, (req, res) => {
  const { name, location } = req.body;
  run('UPDATE branches SET name = ?, location = ? WHERE id = ?', [name, location || '', req.params.id]);
  res.json({ message: 'Branch updated' });
});

app.delete('/api/branches/:id', authMiddleware, (req, res) => {
  run('DELETE FROM branches WHERE id = ?', [req.params.id]);
  res.json({ message: 'Branch deleted' });
});

// Inventory
app.get('/api/inventory', authMiddleware, (req, res) => {
  const { karat, jewelry_type, status } = req.query;
  let query = `
    SELECT i.*, k.name as karat_name, c.name as category_name, c.category_name as category_type
    FROM inventory i
    LEFT JOIN karats k ON i.karat_id = k.id
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE 1=1
  `;
  const params = [];
  if (karat) { query += ' AND i.karat_id = ?'; params.push(karat); }
  if (jewelry_type) { query += ' AND i.jewelry_type = ?'; params.push(jewelry_type); }
  if (status === 'in_stock') { query += ' AND i.is_sold = 0'; }
  else if (status === 'sold') { query += ' AND i.is_sold = 1'; }
  query += ' ORDER BY i.id DESC';
  const items = queryAll(query, params);
  res.json(items);
});

app.post('/api/inventory', authMiddleware, (req, res) => {
  const { date, jewelry_type, category_id, karat_id, base_price, current_price, weight_grams, is_sold } = req.body;
  run('INSERT INTO inventory (date, jewelry_type, category_id, karat_id, base_price, current_price, weight_grams, is_sold) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [date, jewelry_type, category_id || null, karat_id, base_price, current_price, weight_grams, is_sold ? 1 : 0]);
  res.status(201).json({ message: 'Item added' });
});

app.put('/api/inventory/:id', authMiddleware, (req, res) => {
  const { date, jewelry_type, category_id, karat_id, base_price, current_price, weight_grams, is_sold } = req.body;
  run('UPDATE inventory SET date = ?, jewelry_type = ?, category_id = ?, karat_id = ?, base_price = ?, current_price = ?, weight_grams = ?, is_sold = ? WHERE id = ?', [date, jewelry_type, category_id || null, karat_id, base_price, current_price, weight_grams, is_sold ? 1 : 0, req.params.id]);
  res.json({ message: 'Item updated' });
});

app.delete('/api/inventory/:id', authMiddleware, (req, res) => {
  run('DELETE FROM inventory WHERE id = ?', [req.params.id]);
  res.json({ message: 'Item deleted' });
});

// Sales
app.get('/api/sales', authMiddleware, (req, res) => {
  const sales = queryAll(`
    SELECT s.*, e.full_name as employee_name
    FROM sales s
    LEFT JOIN employees e ON s.employee_id = e.id
    ORDER BY s.id DESC
  `);

  const result = sales.map(sale => {
    const items = queryAll(`
      SELECT si.*, i.karat_id, i.category_id, i.jewelry_type
      FROM sale_items si
      LEFT JOIN inventory i ON si.inventory_id = i.id
      WHERE si.sale_id = ?
    `, [sale.id]);
    return {
      ...sale,
      items,
      total_items: items.length,
      sale_amount: sale.sale_amount,
      discount: sale.discount,
    };
  });
  res.json(result);
});

app.get('/api/sales/:id', authMiddleware, (req, res) => {
  const sale = queryOne(`
    SELECT s.*, e.full_name as employee_name
    FROM sales s
    LEFT JOIN employees e ON s.employee_id = e.id
    WHERE s.id = ?
  `, [req.params.id]);
  if (!sale) return res.status(404).json({ error: 'Sale not found' });
  sale.items = queryAll('SELECT * FROM sale_items WHERE sale_id = ?', [sale.id]);
  sale.total_items = sale.items.length;
  res.json(sale);
});

app.post('/api/sales', authMiddleware, (req, res) => {
  const { employee_id, sale_date, notes, items } = req.body;
  if (!items || items.length === 0) return res.status(400).json({ error: 'At least one item required' });

  let totalAmount = 0;
  let totalDiscount = 0;
  for (const item of items) {
    const sub = item.weight_grams * item.price_per_gram;
    const disc = item.discount || 0;
    const afterDisc = sub - disc;
    const tax = item.is_taxed ? afterDisc * 0.15 : 0;
    totalAmount += afterDisc + tax;
    totalDiscount += disc;
  }

  const result = run('INSERT INTO sales (employee_id, sale_date, sale_amount, discount, notes) VALUES (?, ?, ?, ?, ?)', [employee_id, sale_date, totalAmount, totalDiscount, notes || '']);
  const saleId = result.lastInsertRowid;

  for (const item of items) {
    run('INSERT INTO sale_items (sale_id, inventory_id, item_name, karat, weight_grams, price_per_gram, discount, is_taxed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [saleId, item.inventory_id || null, item.item_name, item.karat || '', item.weight_grams, item.price_per_gram, item.discount || 0, item.is_taxed ? 1 : 0]);
    if (item.inventory_id) {
      run('UPDATE inventory SET is_sold = 1 WHERE id = ?', [item.inventory_id]);
    }
  }

  res.status(201).json({ message: 'Sale added', id: saleId });
});

app.put('/api/sales/:id', authMiddleware, (req, res) => {
  const { employee_id, sale_date, notes, items } = req.body;
  const existing = queryOne('SELECT * FROM sales WHERE id = ?', [req.params.id]);
  if (!existing) return res.status(404).json({ error: 'Sale not found' });

  const oldItems = queryAll('SELECT * FROM sale_items WHERE sale_id = ?', [req.params.id]);
  for (const item of oldItems) {
    if (item.inventory_id) {
      run('UPDATE inventory SET is_sold = 0 WHERE id = ?', [item.inventory_id]);
    }
  }

  let totalAmount = 0;
  let totalDiscount = 0;
  for (const item of items) {
    const sub = item.weight_grams * item.price_per_gram;
    const disc = item.discount || 0;
    const afterDisc = sub - disc;
    const tax = item.is_taxed ? afterDisc * 0.15 : 0;
    totalAmount += afterDisc + tax;
    totalDiscount += disc;
  }

  run('UPDATE sales SET employee_id = ?, sale_date = ?, sale_amount = ?, discount = ?, notes = ? WHERE id = ?', [employee_id, sale_date, totalAmount, totalDiscount, notes || '', req.params.id]);
  run('DELETE FROM sale_items WHERE sale_id = ?', [req.params.id]);

  for (const item of items) {
    run('INSERT INTO sale_items (sale_id, inventory_id, item_name, karat, weight_grams, price_per_gram, discount, is_taxed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [req.params.id, item.inventory_id || null, item.item_name, item.karat || '', item.weight_grams, item.price_per_gram, item.discount || 0, item.is_taxed ? 1 : 0]);
    if (item.inventory_id) {
      run('UPDATE inventory SET is_sold = 1 WHERE id = ?', [item.inventory_id]);
    }
  }

  res.json({ message: 'Sale updated' });
});

app.delete('/api/sales/:id', authMiddleware, (req, res) => {
  const items = queryAll('SELECT * FROM sale_items WHERE sale_id = ?', [req.params.id]);
  for (const item of items) {
    if (item.inventory_id) {
      run('UPDATE inventory SET is_sold = 0 WHERE id = ?', [item.inventory_id]);
    }
  }
  run('DELETE FROM sale_items WHERE sale_id = ?', [req.params.id]);
  run('DELETE FROM sales WHERE id = ?', [req.params.id]);
  res.json({ message: 'Sale deleted' });
});

// Dashboard
app.get('/api/dashboard', authMiddleware, (req, res) => {
  const totalSales = queryOne("SELECT COALESCE(SUM(sale_amount), 0) as total FROM sales");
  const totalSalesCount = queryOne("SELECT COUNT(*) as count FROM sales");
  const inventoryValue = queryOne("SELECT COALESCE(SUM(current_price * weight_grams), 0) as total FROM inventory WHERE is_sold = 0");
  const totalInventory = queryOne("SELECT COUNT(*) as count FROM inventory");
  const inStockInventory = queryOne("SELECT COUNT(*) as count FROM inventory WHERE is_sold = 0");
  const soldInventory = queryOne("SELECT COUNT(*) as count FROM inventory WHERE is_sold = 1");
  const totalEmployees = queryOne("SELECT COUNT(*) as count FROM employees WHERE is_active = 1");
  const totalDiscount = queryOne("SELECT COALESCE(SUM(discount), 0) as total FROM sales");

  const salesByType = queryAll(`
    SELECT COALESCE(i.jewelry_type, 'Unknown') as jewelry_type, COALESCE(SUM(si.weight_grams * si.price_per_gram), 0) as total, COUNT(DISTINCT s.id) as count
    FROM sales s
    JOIN sale_items si ON s.id = si.sale_id
    LEFT JOIN inventory i ON si.inventory_id = i.id
    GROUP BY i.jewelry_type
  `);

  const salesByEmployee = queryAll(`
    SELECT e.full_name, COALESCE(SUM(s.sale_amount), 0) as total, COUNT(s.id) as count
    FROM sales s
    JOIN employees e ON s.employee_id = e.id
    GROUP BY e.id
    ORDER BY total DESC
    LIMIT 10
  `);

  const salesByCategory = queryAll(`
    SELECT COALESCE(c.name, 'Uncategorized') as name, COALESCE(SUM(si.weight_grams * si.price_per_gram), 0) as total, COUNT(DISTINCT s.id) as count
    FROM sales s
    JOIN sale_items si ON s.id = si.sale_id
    LEFT JOIN inventory i ON si.inventory_id = i.id
    LEFT JOIN categories c ON i.category_id = c.id
    GROUP BY c.id
    ORDER BY total DESC
  `);

  const dailySales = queryAll(`
    SELECT sale_date, SUM(sale_amount) as total, COUNT(*) as count
    FROM sales
    GROUP BY sale_date
    ORDER BY sale_date DESC
    LIMIT 30
  `).reverse();

  const monthlySales = queryAll(`
    SELECT substr(sale_date, 1, 7) as month, SUM(sale_amount) as sales, COUNT(*) as count
    FROM sales
    GROUP BY month
    ORDER BY month
  `);

  const inventoryByType = queryAll(`
    SELECT jewelry_type, COUNT(*) as count, COALESCE(SUM(weight_grams), 0) as total_weight
    FROM inventory
    GROUP BY jewelry_type
  `);

  res.json({
    totalSales: totalSales.total,
    totalSalesCount: totalSalesCount.count,
    inventoryValue: inventoryValue.total,
    totalInventory: totalInventory.count,
    inStockInventory: inStockInventory.count,
    soldInventory: soldInventory.count,
    totalEmployees: totalEmployees.count,
    totalDiscount: totalDiscount.total,
    salesByType,
    salesByEmployee,
    salesByCategory,
    dailySales,
    monthlySales,
    inventoryByType,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
