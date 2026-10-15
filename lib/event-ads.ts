import { createAdminClient } from "@/utils/supabase/admin";

export const EVENT_AD_BUCKET = "event-ads";
export const MAX_EVENT_AD_BYTES = 4 * 1024 * 1024;
export const EVENT_AD_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export interface EventAd {
  path: string;
  url: string;
  endTime: string;
}

const AD_PATH_PATTERN =
  /^end-(\d{13,15})-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

export function adEndTimeFromPath(path: string): number | null {
  const match = AD_PATH_PATTERN.exec(path);
  if (!match) return null;
  const time = Number(match[1]);
  return Number.isFinite(time) && new Date(time).getTime() === time
    ? time
    : null;
}

export async function getEventAds({
  includeExpired = false,
}: { includeExpired?: boolean } = {}): Promise<EventAd[]> {
  const admin = createAdminClient();
  const bucket = admin.storage.from(EVENT_AD_BUCKET);
  const ads: EventAd[] = [];
  const now = Date.now();
  const pageSize = 100;

  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await bucket.list("", {
      limit: pageSize,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) {
      // A fresh deployment has no bucket until the first admin upload.
      const { data: existing, error: bucketError } =
        await admin.storage.getBucket(EVENT_AD_BUCKET);
      if (
        !existing &&
        (bucketError?.status === 404 || bucketError?.statusCode === "404")
      ) {
        return [];
      }
      throw error;
    }

    for (const file of data ?? []) {
      const endTime = adEndTimeFromPath(file.name);
      if (endTime === null || (!includeExpired && endTime <= now)) continue;
      ads.push({
        path: file.name,
        url: bucket.getPublicUrl(file.name).data.publicUrl,
        endTime: new Date(endTime).toISOString(),
      });
    }

    if (!data || data.length < pageSize) break;
  }

  return ads.sort(
    (a, b) =>
      Date.parse(a.endTime) - Date.parse(b.endTime) ||
      a.path.localeCompare(b.path),
  );
}
