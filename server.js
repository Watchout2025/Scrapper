const express = require("express");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const axios = require("axios");

const app = express();

app.get("/", (req, res) => {
  res.send("M3U8 Scraper + Proxy API Running");
});


/* SCRAPER */

app.get("/scrape", async (req, res) => {

  const url = req.query.url;
  if (!url) return res.json({ error: "Missing url parameter" });

  let browser;

  try {

    browser = await puppeteer.launch({
      args: chromium.args,
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


/* PROXY */

app.get("/proxy/*", async (req, res) => {

  const targetUrl = req.params[0];

  try {

    const response = await axios.get(targetUrl, {
      headers: {
        "Referer": "https://hdstream4u.com/",
        "Origin": "https://hdstream4u.com",
        "User-Agent": "Mozilla/5.0"
      }
    });

    let data = response.data;

    if (targetUrl.includes(".m3u8")) {

      const base = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);

      data = data.split("\n").map(line => {

        if (
          line.endsWith(".ts") ||
          line.endsWith(".m4s") ||
          line.endsWith(".aac") ||
          line.endsWith(".m3u8")
        ) {

          const absolute = line.startsWith("http")
            ? line
            : base + line;

          return `/proxy/${absolute}`;

        }

        return line;

      }).join("\n");

      res.set("Content-Type", "application/vnd.apple.mpegurl");

    }

    res.set("Access-Control-Allow-Origin", "*");

    res.send(data);

  } catch (err) {

    res.status(500).send("Proxy error");

  }

});


app.listen(3000, () => {
  console.log("Server running on port 3000");
});
