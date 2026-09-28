/* Feeds the State dropdown once a Country is chosen. Public, read-only,
 * offline dataset — no auth needed, same as the country list would be if it
 * weren't small enough to inline into the page directly. */
import { NextResponse } from "next/server";
import { getStatesForCountry } from "@/lib/location";

export async function GET(req: Request) {
  const country = new URL(req.url).searchParams.get("country");
  if (!country) return NextResponse.json({ error: "missing country" }, { status: 400 });
  return NextResponse.json(getStatesForCountry(country));
}
