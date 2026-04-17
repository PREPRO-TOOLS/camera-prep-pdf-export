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
      `https://production-sfo.browserless.io/pdf?token=2ULh6TR70PG4MZBd9ff4f234e5c9be89e01bb5d3751963082`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: html,
          options: {
            landscape: true,
            printBackground: true,
            width: width || 1400,
            height: height || 900,
            scale: 2,
            pageRanges: '1',
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Browserless error: ${response.status}`);
    }

    const pdf = await response.arrayBuffer();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=camera-plot.pdf');
    return res.send(Buffer.from(pdf));

  } catch (error) {
    console.error('PDF generation error:', error);
    return res.status(500).json({ error: error.message });
  }
};
