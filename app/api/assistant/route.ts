import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 2048,
        system: body.system,
        messages: body.messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic API error:", JSON.stringify(data));
      return NextResponse.json(
        { error: { message: data?.error?.message || `Erreur ${response.status}` } },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error("Route error:", error);
    return NextResponse.json(
      { error: { message: String(error) } },
      { status: 500 }
    );
  }
}
