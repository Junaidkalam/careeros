async function run() {
  const email = `test_${Date.now()}@example.com`;
  const authRes = await fetch("http://localhost:8080/api/auth/register", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "password", name: "test user" })
  });
  const token = (await authRes.json()).token;

  const urls = [
    "https://jobs.apple.com/en-us/details/200540453/software-engineer",
    "https://careers.microsoft.com/us/en/job/1749524/Software-Engineer",
    "https://www.amazon.jobs/en/jobs/2594611/software-development-engineer",
    "https://jobs.netflix.com/jobs/328221191",
    "https://boards.greenhouse.io/discord/jobs/5239327",
    "https://careers.twitter.com/en/work-for-twitter/202403-software-engineer-machine-learning.html",
    "https://careers.airbnb.com/positions/5878433/"
  ];
  for (const u of urls) {
    const importRes = await fetch("http://localhost:8080/api/jobs/import", {
      method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ url: u })
    });
    const data = await importRes.json();
    console.log(u, "-> extractedFromJsonLd:", data.extractedFromJsonLd);
  }
}
run();