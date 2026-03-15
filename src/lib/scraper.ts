import * as cheerio from "cheerio";
import { Client, TakeOptions } from "screenshotone-api-sdk";

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
  const [html, screenshotBase64] = await Promise.all([
    fetchHtml(url),
    takeScreenshot(url),
  ]);

  const $ = cheerio.load(html);

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
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(30000),
  });
  return response.text();
}

async function takeScreenshot(url: string): Promise<string> {
  const client = new Client(
    process.env.SCREENSHOTONE_ACCESS_KEY!,
    process.env.SCREENSHOTONE_SECRET_KEY!,
  );

  const options = TakeOptions.url(url)
    .format("jpeg")
    .imageQuality(70)
    .viewportWidth(1280)
    .viewportHeight(800)
    .fullPage(false)
    .blockAds(true)
    .blockCookieBanners(true)
    .timeout(15);

  const blob = await client.take(options);
  const buffer = Buffer.from(await blob.arrayBuffer());
  return buffer.toString("base64");
}
