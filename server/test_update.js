const pool = require('./config/database');

const calcItem = (item) => {
  const sub_total = Math.round((item.weight_grams * item.price_per_gram) * 100) / 100;
  const discount = Math.round((item.discount || 0) * 100) / 100;
  const afterDiscount = Math.round((sub_total - discount) * 100) / 100;
  const tax_amount = item.is_taxed ? Math.round(afterDiscount * 0.15 * 100) / 100 : 0;
  const final_total = Math.round((afterDiscount + tax_amount) * 100) / 100;
  return { ...item, sub_total, discount, tax_amount, final_total };
};

async function testUpdate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const id = '7';
    const employee_id = '1';
    const sale_date = '2026-07-04';
    const notes = '';
    const paid_amount = 20000000;
    const payment_status = 'Full';
    
    const items = [
      {
        inventory_id: null,
        item_name: 'Item - 21k',
        karat: '21k',
        weight_grams: '2.38',
        price_per_gram: '29000',
        discount: '0',
        is_taxed: false
      }
    ];

    const calculatedItems = items.map(calcItem);
    const sale_amount = Math.round(calculatedItems.reduce((sum, i) => sum + i.final_total, 0) * 100) / 100;
    const total_discount = Math.round(calculatedItems.reduce((sum, i) => sum + i.discount, 0) * 100) / 100;

    const saleResult = await client.query(
      `UPDATE sales SET employee_id = $1, sale_date = $2, sale_amount = $3, discount = $4, total_items = $5, notes = $6, paid_amount = $7, payment_status = $8
       WHERE id = $9
       RETURNING *`,
      [employee_id, sale_date, sale_amount, total_discount, calculatedItems.length, notes || null, paid_amount || 0, payment_status || 'Unpaid', id]
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
    }
    
    console.log('Success!');
    await client.query('ROLLBACK');
    process.exit(0);
  } catch(e) {
    console.error('ERROR:', e.message);
    await client.query('ROLLBACK');
    process.exit(1);
  }
}
testUpdate();
