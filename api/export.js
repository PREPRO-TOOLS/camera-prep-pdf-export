const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { html, width, height } = req.body;

  if (!html) {
    return res.status(400).json({ error: 'No HTML provided' });
  }

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: width || 1400, height: height || 900 },
    executablePath: await chromium.executablePath(),
    headless: true,
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.waitForTimeout(1000);

  const pdf = await page.pdf({
    width: `${width || 1400}px`,
    height: `${height || 900}px`,
    printBackground: true,
    landscape: true,
  });

  await browser.close();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=camera-plot.pdf');
  res.send(pdf);
};
