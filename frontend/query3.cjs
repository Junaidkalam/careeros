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
  const appRes = await client.query(`
    SELECT a.id, j.title, a.match_score, a.resume_id, a.created_at
    FROM application a 
    JOIN job j ON a.job_id = j.id 
  `);
  console.log(appRes.rows);
  await client.end();
})();