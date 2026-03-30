import { Client, TakeOptions } from "screenshotone-api-sdk";

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

export default takeScreenshot;
