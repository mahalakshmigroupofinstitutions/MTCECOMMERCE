/* Feeds the City dropdown once a State is chosen. Same public, read-only,
 * offline-dataset shape as /api/location/states. */
import { NextResponse } from "next/server";
import { getCitiesForState } from "@/lib/location";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const country = params.get("country");
  const state = params.get("state");
  if (!country || !state) return NextResponse.json({ error: "missing country/state" }, { status: 400 });
  return NextResponse.json(getCitiesForState(country, state));
}
