// Netlify Function: netlify/functions/pdf-proxy.js
// Deploy by adding to your repo; Netlify will auto-detect functions in /netlify/functions

exports.handler = async function(event, context) {
  const url = event.queryStringParameters && event.queryStringParameters.url;
  if (!url) {
    return { statusCode: 400, body: 'Missing url parameter' };
  }

  try {
    const res = await fetch(url, { method: 'GET', redirect: 'follow' });
    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await res.arrayBuffer();
    const body = Buffer.from(arrayBuffer).toString('base64');

    return {
      statusCode: res.status,
      headers: {
        'Content-Type': contentType,
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
