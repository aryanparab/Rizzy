// app/api/persona/route.ts
import { NextResponse } from "next/server";


export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log(body)

    const response = await fetch("http://localhost:8000/create_persona", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await response.json();
   

    return NextResponse.json(result, { status: response.status });
  } catch (err) {
    console.error("API Proxy Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
