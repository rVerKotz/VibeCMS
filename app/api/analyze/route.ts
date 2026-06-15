/* ./app/api/analyze/route.ts */
import '@/core/audit-init.ts';
import process from "node:process";
import { NextResponse } from "next/server";
import { audit } from "intelligent-audit-trail";

/**
 * POST API handler to process analysis requests and forward them to a Python (FastAPI) service.
 * * Workflow:
 * 1. Extracts the JSON payload from the client (Dashboard) request.
 * 2. Forwards the request to the Python backend via the specified URL.
 * 3. Injects the `VIBE_AI_INTERNAL_TOKEN` into the `X-Vibe-Token` header for internal authentication.
 * 4. Handles errors if the Python service fails and returns an appropriate response to the client.
 *
 * @param request - The standard Web `Request` object sent by the client (containing a JSON body).
 * @returns A Promise resolving to a `NextResponse`. Contains the analyzed JSON data on success, or error details on failure.
 */
export const POST = audit(
  async function ArticleTrendAnalyzer(request: Request) {
    try {
      const body = await request.json();
      const PYTHON_SERVICE_URL = "http://localhost:10000/analyze";
      const API_TOKEN = process.env.VIBE_AI_INTERNAL_TOKEN;

      const pythonResponse = await fetch(PYTHON_SERVICE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Vibe-Token": API_TOKEN ?? '', 
        },
        body: JSON.stringify(body),
      });

      if (!pythonResponse.ok) {
        const errorText = await pythonResponse.text();
        return NextResponse.json(
          { error: "Python service returned an error", details: errorText },
          { status: pythonResponse.status } as Record<string, unknown>
        );
      }

      const data = await pythonResponse.json();
      return NextResponse.json(data);
    } catch (error: unknown) {
      console.error("API Route Analyze Error:", error);
      return NextResponse.json(
        { error: "Internal Server Error", message: error instanceof Error ? error.message : "Unknown error" },
        { status: 500 } as Record<string, unknown>
      );
    }
  }, 
  { resource: 'Analyze' }
);