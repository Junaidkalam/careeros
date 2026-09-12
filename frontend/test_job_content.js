async function test() {
    const url = "https://boards.greenhouse.io/figma/jobs/5813967004";
    const res = await fetch(url);
    const text = await res.text();
    console.log("Has application/ld+json:", text.includes("application/ld+json"));
    console.log("Has JobPosting:", text.includes("JobPosting"));
}
test();