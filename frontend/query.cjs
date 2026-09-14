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
  const res = await client.query(`
    SELECT a.id, j.title, a.match_score, a.match_result_id, a.resume_id, r.filename
    FROM application a 
    JOIN job j ON a.job_id = j.id 
    JOIN resume r ON a.resume_id = r.id
    WHERE j.title ILIKE '%DevOps%'
  `);
  console.log(res.rows);
  await client.end();
})();