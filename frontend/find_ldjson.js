async function check() {
    const urls = [
        "https://jobs.apple.com/en-us/details/200540453/software-engineer",
        "https://careers.microsoft.com/us/en/job/1749524/Software-Engineer",
        "https://www.amazon.jobs/en/jobs/2594611/software-development-engineer",
        "https://jobs.netflix.com/jobs/328221191",
        "https://boards.greenhouse.io/discord/jobs/5239327",
        "https://careers.twitter.com/en/work-for-twitter/202403-software-engineer-machine-learning.html",
        "https://careers.airbnb.com/positions/5878433/",
        "https://jobs.lever.co/figma/eb4578b7-6b66-419b-a36c-95b8d002b4d9"
    ];
    for (const u of urls) {
        try {
            console.log("Checking:", u);
            const res = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
            if (!res.ok) continue;
            const text = await res.text();
            if (text.includes("JobPosting")) {
                console.log("==> FOUND at", u);
                return;
            }
        } catch(e) {}
    }
}
check();