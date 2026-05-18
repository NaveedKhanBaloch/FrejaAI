import { NextRequest } from "next/server";

async function proxy(request: NextRequest, context: { params: Promise<{ proxy: string[] }> }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  const params = await context.params;
  const path = params.proxy.join("/");
  const url = new URL(request.url);
  const target = `${apiUrl}/${path}${url.search}`;
  try {
    return await fetch(target, {
      method: request.method,
      headers: request.headers,
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
