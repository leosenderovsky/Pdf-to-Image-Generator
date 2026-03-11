addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  try {
    const reqUrl = new URL(request.url);
    const target = reqUrl.searchParams.get('url');
    if (!target) return new Response('Missing url parameter', { status: 400 });

    // Basic validation
    const allowed = /^https?:\/\//i;
    if (!allowed.test(target)) return new Response('Invalid url', { status: 400 });

    const res = await fetch(target, { method: 'GET', redirect: 'follow' });
    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await res.arrayBuffer();

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return new Response(arrayBuffer, { status: res.status, headers });
  } catch (err) {
    return new Response('Error fetching target: ' + String(err), { status: 500 });
  }
}
