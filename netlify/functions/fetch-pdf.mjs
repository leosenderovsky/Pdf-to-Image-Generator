/**
 * Netlify Function — PDF Proxy
 * Ruta: /api/fetch-pdf?url=<url_encoded>
 *
 * Hace el fetch del PDF server-side para evitar restricciones CORS del browser.
 * Compatible con Netlify Functions v2 (ES Module, sin dependencias externas).
 */

function normalizeGoogleDriveUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith("drive.google.com")) {
      const fileIdMatch = u.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (fileIdMatch) {
        return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
      }
      const id = u.searchParams.get("id");
      if (id) {
        return `https://drive.google.com/uc?export=download&id=${id}`;
      }
    }
  } catch (_) {}
  return url;
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async (req) => {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return new Response(
      JSON.stringify({ error: "Falta el parámetro 'url'" }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  // Validar protocolo (bloquear URLs internas/locales)
  let targetUrl;
  try {
    const parsed = new URL(rawUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Protocolo inválido");
    targetUrl = normalizeGoogleDriveUrl(rawUrl);
  } catch (_) {
    return new Response(
      JSON.stringify({ error: "URL inválida" }),
      { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  // Fetch server-side (sin restricciones CORS)
  let remoteRes;
  try {
    remoteRes = await fetch(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PDF-Proxy/1.0)" },
      redirect: "follow",
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `No se pudo conectar al servidor remoto: ${err.message}` }),
      { status: 502, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  if (!remoteRes.ok) {
    return new Response(
      JSON.stringify({ error: `El servidor remoto devolvió ${remoteRes.status} ${remoteRes.statusText}` }),
      { status: remoteRes.status, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }

  const contentType = remoteRes.headers.get("content-type") || "application/pdf";
  const body = await remoteRes.arrayBuffer();

  return new Response(body, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": contentType,
      "Content-Length": String(body.byteLength),
      "Cache-Control": "no-store",
    },
  });
};

export const config = {
  path: "/api/fetch-pdf",
};
