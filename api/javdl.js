import axios from "axios";
import * as cheerio from "cheerio";

export default async function handler(req, res) {
  const url = req.query.url;

  if (!url)
    return res.status(400).json({ code: 400, msg: "URL tidak boleh kosong" });

  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      }
    });

    const $ = cheerio.load(data);

    const title = $('div.headline h1').text().trim();
    const uploader = $('.block-user .username a').text().trim();
    const views = $('.info .item span:contains("Views:") em').text().trim();
    const submitted = $('.info .item span:contains("Submitted:") em').text().trim();
    const description = $('.videodesc em').text().trim();

    const categories = [];
    $('.info .item:contains("Categories:") a').each((_, el) => {
      categories.push($(el).text().trim());
    });

    const screenshots = [];
    $('#tab_screenshots .block-screenshots a').each((_, el) => {
      const img = $(el).attr('href');
      if (img) screenshots.push(img);
    });

    const videoSources = {
      "480p": data.match(/video_url:\s*'([^']+)'/)?.[1],
      "720p": data.match(/video_alt_url:\s*'([^']+)'/)?.[1],
      "1080p": data.match(/video_alt_url2:\s*'([^']+)'/)?.[1]
    };

    res.status(200).json({
      code: 200,
      title,
      uploader,
      views,
      submitted,
      description,
      categories,
      screenshots,
      videoSources
    });

  } catch (error) {
    console.error("Error scraping:", error.message);
    res.status(500).json({ code: 500, msg: "Gagal mengambil data dari URL" });
  }
}
