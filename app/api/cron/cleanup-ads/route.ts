import { EVENT_AD_BUCKET, getEventAds } from "@/lib/event-ads";
import { createAdminClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let scanned = 0;
  let expired = 0;
  let deleted = 0;

  try {
    // Re-list on every invocation so retries only target objects still in Storage.
    const ads = await getEventAds({ includeExpired: true });
    scanned = ads.length;
    const bucket = createAdminClient().storage.from(EVENT_AD_BUCKET);

    for (const ad of ads) {
      if (Date.now() < Date.parse(ad.endTime)) continue;
      expired++;
      const { error } = await bucket.remove([ad.path]);
      if (error) throw error;
      deleted++;
    }

    return Response.json({ scanned, expired, deleted });
  } catch (error) {
    console.error("Failed to clean up expired ads:", error);
    return Response.json(
      { error: "Failed to clean up expired ads.", scanned, expired, deleted },
      { status: 500 },
    );
  }
}
