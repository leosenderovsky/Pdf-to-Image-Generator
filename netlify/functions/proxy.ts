import type { Handler, HandlerEvent } from '@netlify/functions'

const handler: Handler = async (event: HandlerEvent) => {
  const targetUrl = event.queryStringParameters?.url

  if (!targetUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing url parameter' }),
    }
  }

  let decodedUrl: string
  try {
    decodedUrl = decodeURIComponent(targetUrl)
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid url encoding' }),
    }
  }

  if (!decodedUrl.startsWith('http://') && !decodedUrl.startsWith('https://')) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Only http/https URLs allowed' }),
    }
  }

  try {
    const response = await fetch(decodedUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PDF-Proxy/1.0)',
        'Accept': 'application/pdf,application/octet-stream,*/*',
      },
      redirect: 'follow',
    })

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Upstream returned ${response.status}` }),
      }
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
      body: base64,
      isBase64Encoded: true,
    }
  } catch (err) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Failed to fetch upstream', detail: String(err) }),
    }
  }
}

export { handler }
