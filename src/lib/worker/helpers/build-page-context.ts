import { ScrapedPage } from "@/lib/worker/helpers/scrape-landing-page";

function buildPageContext(scrapedPage: ScrapedPage): string {
  return `
Landing Page URL: ${scrapedPage.url}
Page Title: ${scrapedPage.title}
Meta Description: ${scrapedPage.metaDescription}

Headings:
${scrapedPage.headings.map((h) => `  ${h.level}: ${h.text}`).join("\n")}

CTA Buttons Found:
${scrapedPage.ctaButtons.map((b) => `  - ${b}`).join("\n") || "  None found"}

Page Content (excerpt):
${scrapedPage.bodyText}

Links (sample):
${scrapedPage.links
  .slice(0, 20)
  .map((l) => `  - ${l.text}: ${l.href}`)
  .join("\n")}

Images:
${scrapedPage.images
  .slice(0, 15)
  .map((i) => `  - alt="${i.alt}" src="${i.src}"`)
  .join("\n")}
`.trim();
}

export default buildPageContext;
