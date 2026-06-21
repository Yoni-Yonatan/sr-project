const pool = require('../config/database');

// Helper: run a query safely, return default on error
const safeQuery = async (query, params, defaultVal = []) => {
  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch (err) {
    console.error('Dashboard query error:', err.message);
    return defaultVal;
  }
};

const safeQueryOne = async (query, params, defaultVal = {}) => {
  try {
    const result = await pool.query(query, params);
    return result.rows[0] || defaultVal;
  } catch (err) {
    console.error('Dashboard query error:', err.message);
    return defaultVal;
  }
};

const getDashboardData = async (req, res) => {
  try {
    // 1. Total sales amount
    const totalSalesRow = await safeQueryOne(
      'SELECT COALESCE(SUM(sale_amount), 0) as total FROM sales'
    );
    const totalSales = parseFloat(totalSalesRow.total) || 0;

    // 2. Total sales count
    const totalSalesCountRow = await safeQueryOne(
      'SELECT COUNT(*) as count FROM sales'
    );
    const totalSalesCount = parseInt(totalSalesCountRow.count) || 0;

    // 3. Total inventory items
    const totalInventoryRow = await safeQueryOne(
      'SELECT COUNT(*) as count FROM inventory'
    );
    const totalInventory = parseInt(totalInventoryRow.count) || 0;

    // 4. Sold inventory items
    const soldInventoryRow = await safeQueryOne(
      'SELECT COUNT(*) as count FROM inventory WHERE is_sold = true'
    );
    const soldInventory = parseInt(soldInventoryRow.count) || 0;

    // 5. In-stock
    const inStockInventory = totalInventory - soldInventory;

    // 6. Inventory value
    const inventoryValueRow = await safeQueryOne(
      'SELECT COALESCE(SUM(current_price * weight_grams), 0) as value FROM inventory WHERE is_sold = false'
    );
    const inventoryValue = parseFloat(inventoryValueRow.value) || 0;

    // 7. Sales by jewelry type (from inventory directly since sale_items may not exist yet)
    const salesByType = await safeQuery(`
      SELECT i.jewelry_type, COALESCE(SUM(s.sale_amount), 0) as total, COUNT(s.id) as count
      FROM sales s
      LEFT JOIN inventory i ON s.inventory_id = i.id
      GROUP BY i.jewelry_type
    `);

    // 8. Sales by employee (top 5)
    const salesByEmployee = await safeQuery(`
      SELECT e.full_name, COALESCE(SUM(s.sale_amount), 0) as total, COUNT(s.id) as count
      FROM sales s
      JOIN employees e ON s.employee_id = e.id
      GROUP BY e.full_name
      ORDER BY total DESC
      LIMIT 5
    `);

    // 9. Sales by category (from inventory)
    const salesByCategory = await safeQuery(`
      SELECT COALESCE(c.name, 'Unknown') as name, COALESCE(SUM(s.sale_amount), 0) as total, COUNT(s.id) as count
      FROM sales s
      LEFT JOIN inventory i ON s.inventory_id = i.id
      LEFT JOIN categories c ON i.category_id = c.id
      GROUP BY c.name
      ORDER BY total DESC
      LIMIT 8
    `);

    // 10. Daily sales for last 30 days
    const dailySales = await safeQuery(`
      SELECT sale_date, COALESCE(SUM(sale_amount), 0) as total, COUNT(*) as count
      FROM sales
      WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY sale_date
      ORDER BY sale_date ASC
    `);

    // 11. Monthly sales for last 12 months
    const monthlySales = await safeQuery(`
      SELECT TO_CHAR(sale_date, 'YYYY-MM') as month, COALESCE(SUM(sale_amount), 0) as total, COUNT(*) as count
      FROM sales
      WHERE sale_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY TO_CHAR(sale_date, 'YYYY-MM')
      ORDER BY month ASC
    `);

    // 12. Inventory by jewelry type
    const inventoryByType = await safeQuery(`
      SELECT jewelry_type, COUNT(*) as count, COALESCE(SUM(weight_grams), 0) as total_weight
      FROM inventory
      WHERE is_sold = false
      GROUP BY jewelry_type
    `);

    // 13. Total employees
    const totalEmployeesRow = await safeQueryOne(
      'SELECT COUNT(*) as count FROM employees WHERE is_active = true'
    );
    const totalEmployees = parseInt(totalEmployeesRow.count) || 0;

    // 14. Total discount (column may not exist yet)
    const totalDiscountRow = await safeQueryOne(
      'SELECT COALESCE(SUM(discount), 0) as total FROM sales'
    );
    const totalDiscount = parseFloat(totalDiscountRow.total) || 0;

    res.json({
      totalSales,
      totalSalesCount,
      totalInventory,
      soldInventory,
      inStockInventory,
      inventoryValue,
      totalEmployees,
      totalDiscount,
      salesByType,
      salesByEmployee,
      salesByCategory,
      dailySales,
      monthlySales,
      inventoryByType,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { getDashboardData };
