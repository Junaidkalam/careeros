async function search() {
  const html = await (await fetch("https://boards.greenhouse.io/figma")).text();
  const match = html.match(/href="([^"]+jobs\/\d+[^"]*)"/);
  if (match) {
    console.log("Found URL snippet:", match[1]);
  } else {
    console.log("No jobs found");
    const twitchHtml = await (await fetch("https://boards.greenhouse.io/twitch")).text();
    console.log(twitchHtml.match(/href="([^"]+jobs\/\d+[^"]*)"/)?.[1]);
  }
}
search();