const sharp = require('sharp');

const BROWSERLESS_SCREENSHOT_URL =
  'https://production-sfo.browserless.io/screenshot?token=2ULh6TR70PG4MZBd9ff4f234e5c9be89e01bb5d3751963082';

module.exports = async function handler(req, res) {
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
    const { html, width, height, quality, deviceScaleFactor: bodyDsf } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'No HTML provided' });
    }

    const fallbackW = quality === 'email' ? 1280 : 1920;
    const fallbackH = quality === 'email' ? 720 : 1080;
    const viewportWidth = typeof width === 'number' && width > 0 ? width : fallbackW;
    const viewportHeight = typeof height === 'number' && height > 0 ? height : fallbackH;

    let deviceScaleFactor;
    if (typeof bodyDsf === 'number' && bodyDsf > 0) {
      deviceScaleFactor = bodyDsf;
    } else {
      deviceScaleFactor = quality === 'print' ? 2 : quality === 'email' ? 1 : 1.5;
    }

    const jpegQuality = quality === 'print' ? 95 : quality === 'email' ? 60 : 80;

    const response = await fetch(BROWSERLESS_SCREENSHOT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html,
        options: { type: 'png', fullPage: true },
        viewport: {
          width: viewportWidth,
          height: viewportHeight,
          deviceScaleFactor,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Browserless error: ${response.status} - ${errText}`);
    }

    const screenshot = await response.arrayBuffer();
    const compressed = await sharp(Buffer.from(screenshot))
      .jpeg({ quality: jpegQuality })
      .toBuffer();
    const base64 = compressed.toString('base64');

    res.setHeader('Content-Type', 'application/json');
    return res.json({
      image: base64,
      width: viewportWidth,
      height: viewportHeight,
      format: 'jpeg',
    });
  } catch (error) {
    console.error('Screenshot generation error:', error);
    return res.status(500).json({ error: error.message });
  }
};
