import { NextResponse } from "next/server";

const CORS_ORIGIN = process.env.PUBLIC_API_CORS_ORIGIN || "*";

/**
 * Public GET responses are cached at the edge and stale-revalidated, so a
 * storefront can hammer these endpoints cheaply.
 */
export function publicJson(body: unknown, maxAge = 60, swr = 300) {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": `public, s-maxage=${maxAge}, stale-while-revalidate=${swr}`,
      "Access-Control-Allow-Origin": CORS_ORIGIN,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export function publicError(message: string, status = 400) {
  return NextResponse.json(
    { error: { message } },
    { status, headers: { "Access-Control-Allow-Origin": CORS_ORIGIN } },
  );
}

export function corsPreflight() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": CORS_ORIGIN,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
