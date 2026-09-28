/* Best-effort India pincode → State/City auto-fill (see AGENTS.md task spec,
 * item 4). Backed by India Post's public pincode API — there's no offline
 * pincode→location dataset already in this project, and bundling one (India
 * alone has ~19k pincodes) isn't the "smallest reliable implementation" this
 * one convenience feature calls for. This route exists so that external call
 * happens server-side (avoids exposing/CORS-ing a third-party API straight
 * from the browser, and keeps the lookup URL out of client code).
 *
 * This is a UX convenience only — never the sole way to fill State/City (the
 * caller's dropdowns remain fully manual), and failure here must never break
 * the surrounding form: always resolves, never throws, worst case
 * `{ found: false }`. */
import { NextResponse } from "next/server";
import { isPincode } from "@/lib/validate";

const LOOKUP_TIMEOUT_MS = 5000;

interface PostOffice {
  District: string;
  State: string;
}

export async function GET(req: Request) {
  const pincode = new URL(req.url).searchParams.get("pincode") ?? "";
  if (!isPincode(pincode)) return NextResponse.json({ found: false });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS);
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (!res.ok) return NextResponse.json({ found: false });
    const data = (await res.json()) as { Status: string; PostOffice: PostOffice[] | null }[];
    const postOffice = data[0]?.PostOffice?.[0];
    if (data[0]?.Status !== "Success" || !postOffice) return NextResponse.json({ found: false });

    return NextResponse.json({ found: true, state: postOffice.State, city: postOffice.District });
  } catch {
    // Network error, timeout, or malformed response — degrade to manual entry.
    return NextResponse.json({ found: false });
  }
}
