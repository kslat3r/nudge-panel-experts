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
}

export async function scrapeLandingPage(url: string): Promise<ScrapedPage> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
    signal: AbortSignal.timeout(30000),
  });

  const html = await response.text();
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
  };
}
