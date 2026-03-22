const express = require("express");
const puppeteer = require("puppeteer");

const app = express();

app.get("/", (req,res)=>{
  res.send("Scraper running");
});

app.get("/scrape", async (req,res)=>{

  const url = req.query.url;

  let stream = null;

  const browser = await puppeteer.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox"
  ]
});

  const page = await browser.newPage();

  page.on("response", response=>{
    const u = response.url();
    if(u.includes(".m3u8")) stream = u;
  });

  await page.goto(url,{waitUntil:"networkidle2"});

  await page.waitForTimeout(5000);

  await browser.close();

  res.json({m3u8:stream});
});

app.listen(3000,()=>{
  console.log("Server running");
});
