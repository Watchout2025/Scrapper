const express = require("express");
const axios = require("axios");

const app = express();

app.get("/", (req, res) => {
  res.send("Dynamic HLS Proxy Running");
});

app.get("/proxy/*", async (req, res) => {

  const target = req.params[0];

  if (!target) return res.send("Missing URL");

  try {

    /* extract domain dynamically */

    const urlObj = new URL(target);
    const origin = urlObj.origin;
    const referer = origin + "/";

    const response = await axios.get(target, {
      responseType: "arraybuffer",
      headers: {
        "Referer": referer,
        "Origin": origin,
        "User-Agent": "Mozilla/5.0"
      }
    });

    res.set("Access-Control-Allow-Origin", "*");

    /* handle m3u8 playlists */

    if (target.includes(".m3u8")) {

      let data = response.data.toString();

      const base = target.substring(0, target.lastIndexOf("/") + 1);

      data = data.split("\n").map(line => {

        /* rewrite audio/subtitle playlists */

        if (line.includes('URI="')) {

          return line.replace(/URI="([^"]+)"/, (match, uri) => {

            const absolute = uri.startsWith("http")
              ? uri
              : base + uri;

            return `URI="/proxy/${absolute}"`;

          });

        }

        /* rewrite nested playlists */

        if (line.endsWith(".m3u8")) {

          const absolute = line.startsWith("http")
            ? line
            : base + line;

          return `/proxy/${absolute}`;

        }

        /* rewrite segments */

        if (
          line.endsWith(".ts") ||
          line.endsWith(".m4s") ||
          line.endsWith(".aac")
        ) {

          const absolute = line.startsWith("http")
            ? line
            : base + line;

          return `/proxy/${absolute}`;

        }

        return line;

      }).join("\n");

      res.set("Content-Type", "application/vnd.apple.mpegurl");

      return res.send(data);
    }

    /* return video segments */

    res.set("Content-Type", response.headers["content-type"]);
    res.send(response.data);

  } catch (err) {

    res.status(500).send("Proxy error");

  }

});

app.listen(3000, () => {
  console.log("Proxy server running on port 3000");
});
