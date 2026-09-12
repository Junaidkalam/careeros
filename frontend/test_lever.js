async function test() {
  const email = `test_${Date.now()}@example.com`;
  const authRes = await fetch("http://localhost:8080/api/auth/register", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "password", name: "test user" })
  });
  const token = (await authRes.json()).token;

  // Let's test a Lever job
  const targetUrl = "https://jobs.lever.co/netflix/0cb1b83d-3687-43f1-b995-17793ce8bb2f"; // Netflix doesn't use lever actually. Let's just use a fake one? No we need a real one.
}