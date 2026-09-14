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
  
  console.log("--- Application ---");
  const appRes = await client.query(`
    SELECT a.id, j.title, a.match_score, a.resume_id, r.filename
    FROM application a 
    JOIN job j ON a.job_id = j.id 
    LEFT JOIN resume r ON a.resume_id = r.id
    WHERE j.title ILIKE '%DevOps%'
  `);
  console.log(appRes.rows);
  
  if (appRes.rows.length > 0 && appRes.rows[0].resume_id) {
    console.log("\n--- Resume & Profile ---");
    const resId = appRes.rows[0].resume_id;
    const profRes = await client.query(`
      SELECT id, profile_generated, warning FROM resume WHERE id = $1
    `, [resId]);
    console.log("Resume:", profRes.rows[0]);
    
    const cpRes = await client.query(`
      SELECT id, experience_years FROM candidate_profile WHERE resume_id = $1
    `, [resId]);
    console.log("Candidate Profile:", cpRes.rows);
    
    if (cpRes.rows.length > 0) {
      const skillsRes = await client.query(`
        SELECT skill_name FROM candidate_skill WHERE candidate_profile_id = $1
      `, [cpRes.rows[0].id]);
      console.log("Candidate Skills count:", skillsRes.rows.length);
      console.log(skillsRes.rows.map(r => r.skill_name).join(', '));
    }
  }

  await client.end();
})();