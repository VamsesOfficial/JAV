import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const keyword = req.query.keyword;

  if (!keyword)
    return res.status(400).json({ code: 400, msg: "keyword tidak boleh kosong" });

  try {
    const response = await axios.get(
      `https://www.javbangers.com/search/${keyword}/`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      }
    );

    const html = response.data;
    const $ = cheerio.load(html);
    const results = [];

    $(".video-item").each((i, el) => {
      results.push({
        title: $(el).find("p.inf a").text().trim(),
        url: $(el).find("a.thumb").attr("href") || null,
        thumbnail: $(el).find("img.cover").data("original"),
        duration: $(el).find(".durations").text().trim(),
        views: $(el).find(".viewsthumb").text().trim(),
        rating: $(el).find("ul.list-unstyled li.pull-right").text().trim(),
      });
    });

    // ⛔ jika hasil kosong
    if (results.length === 0) {
      return res
        .status(404)
        .json({ code: 404, msg: "Tidak ada hasil untuk keyword tersebut" });
    }

    res.status(200).json({
      code: 200,
      results,
    });
  } catch (err) {
    console.log("Scraping failed:", err.message);
    res.status(500).json({ code: 500, msg: "Gagal mengambil data" });
  }
}
