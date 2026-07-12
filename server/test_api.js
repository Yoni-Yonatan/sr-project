const http = require('http');

const data = JSON.stringify({
  employee_id: 1,
  sale_date: '2026-07-04',
  notes: '',
  paid_amount: 20000000,
  payment_status: 'Full',
  items: [
    {
      inventory_id: null,
      item_name: 'Item - 21k',
      karat: '21k',
      weight_grams: '2.38',
      price_per_gram: '29000',
      discount: '0',
      is_taxed: false
    }
  ]
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/sales/7',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let body = '';
  res.on('data', (chunk) => { body += chunk; });
  res.on('end', () => {
    console.log(`BODY: ${body}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
