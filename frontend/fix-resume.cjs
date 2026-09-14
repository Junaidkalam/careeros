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
  const cpRes = await client.query(`
    SELECT cp.id, cp.resume_id, r.filename 
    FROM candidate_profile cp 
    JOIN resume r ON cp.resume_id = r.id
    LIMIT 1
  `);
  console.log("Candidate Profile:", cpRes.rows);
  
  if (cpRes.rows.length > 0) {
    const resumeId = cpRes.rows[0].resume_id;
    const upd = await client.query(`
      UPDATE application SET resume_id = $1 WHERE resume_id IS NULL
    `, [resumeId]);
    console.log("Updated applications:", upd.rowCount);
  }
  await client.end();
})();