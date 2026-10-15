import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { parseWibEndTime } from "@/lib/event-ad-time";

import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/admin-auth";
import {
  adEndTimeFromPath,
  EVENT_AD_BUCKET,
  EVENT_AD_TYPES,
  MAX_EVENT_AD_BYTES,
} from "@/lib/event-ads";
import { createAdminClient } from "@/utils/supabase/admin";

export const runtime = "nodejs";

async function authorized() {
  const cookieStore = await cookies();
  return isValidAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

function invalid(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isSupportedImage(buffer: Buffer, mime: string) {
  if (mime === "image/jpeg")
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  if (mime === "image/png")
    return (
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    );
  if (mime === "image/webp")
    return (
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    );
  return false;
}

export async function POST(request: Request) {
  if (!(await authorized())) return invalid("Unauthorized.", 401);

  try {
    const form = await request.formData();
    const image = form.get("image");
    const endTimeWib = form.get("endTimeWib");
    if (
      !(image instanceof File) ||
      !image.size ||
      image.size > MAX_EVENT_AD_BYTES ||
      !(image.type in EVENT_AD_TYPES)
    ) {
      return invalid(
        "Gambar wajib JPG, PNG, atau WebP dengan ukuran maksimal 4 MB.",
      );
    }
    const endTime =
      typeof endTimeWib === "string" ? parseWibEndTime(endTimeWib) : null;
    if (!endTime || endTime.getTime() <= Date.now()) {
      return invalid(
        "Waktu selesai harus valid dan lebih dari waktu sekarang (WIB).",
      );
    }

    const bytes = Buffer.from(await image.arrayBuffer());
    if (!isSupportedImage(bytes, image.type))
      return invalid("Isi file bukan gambar sesuai format yang dipilih.");

    const admin = createAdminClient();
    const { data: bucket, error: bucketError } =
      await admin.storage.getBucket(EVENT_AD_BUCKET);
    if (
      bucketError &&
      bucketError.status !== 404 &&
      bucketError.statusCode !== "404"
    ) {
      throw bucketError;
    }
    if (!bucket) {
      const { error: creationError } = await admin.storage.createBucket(
        EVENT_AD_BUCKET,
        {
          public: true,
          allowedMimeTypes: Object.keys(EVENT_AD_TYPES),
          fileSizeLimit: MAX_EVENT_AD_BYTES,
        },
      );
      if (creationError) {
        // A concurrent first upload may have created the bucket already.
        const { data: existing, error: lookupError } =
          await admin.storage.getBucket(EVENT_AD_BUCKET);
        if (!existing || lookupError) throw creationError;
        if (!existing.public)
          return invalid(
            "Bucket iklan harus public agar gambar dapat dilihat customer.",
            500,
          );
      }
    } else if (!bucket.public) {
      return invalid(
        "Bucket iklan harus public agar gambar dapat dilihat customer.",
        500,
      );
    }

    const extension = EVENT_AD_TYPES[image.type as keyof typeof EVENT_AD_TYPES];
    const path = `end-${endTime.getTime()}-${randomUUID()}.${extension}`;
    const storage = admin.storage.from(EVENT_AD_BUCKET);
    const { error: uploadError } = await storage.upload(path, bytes, {
      contentType: image.type,
      cacheControl: "3600",
      upsert: false,
    });
    if (uploadError) throw uploadError;

    return NextResponse.json({
      ad: {
        path,
        url: storage.getPublicUrl(path).data.publicUrl,
        endTime: endTime.toISOString(),
      },
    });
  } catch (error) {
    console.error("Gagal mengunggah iklan:", error);
    return invalid("Gagal mengunggah gambar iklan.", 500);
  }
}

export async function DELETE(request: Request) {
  if (!(await authorized())) return invalid("Unauthorized.", 401);

  const body: unknown = await request.json().catch(() => null);
  if (
    !body ||
    typeof body !== "object" ||
    !("path" in body) ||
    typeof body.path !== "string" ||
    adEndTimeFromPath(body.path) === null
  ) {
    return invalid("Path iklan tidak valid.");
  }

  try {
    const { error } = await createAdminClient()
      .storage.from(EVENT_AD_BUCKET)
      .remove([body.path]);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Gagal menghapus iklan:", error);
    return invalid("Gagal menghapus iklan.", 500);
  }
}
