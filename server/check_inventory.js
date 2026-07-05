require('dotenv').config();
const http = require('http');

const PORT = process.env.PORT || 5000;

function fetchAPI(path, name) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path: path,
      method: 'GET'
    };

    console.log(`\nFetching ${name} from: http://127.0.0.1:${PORT}${path}...`);
    
    const req = http.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error(`HTTP Error for ${name}: ${res.statusCode} ${data}`);
          return resolve(false);
        }
        try {
          const items = JSON.parse(data);
          console.log(`Success! Fetched ${items.length} ${name} items.`);
          if (items.length > 0) {
            console.log(`Sample ${name} Item:`);
            console.log(JSON.stringify(items[0], null, 2));
          } else {
            console.log(`The ${name} list is currently empty.`);
          }
          resolve(true);
        } catch (e) {
          console.error(`Failed to parse JSON for ${name}:`, e);
          resolve(false);
        }
      });
    });

    req.on('error', error => {
      console.error(`Failed to fetch ${name}:`, error.message);
      resolve(false);
    });

    req.end();
  });
}

async function runChecks() {
  await fetchAPI('/api/inventory', 'inventory');
  await fetchAPI('/api/categories', 'categories');
}

runChecks();
