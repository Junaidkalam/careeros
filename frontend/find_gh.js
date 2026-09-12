async function check() {
    const urls = [
        "https://job-boards.greenhouse.io/anthropic/jobs/5183044008",
        "https://job-boards.greenhouse.io/reddit/jobs/7669372"
    ];
    for (const u of urls) {
        try {
            const res = await fetch(u);
            const text = await res.text();
            console.log(u, "JobPosting:", text.includes("JobPosting"));
        } catch(e){}
    }
}
check();