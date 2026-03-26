import { NextResponse } from "next/server";
import { fetchSaleListingResult } from "@/lib/rentCastApi";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const apiKey = process.env.RENTCAST_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "RentCast API key is not configured." },
      { status: 503 },
    );
  }

  const { id: raw } = await context.params;
  const id = decodeURIComponent(raw).trim();
  if (!id) {
    return NextResponse.json({ error: "Missing listing id." }, { status: 400 });
  }

  const result = await fetchSaleListingResult(apiKey, id);
  if (!result.ok) {
    if (result.status === 404) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Unable to load listing." }, { status: 502 });
  }

  return NextResponse.json(result.listing);
}
