// Vercel Serverless Function: api/pdf-proxy.js
// Deploy by adding to your repo on Vercel. URL: https://your-app.vercel.app/api/pdf-proxy?url=...

export default async function handler(req, res) {
  const url = req.query.url || req.body?.url;
  if (!url) {
    res.status(400).send('Missing url parameter');
    return;
  }

  try {
    const upstream = await fetch(url, { method: 'GET', redirect: 'follow' });
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    res.status(upstream.status).send(buffer);
  } catch (err) {
    res.status(500).send('Error fetching target: ' + String(err));
  }
}
