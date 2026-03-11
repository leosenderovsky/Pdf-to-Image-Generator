// Netlify Function: netlify/functions/pdf-proxy.js
// Deploy by adding to your repo; Netlify will auto-detect functions in /netlify/functions

exports.handler = async function(event, context) {
  const url = event.queryStringParameters && event.queryStringParameters.url;
  if (!url) {
    return { statusCode: 400, body: 'Missing url parameter' };
  }

  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    const contentType = (res.headers.get('content-type') || '').toLowerCase();
    const arrayBuffer = await res.arrayBuffer();

    // If Google Drive returned an HTML confirmation page (not the PDF),
    // try to detect the confirm token and re-request the download URL.
    const isDrive = url.includes('drive.google.com') || url.includes('docs.google.com');
    if (isDrive && contentType.includes('text/html')) {
      const html = Buffer.from(arrayBuffer).toString('utf8');

      // Attempt several strategies to extract confirm token and file id
      let confirm = null;
      let id = null;

      // 1) look for /uc?export=download&amp;confirm=TOKEN&amp;id=FILEID
      let m = html.match(/\/uc\?export=download&amp;confirm=([^"'&>]+)&amp;id=([^"'&>]+)/);
      if (m) {
        confirm = m[1];
        id = m[2];
      }

      // 2) look for confirm=TOKEN&amp;id=FILEID
      if (!confirm || !id) {
        m = html.match(/confirm=([^"'&>]+)&amp;id=([^"'&>]+)/);
        if (m) {
          confirm = m[1];
          id = m[2];
        }
      }

      // 3) look for inputs: name="confirm" value="TOKEN" and name="id" value="FILEID"
      if (!confirm || !id) {
        const mc = html.match(/name=\"confirm\"[^>]*value=\"([^\"]+)\"/i);
        const mi = html.match(/name=\"id\"[^>]*value=\"([^\"]+)\"/i);
        if (mc) confirm = mc[1];
        if (mi) id = mi[1];
      }

      // 4) fallback: extract id from original URL if present
      if (!id) {
        const mId = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (mId) id = mId[1];
        else {
          try {
            const u = new URL(url);
            id = u.searchParams.get('id') || id;
          } catch (e) {}
        }
      }

      if (confirm && id) {
        const confirmUrl = `https://drive.google.com/uc?export=download&confirm=${confirm}&id=${id}`;
        const finalRes = await fetch(confirmUrl, { method: 'GET', redirect: 'follow' });
        const finalContentType = finalRes.headers.get('content-type') || 'application/octet-stream';
        const finalBuffer = await finalRes.arrayBuffer();
        const finalBody = Buffer.from(finalBuffer).toString('base64');

        return {
          statusCode: finalRes.status,
          headers: {
            'Content-Type': finalContentType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
          },
          body: finalBody,
          isBase64Encoded: true
        };
      }
      // else fallthrough and return the original HTML response below
    }

    const body = Buffer.from(arrayBuffer).toString('base64');
    return {
      statusCode: res.status,
      headers: {
        'Content-Type': res.headers.get('content-type') || 'application/octet-stream',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body,
      isBase64Encoded: true
    };
  } catch (err) {
    return { statusCode: 500, body: 'Error fetching target: ' + String(err) };
  }
};
