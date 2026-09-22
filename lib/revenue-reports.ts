import { createAdminClient } from "@/utils/supabase/admin";

export const REPORT_TIME_ZONE = "Asia/Jakarta";
const REPORT_OUTLET_ID = "f86dbefa-46c2-446d-ae8f-8b0e0aeecd8b";

export type RevenueSource = "fnb" | "rental";

export interface RentalMenuAllocation {
  menuItemId: string;
  menuItemName: string;
  amount: number;
}

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
  rentalMenuAllocations?: RentalMenuAllocation[];
}

export interface RentalMenuRevenue {
  menuItemId: string;
  menuItemName: string;
  revenue: number;
  bookings: number;
}

type MenuItemRow = {
  name?: string | null;
  item_type?: string | null;
  categories?:
    | { name?: string | null; icon_key?: string | null }
    | { name?: string | null; icon_key?: string | null }[]
    | null;
};

type OrderItemRow = {
  menu_item_id: string | null;
  quantity: number | string | null;
  unit_price: number | string | null;
  menu_items: MenuItemRow | MenuItemRow[] | null;
};

type OrderRow = {
  id: string;
  order_number: string | null;
  table_name: string | null;
  total: number | string | null;
  created_at: string;
  payment_status: string | null;
  payments: { method?: string | null } | { method?: string | null }[] | null;
  order_items: OrderItemRow[] | null;
};

function list<T>(value: T | T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function numberValue(value: number | string | null): number {
  const result = typeof value === "number" ? value : Number(value);
  return Number.isFinite(result) ? result : 0;
}

function isRentalMenuItem(item: OrderItemRow): boolean {
  const menuItem = list(item.menu_items)[0];
  const category = list(menuItem?.categories)[0];

  return (
    menuItem?.item_type === "rental" ||
    category?.icon_key === "rental" ||
    category?.name?.toLowerCase() === "rental"
  );
}

/**
 * This deliberately mirrors the owner dashboard in Flow POS:
 * - revenue comes from paid orders, never the operational rentals table;
 * - a rental order has no table_name;
 * - the reporting date is orders.created_at (formatted/bucketed as WIB later).
 */
export async function getRevenueTransactions(): Promise<RevenueTransaction[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select(
      "id, order_number, table_name, total, created_at, payment_status, payments(method), order_items(menu_item_id, quantity, unit_price, menu_items(name, item_type, categories(name, icon_key)))",
    )
    .eq("outlet_id", REPORT_OUTLET_ID)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Gagal memuat pendapatan: ${error.message}`);
  }

  return ((data ?? []) as OrderRow[])
    .filter((order) => order.payment_status !== "unpaid")
    .map((order) => {
      const source: RevenueSource =
        order.table_name === null ? "rental" : "fnb";
      const rentalItems = list(order.order_items).filter(isRentalMenuItem);
      const lineTotal = rentalItems.reduce(
        (total, item) =>
          total + numberValue(item.quantity) * numberValue(item.unit_price),
        0,
      );
      let remaining = numberValue(order.total);

      const rentalMenuAllocations = rentalItems.map((item, index) => {
        const lineValue =
          numberValue(item.quantity) * numberValue(item.unit_price);
        const amount =
          index === rentalItems.length - 1
            ? remaining
            : lineTotal > 0
              ? Math.trunc((numberValue(order.total) * lineValue) / lineTotal)
              : 0;
        remaining -= amount;
        const menuItem = list(item.menu_items)[0];

        return {
          menuItemId: item.menu_item_id || "unknown",
          menuItemName: menuItem?.name || "Menu rental tidak diketahui",
          amount,
        };
      });

      return {
        id: order.id,
        source,
        occurredAt: order.created_at,
        amount: numberValue(order.total),
        reference: order.order_number || order.id.slice(0, 8),
        description: source === "rental" ? "Rental" : "Pesanan FnB",
        // Flutter uses the most recent payment when more than one is returned.
        paymentMethod: list(order.payments).at(-1)?.method ?? null,
        rentalMenuAllocations:
          source === "rental" ? rentalMenuAllocations : undefined,
      };
    });
}

/** Turns each proportional allocation into a row for the rental-menu report. */
export function getRentalMenuTransactions(
  transactions: RevenueTransaction[],
): RevenueTransaction[] {
  return transactions.flatMap((transaction) => {
    if (transaction.source !== "rental") return [];

    return (transaction.rentalMenuAllocations ?? []).map((allocation, index) => ({
      ...transaction,
      id: `${transaction.id}-${index}`,
      amount: allocation.amount,
      description: "Rental",
      menuItemId: allocation.menuItemId,
      menuItemName: allocation.menuItemName,
      rentalMenuAllocations: undefined,
    }));
  });
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
