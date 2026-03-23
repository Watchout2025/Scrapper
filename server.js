const express = require("express");
const puppeteer = require("puppeteer");

const app = express();

app.get("/scrape", async (req, res) => {

  const url = req.query.url;

  if (!url) return res.json({ error: "Missing url" });

  let browser;

  try {

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox","--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();

    let m3u8 = null;

    page.on("request", request => {

      const reqUrl = request.url();

      if (reqUrl.includes(".m3u8")) {
        m3u8 = reqUrl;
      }

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

app.listen(3000, () => console.log("Server running"));
