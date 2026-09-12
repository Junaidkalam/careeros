async function test() {
  try {
    const email = `test_${Date.now()}@example.com`;
    // 1. Register to get token
    const authRes = await fetch("http://localhost:8080/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "password", name: "test user" })
    });
    const auth = await authRes.json();
    const token = auth.token;
    
    // 2. Import URL
    const targetUrl = "https://boards.greenhouse.io/spacex/jobs/7473723002";
    console.log("Importing:", targetUrl);
    const importRes = await fetch("http://localhost:8080/api/jobs/import", {
      method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ url: targetUrl })
    });
    
    console.log("Status:", importRes.status);
    const data = await importRes.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}
test();