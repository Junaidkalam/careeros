async function run() {
  const email = `test_${Date.now()}@example.com`;
  const auth = await (await fetch("http://localhost:8080/api/auth/register", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "password", name: "test user" })
  })).json();
  const token = auth.token;

  console.log("Importing no_ldjson.html ...");
  const res = await fetch("http://localhost:8080/api/jobs/import", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ url: "http://localhost:3000/no_ldjson.html" })
  });
  const data = await res.json();
  console.log("extractedFromJsonLd:", data.extractedFromJsonLd);
  console.log("warning:            ", data.warning ?? "(null - LLM ran successfully)");
  console.log("DRAFT:\n", JSON.stringify(data.draft, null, 2));
}
run();