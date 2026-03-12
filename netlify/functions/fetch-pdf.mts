import type { Config } from "@netlify/functions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalizeGoogleDriveUrl(url: string): string {
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
  } catch (_) {
    // ignore malformed URLs
  }
  return url;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async (req: Request): Promise<Response> => {
  // Allow CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get("url");

  if (!rawUrl) {
    return new Response(JSON.stringify({ error: "Missing 'url' query parameter" }), {
      status: 400,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }

  // Validate that the URL is actually http/https (block local/internal targets)
  let targetUrl: string;
  try {
    const parsed = new URL(rawUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("Invalid protocol");
    }
    targetUrl = normalizeGoogleDriveUrl(rawUrl);
  } catch (_) {
    return new Response(JSON.stringify({ error: "Invalid URL" }), {
      status: 400,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }

  // Fetch the remote PDF server-side (no browser CORS restrictions here)
  let response: Response;
  try {
    response = await fetch(targetUrl, {
      headers: {
        // Some servers require a User-Agent
        "User-Agent": "Mozilla/5.0 (compatible; PDF-Proxy/1.0)",
      },
      redirect: "follow",
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Failed to fetch remote URL: ${(err as Error).message}` }),
      {
        status: 502,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      }
    );
  }

  if (!response.ok) {
    return new Response(
      JSON.stringify({
        error: `Remote server returned ${response.status} ${response.statusText}`,
      }),
      {
        status: response.status,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      }
    );
  }

  // Verify the response looks like a PDF
  const contentType = response.headers.get("content-type") ?? "";
  const isLikelyPdf =
    contentType.includes("application/pdf") ||
    contentType.includes("application/octet-stream") ||
    contentType.includes("binary/octet-stream");

  // Stream the binary back to the browser with proper headers
  const body = await response.arrayBuffer();

  return new Response(body, {
    status: 200,
    headers: {
      ...corsHeaders(),
      "Content-Type": isLikelyPdf ? contentType : "application/pdf",
      "Content-Length": String(body.byteLength),
      // Don't cache sensitive documents
      "Cache-Control": "no-store",
    },
  });
};

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export const config: Config = {
  path: "/api/fetch-pdf",
};
