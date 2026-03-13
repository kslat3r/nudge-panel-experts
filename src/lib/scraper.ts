import puppeteer from "puppeteer";
import * as cheerio from "cheerio";

export interface ScrapedPage {
  url: string;
  title: string;
  metaDescription: string;
  headings: { level: string; text: string }[];
  bodyText: string;
  links: { text: string; href: string }[];
  images: { alt: string; src: string }[];
  ctaButtons: string[];
  screenshotBase64: string;
}

export async function scrapeLandingPage(url: string): Promise<ScrapedPage> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    // Take screenshot
    const screenshotBuffer = await page.screenshot({
      fullPage: true,
      type: "png",
    });
    const screenshotBase64 = Buffer.from(screenshotBuffer).toString("base64");

    // Get HTML content
    const html = await page.content();
    const $ = cheerio.load(html);

    // Extract page data
    const title = $("title").text().trim();
    const metaDescription =
      $('meta[name="description"]').attr("content")?.trim() ?? "";

    const headings: { level: string; text: string }[] = [];
    $("h1, h2, h3, h4, h5, h6").each((_, el) => {
      headings.push({
        level: $(el).prop("tagName")?.toLowerCase() ?? "",
        text: $(el).text().trim(),
      });
    });

    // Extract visible body text (truncated)
    const bodyText = $("body")
      .text()
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000);

    const links: { text: string; href: string }[] = [];
    $("a").each((_, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr("href") ?? "";
      if (text && href) links.push({ text, href });
    });

    const images: { alt: string; src: string }[] = [];
    $("img").each((_, el) => {
      images.push({
        alt: $(el).attr("alt") ?? "",
        src: $(el).attr("src") ?? "",
      });
    });

    // Find CTA-like buttons
    const ctaButtons: string[] = [];
    $('button, a[class*="btn"], a[class*="button"], a[class*="cta"], input[type="submit"]').each(
      (_, el) => {
        const text = $(el).text().trim() || $(el).attr("value") || "";
        if (text) ctaButtons.push(text);
      }
    );

    return {
      url,
      title,
      metaDescription,
      headings,
      bodyText,
      links: links.slice(0, 50),
      images: images.slice(0, 30),
      ctaButtons,
      screenshotBase64,
    };
  } finally {
    await browser.close();
  }
}
