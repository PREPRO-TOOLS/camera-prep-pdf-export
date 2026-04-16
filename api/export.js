export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://camera-prep-go.base44.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const chromium = require('@sparticuz/chromium');
    const puppeteer = require('puppeteer-core');

    const { html, width, height } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'No HTML provided' });
    }

    const executablePath = await chromium.executablePath();

    const browser = await puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: width || 1400, height: height || 900 },
      executablePath: executablePath,
      headless: chromium.headless,
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
    return res.send(pdf);

  } catch (error) {
    console.error('PDF generation error:', error);
    return res.status(500).json({ error: error.message });
  }
}
