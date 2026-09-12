async function check() {
    const u = "https://adobe.wd5.myworkdayjobs.com/en-US/external_we/job/San-Jose/Software-Engineer-Intern--2027-_R146933";
    const res = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const text = await res.text();
    console.log("JobPosting:", text.includes("JobPosting"));
    console.log("ld+json:", text.includes("ld+json"));
}
check();