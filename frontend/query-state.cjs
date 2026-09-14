const { Client } = require('pg');

(async () => {
  const client = new Client({
    user: 'careeros', host: 'localhost', database: 'careeros', password: 'careeros', port: 5432,
  });
  await client.connect();

  // The applications were created 2026-09-12 ~11:00 UTC
  // Let's check what resumes existed BEFORE that date (i.e., could have been used)
  console.log("=== Resumes that existed before apps were created (before 2026-09-12T11:00) ===");
  const res = await client.query(`
    SELECT r.id, r.filename, r.created_at,
           cp.id as profile_id,
           (SELECT COUNT(*) FROM candidate_skill cs WHERE cs.candidate_profile_id = cp.id) as skill_count
    FROM resume r
    LEFT JOIN candidate_profile cp ON cp.resume_id = r.id
    WHERE r.created_at < '2026-09-12T11:00:00'
    ORDER BY r.created_at ASC
  `);
  console.log(res.rows);

  await client.end();
})();