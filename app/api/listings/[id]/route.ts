import { NextResponse } from "next/server";
import { getListingByZpid, zillowRowToPropertyListing } from "@/lib/zillowListings";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, context: RouteContext) {
  const { id: raw } = await context.params;
  const id = decodeURIComponent(raw).trim();
  if (!id) {
    return NextResponse.json({ error: "Missing listing id." }, { status: 400 });
  }

  const row = getListingByZpid(id);
  if (!row) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  return NextResponse.json(zillowRowToPropertyListing(row));
}
