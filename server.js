const express = require("express");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");

const app = express();

app.get("/", (req, res) => {
  res.send("M3U8 Scraper API Running");
});

app.get("/scrape", async (req, res) => {

  const url = req.query.url;
  if (!url) return res.json({ error: "Missing url parameter" });

  let browser;

  try {

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();

    let m3u8 = null;

    page.on("request", request => {
      const r = request.url();
      if (r.includes(".m3u8")) m3u8 = r;
    });

    await page.goto(url, { waitUntil: "networkidle2" });

    await new Promise(r => setTimeout(r, 5000));

    await browser.close();

    res.json({ m3u8 });

  } catch (err) {

    if (browser) await browser.close();
    res.json({ error: err.message });

  }

});

app.listen(3000, () => {
  console.log("Server running");
});
