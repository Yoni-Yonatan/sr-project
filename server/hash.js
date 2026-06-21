const bcrypt = require('bcryptjs');
const password = 'password123';
bcrypt.hash(password, 10).then(hash => {
  console.log('Hash:', hash);
  // Verify it works
  bcrypt.compare(password, hash).then(match => {
    console.log('Match:', match);
  });
});
