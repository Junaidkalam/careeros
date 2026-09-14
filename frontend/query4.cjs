const { Client } = require('pg');

(async () => {
  const client = new Client({
    user: 'careeros',
    host: 'localhost',
    database: 'careeros',
    password: 'careeros',
    port: 5432,
  });

  await client.connect();
  const rRes = await client.query(`SELECT id, filename FROM resume`);
  console.log(rRes.rows);
  await client.end();
})();