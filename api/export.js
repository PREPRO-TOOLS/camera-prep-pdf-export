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
    const { html, width, height } = req.body;

    if (!html) {
      return res.status(400).json({ error: 'No HTML provided' });
    }

    const response = await fetch(
      `https://production-sfo.browserless.io/screenshot?token=2ULh6TR70PG4MZBd9ff4f234e5c9be89e01bb5d3751963082`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: html,
          options: {
            type: 'png',
            fullPage: true,
          },
          viewport: {
            width: width || 1920,
            height: height || 1080,
            deviceScaleFactor: 2,
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Browserless error: ${response.status} - ${errText}`);
    }

    const screenshot = await response.arrayBuffer();
    const base64 = Buffer.from(screenshot).toString('base64');

    res.setHeader('Content-Type', 'application/json');
    return res.json({ image: base64, width: width || 1920, height: height || 1080 });

  } catch (error) {
    console.error('Screenshot generation error:', error);
    return res.status(500).json({ error: error.message });
  }
};
