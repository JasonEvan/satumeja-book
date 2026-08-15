import { PAYMENT_PROOF_BUCKET } from "@/lib/payment-settings";
import { createAdminClient } from "@/utils/supabase/admin";

export interface AdminBookingItem {
  id: string;
  customerName: string | null;
  customerPhone: string | null;
  startedAt: string | null;
  estimatedEndedAt: string | null;
  status: string | null;
  paymentMethod: string | null;
  paymentVerificationStatus: string | null;
  paymentProofPath: string | null;
  paymentProofMimeType: string | null;
  grossAmount: number | null;
  assetName: string | null;
  proofUrl: string | null;
}

interface RentalRow {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  started_at: string | null;
  estimated_ended_at: string | null;
  status: string | null;
  payment_method: string | null;
  payment_verification_status: string | null;
  payment_proof_path: string | null;
  payment_proof_mime_type: string | null;
  gross_amount: number | null;
  assets?:
    | {
        asset_name?: string | null;
      }
    | {
        asset_name?: string | null;
      }[]
    | null;
}

function normalizeAssetName(
  assets: RentalRow["assets"],
): string | null {
  if (!assets) {
    return null;
  }

  if (Array.isArray(assets)) {
    return assets[0]?.asset_name ?? null;
  }

  return assets.asset_name ?? null;
}

export async function getAdminBookings(): Promise<AdminBookingItem[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("rentals")
    .select(
      "id, customer_name, customer_phone, started_at, estimated_ended_at, status, payment_method, payment_verification_status, payment_proof_path, payment_proof_mime_type, gross_amount, assets(asset_name)",
    )
    .eq("payment_method", "manual_transfer")
    .order("started_at", { ascending: false })
    .limit(20);

  if (error || !data) {
    return [];
  }

  const rentals = data as RentalRow[];
  const proofPaths = rentals
    .map((item) => item.payment_proof_path)
    .filter((value): value is string => Boolean(value));

  const signedUrlMap = new Map<string, string | null>();

  await Promise.all(
    proofPaths.map(async (proofPath) => {
      const { data: signed, error: signedError } = await admin.storage
        .from(PAYMENT_PROOF_BUCKET)
        .createSignedUrl(proofPath, 60 * 60);

      signedUrlMap.set(
        proofPath,
        signedError ? null : signed?.signedUrl || null,
      );
    }),
  );

  return rentals.map((item) => ({
    id: item.id,
    customerName: item.customer_name,
    customerPhone: item.customer_phone,
    startedAt: item.started_at,
    estimatedEndedAt: item.estimated_ended_at,
    status: item.status,
    paymentMethod: item.payment_method,
    paymentVerificationStatus: item.payment_verification_status,
    paymentProofPath: item.payment_proof_path,
    paymentProofMimeType: item.payment_proof_mime_type,
    grossAmount:
      typeof item.gross_amount === "number" ? item.gross_amount : null,
    assetName: normalizeAssetName(item.assets),
    proofUrl: item.payment_proof_path
      ? signedUrlMap.get(item.payment_proof_path) || null
      : null,
  }));
}
