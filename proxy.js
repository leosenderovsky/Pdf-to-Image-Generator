import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());

app.get('/', (_req, res) => res.send('PDF proxy running'));

app.get('/api/fetch-pdf', async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'missing url parameter' });

  try {
    const remote = await fetch(String(url), { redirect: 'follow' });
    if (!remote.ok) return res.status(502).json({ error: `Upstream returned ${remote.status}` });

    const contentType = remote.headers.get('content-type') || 'application/octet-stream';
    const buf = Buffer.from(await remote.arrayBuffer());

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', String(buf.length));
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    res.status(200).send(buf);
  } catch (err) {
    res.status(502).json({ error: String(err) });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => console.log(`proxy listening on http://localhost:${port}`));
