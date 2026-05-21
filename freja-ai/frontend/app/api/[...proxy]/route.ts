import { NextRequest } from "next/server";

function backendUrl() {
  if (process.env.NODE_ENV === "production" && process.env.BACKEND_INTERNAL_URL) {
    return process.env.BACKEND_INTERNAL_URL;
  }
  if (process.env.NODE_ENV === "production") {
    return "http://backend:8000";
  }
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
}

async function proxy(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  const params = await context.params;
  const path = params.proxy.join("/");
  const url = new URL(request.url);
  const target = `${backendUrl()}/${path}${url.search}`;
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");

  try {
    return await fetch(target, {
      method: request.method,
      headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.text(),
    });
  } catch (error) {
    return Response.json(
      {
        error: "backend_unavailable",
        message: error instanceof Error ? error.message : "Unable to reach backend",
      },
      { status: 503 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
