import { createAdminClient } from "@/utils/supabase/admin";

export const REPORT_TIME_ZONE = "Asia/Jakarta";
const REPORT_OUTLET_ID = "f86dbefa-46c2-446d-ae8f-8b0e0aeecd8b";

export type RevenueSource = "fnb" | "rental";

export interface RevenueTransaction {
  id: string;
  source: RevenueSource;
  occurredAt: string;
  amount: number;
  reference: string;
  description: string;
  paymentMethod: string | null;
  menuItemId?: string | null;
  menuItemName?: string | null;
}

export interface RentalMenuRevenue {
  menuItemId: string;
  menuItemName: string;
  revenue: number;
  bookings: number;
}

type OrderRow = {
  id: string;
  order_number: string | null;
  total: number | string | null;
  created_at: string;
  payment_status: string | null;
  payments: { method?: string | null } | { method?: string | null }[] | null;
};

type RentalRow = {
  id: string;
  gross_amount: number | string | null;
  started_at: string | null;
  actual_ended_at: string | null;
  payment_method: string | null;
  assets:
    | {
        menu_item_id?: string | null;
        asset_name?: string | null;
        menu_items?:
          | { name?: string | null }
          | { name?: string | null }[]
          | null;
      }
    | {
        menu_item_id?: string | null;
        asset_name?: string | null;
        menu_items?:
          | { name?: string | null }
          | { name?: string | null }[]
          | null;
      }[]
    | null;
};

function first<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

function numberValue(value: number | string | null): number {
  const result = typeof value === "number" ? value : Number(value);
  return Number.isFinite(result) ? result : 0;
}

/**
 * POS rows count as revenue only after a payment record exists. Rental rows
 * count only when the operational rental has been completed. All timestamps
 * remain ISO/UTC here; presentation and period bucketing convert to WIB.
 */
export async function getRevenueTransactions(): Promise<RevenueTransaction[]> {
  const admin = createAdminClient();
  const [ordersResult, rentalsResult] = await Promise.all([
    admin
      .from("orders")
      .select(
        "id, order_number, total, created_at, payment_status, payments!inner(method)",
      )
      .eq("outlet_id", REPORT_OUTLET_ID)
      .order("created_at", { ascending: false }),
    admin
      .from("rentals")
      .select(
        "id, gross_amount, started_at, actual_ended_at, payment_method, assets(menu_item_id, asset_name, menu_items(name))",
      )
      .eq("outlet_id", REPORT_OUTLET_ID)
      .eq("status", "completed")
      .order("actual_ended_at", { ascending: false }),
  ]);

  if (ordersResult.error) {
    throw new Error(
      `Gagal memuat pendapatan FnB: ${ordersResult.error.message}`,
    );
  }

  if (rentalsResult.error) {
    throw new Error(
      `Gagal memuat pendapatan rental: ${rentalsResult.error.message}`,
    );
  }

  const fnb = ((ordersResult.data ?? []) as OrderRow[]).map((order) => {
    const payment = first(order.payments);

    return {
      id: order.id,
      source: "fnb" as const,
      occurredAt: order.created_at,
      amount: numberValue(order.total),
      reference: order.order_number || order.id.slice(0, 8),
      description: "Pesanan FnB",
      paymentMethod: payment?.method ?? null,
    };
  });

  const rentals = ((rentalsResult.data ?? []) as RentalRow[]).flatMap(
    (rental) => {
      const asset = first(rental.assets);
      const menuItem = first(asset?.menu_items);
      // A completed rental without either timestamp cannot be placed in a period.
      const occurredAt = rental.actual_ended_at || rental.started_at;

      if (!occurredAt) return [];

      return [
        {
          id: rental.id,
          source: "rental" as const,
          occurredAt,
          amount: numberValue(rental.gross_amount),
          reference: rental.id.slice(0, 8),
          description: asset?.asset_name || "Rental",
          paymentMethod: rental.payment_method,
          menuItemId: asset?.menu_item_id ?? null,
          menuItemName: menuItem?.name || "Menu rental tidak diketahui",
        },
      ];
    },
  );

  return [...fnb, ...rentals].sort(
    (a, b) =>
      new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
}

export function summarizeRentalMenuRevenue(
  transactions: RevenueTransaction[],
): RentalMenuRevenue[] {
  const grouped = new Map<string, RentalMenuRevenue>();

  for (const transaction of transactions) {
    if (transaction.source !== "rental") continue;

    const menuItemId = transaction.menuItemId || "unknown";
    const current = grouped.get(menuItemId) || {
      menuItemId,
      menuItemName: transaction.menuItemName || "Menu rental tidak diketahui",
      revenue: 0,
      bookings: 0,
    };
    current.revenue += transaction.amount;
    current.bookings += 1;
    grouped.set(menuItemId, current);
  }

  return [...grouped.values()].sort((a, b) => b.revenue - a.revenue);
}

export function formatWibDateTime(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: REPORT_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}
