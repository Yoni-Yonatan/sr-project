const pool = require('../config/database');

const TAX_RATE = 0.15;

const calcItem = (item) => {
  const sub_total = Math.round((item.weight_grams * item.price_per_gram) * 100) / 100;
  const discount = Math.round((item.discount || 0) * 100) / 100;
  const afterDiscount = Math.round((sub_total - discount) * 100) / 100;
  const tax_amount = item.is_taxed ? Math.round(afterDiscount * TAX_RATE * 100) / 100 : 0;
  const final_total = Math.round((afterDiscount + tax_amount) * 100) / 100;
  return { ...item, sub_total, discount, tax_amount, final_total };
};

const getAllSales = async (req, res) => {
  try {
    const salesResult = await pool.query(
      `SELECT s.id, s.employee_id, s.sale_date, s.sale_amount, s.discount, s.notes, s.total_items, s.created_at, s.paid_amount, s.payment_status,
              e.full_name as employee_name
       FROM sales s
       LEFT JOIN employees e ON s.employee_id = e.id
       ORDER BY s.created_at DESC`
    );

    const sales = salesResult.rows;

    for (const sale of sales) {
      const itemsResult = await pool.query(
        `SELECT si.*, i.weight_grams as stock_weight, i.current_price,
                CONCAT_WS(' → ', mc.name, sc.name, st.name) as category_name, k.name as karat_name
         FROM sale_items si
         LEFT JOIN inventory i ON si.inventory_id = i.id
         LEFT JOIN categories mc ON i.main_category_id = mc.id
         LEFT JOIN categories sc ON i.sub_category_id = sc.id
         LEFT JOIN categories st ON i.specific_type_id = st.id
         LEFT JOIN karats k ON i.karat_id = k.id
         WHERE si.sale_id = $1
         ORDER BY si.id`,
        [sale.id]
      );
      sale.items = itemsResult.rows;
    }

    res.json(sales);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getSaleById = async (req, res) => {
  try {
    const { id } = req.params;
    const saleResult = await pool.query(
      `SELECT s.*, e.full_name as employee_name
       FROM sales s
       LEFT JOIN employees e ON s.employee_id = e.id
       WHERE s.id = $1`,
      [id]
    );

    if (saleResult.rows.length === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    const sale = saleResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT si.*, i.weight_grams as stock_weight,
              CONCAT_WS(' → ', mc.name, sc.name, st.name) as category_name, k.name as karat_name
       FROM sale_items si
       LEFT JOIN inventory i ON si.inventory_id = i.id
       LEFT JOIN categories mc ON i.main_category_id = mc.id
       LEFT JOIN categories sc ON i.sub_category_id = sc.id
       LEFT JOIN categories st ON i.specific_type_id = st.id
       LEFT JOIN karats k ON i.karat_id = k.id
       WHERE si.sale_id = $1
       ORDER BY si.id`,
      [id]
    );
    sale.items = itemsResult.rows;

    res.json(sale);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const addSale = async (req, res) => {
  const client = await pool.connect();
  try {
    const { employee_id, sale_date, notes, items, paid_amount, payment_status } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    await client.query('BEGIN');

    const calculatedItems = items.map(calcItem);
    const sale_amount = Math.round(calculatedItems.reduce((sum, i) => sum + i.final_total, 0) * 100) / 100;
    const total_discount = Math.round(calculatedItems.reduce((sum, i) => sum + i.discount, 0) * 100) / 100;

    const saleResult = await client.query(
      `INSERT INTO sales (employee_id, sale_date, sale_amount, discount, total_items, notes, paid_amount, payment_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        employee_id,
        sale_date || new Date().toISOString().split('T')[0],
        sale_amount,
        total_discount,
        calculatedItems.length,
        notes || null,
        paid_amount || 0,
        payment_status || 'Unpaid',
      ]
    );
    const sale = saleResult.rows[0];

    for (const item of calculatedItems) {
      await client.query(
        `INSERT INTO sale_items (sale_id, inventory_id, item_name, karat, weight_grams, price_per_gram, sub_total, discount, is_taxed, tax_amount, final_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          sale.id,
          item.inventory_id || null,
          item.item_name,
          item.karat || null,
          item.weight_grams,
          item.price_per_gram,
          item.sub_total,
          item.discount,
          item.is_taxed !== undefined ? item.is_taxed : true,
          item.tax_amount,
          item.final_total,
        ]
      );

      if (item.inventory_id) {
        await client.query('UPDATE inventory SET is_sold = true WHERE id = $1', [item.inventory_id]);
      }
    }

    await client.query('COMMIT');

    const completeSale = { ...sale, items: calculatedItems };
    res.status(201).json(completeSale);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

const updateSale = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { employee_id, sale_date, notes, items, paid_amount, payment_status } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    await client.query('BEGIN');

    const oldItems = await client.query('SELECT inventory_id FROM sale_items WHERE sale_id = $1', [id]);
    for (const row of oldItems.rows) {
      if (row.inventory_id) {
        await client.query('UPDATE inventory SET is_sold = false WHERE id = $1', [row.inventory_id]);
      }
    }

    await client.query('DELETE FROM sale_items WHERE sale_id = $1', [id]);

    const calculatedItems = items.map(calcItem);
    const sale_amount = Math.round(calculatedItems.reduce((sum, i) => sum + i.final_total, 0) * 100) / 100;
    const total_discount = Math.round(calculatedItems.reduce((sum, i) => sum + i.discount, 0) * 100) / 100;

    const saleResult = await client.query(
      `UPDATE sales SET employee_id = $1, sale_date = $2, sale_amount = $3, discount = $4, total_items = $5, notes = $6, paid_amount = $7, payment_status = $8
       WHERE id = $9
       RETURNING *`,
      [employee_id, sale_date, sale_amount, total_discount, calculatedItems.length, notes || null, paid_amount || 0, payment_status || 'Unpaid', id]
    );

    if (saleResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Sale not found' });
    }

    const sale = saleResult.rows[0];

    for (const item of calculatedItems) {
      await client.query(
        `INSERT INTO sale_items (sale_id, inventory_id, item_name, karat, weight_grams, price_per_gram, sub_total, discount, is_taxed, tax_amount, final_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          sale.id,
          item.inventory_id || null,
          item.item_name,
          item.karat || null,
          item.weight_grams,
          item.price_per_gram,
          item.sub_total,
          item.discount,
          item.is_taxed !== undefined ? item.is_taxed : true,
          item.tax_amount,
          item.final_total,
        ]
      );

      if (item.inventory_id) {
        await client.query('UPDATE inventory SET is_sold = true WHERE id = $1', [item.inventory_id]);
      }
    }

    await client.query('COMMIT');

    const completeSale = { ...sale, items: calculatedItems };
    res.json(completeSale);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    require('fs').writeFileSync('update_error.log', JSON.stringify(req.body, null, 2) + '\n\n' + err.message + '\n' + err.stack);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

const deleteSale = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const items = await client.query('SELECT inventory_id FROM sale_items WHERE sale_id = $1', [id]);
    for (const row of items.rows) {
      if (row.inventory_id) {
        await client.query('UPDATE inventory SET is_sold = false WHERE id = $1', [row.inventory_id]);
      }
    }

    await client.query('DELETE FROM sale_items WHERE sale_id = $1', [id]);
    const result = await client.query('DELETE FROM sales WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Sale not found' });
    }

    await client.query('COMMIT');
    res.json({ message: 'Sale deleted' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

module.exports = { getAllSales, getSaleById, addSale, updateSale, deleteSale };
