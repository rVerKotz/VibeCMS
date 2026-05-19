import process from "node:process";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // 1. Ambil body dari request Dashboard (Client)
    const body = await request.json();

    // 2. Tentukan URL FastAPI (Bisa ditaruh di .env)
    const PYTHON_SERVICE_URL = "http://localhost:10000/analyze";
    
    // 3. Opsional: Tambahkan API Token Internal jika Anda ingin mengamankan FastAPI
    // Pastikan di sisi FastAPI juga mengecek header ini
    const API_TOKEN = process.env.VIBE_AI_INTERNAL_TOKEN;

    // 4. Forward request ke layanan Python
    const pythonResponse = await fetch(PYTHON_SERVICE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Vibe-Token": API_TOKEN ?? '', // Mengirim token ke backend Python
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

    // 5. Kembalikan hasil analisis ke Client
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("API Route Analyze Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 } as Record<string, unknown>
    );
  }
}