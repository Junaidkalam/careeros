const { Client } = require('pg');
const bcrypt = require('bcryptjs');

(async () => {
  const hash = await bcrypt.hash('password123', 10);
  const client = new Client({
    user: 'careeros',
    host: 'localhost',
    database: 'careeros',
    password: 'careeros',
    port: 5432,
  });

  await client.connect();
  const res = await client.query('UPDATE app_user SET password_hash = $1 WHERE email = $2', [hash, 'nade.system.out@gmail.com']);
  console.log("Updated rows:", res.rowCount);
  await client.end();
})();