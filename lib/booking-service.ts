// ponytail: server-side Supabase data fetching queries for SSR
import { createClient } from "@/utils/supabase/server";
import { TableItem, RatesData, VoucherItem } from "@/app/booking-form";

const DEFAULT_RATES: RatesData = {
  weekday: [
    { minHour: 1, maxHour: 1, rate: 45000 },
    { minHour: 2, maxHour: 2, rate: 40000 },
    { minHour: 3, maxHour: Infinity, rate: 35000 },
  ],
  weekend: [
    { minHour: 1, maxHour: 1, rate: 55000 },
    { minHour: 2, maxHour: 2, rate: 50000 },
    { minHour: 3, maxHour: Infinity, rate: 45000 },
  ],
};

export async function getTables(): Promise<TableItem[]> {
  try {
    const supabase = await createClient();
    const { data: dbTables } = await supabase
      .from("tables")
      .select("*")
      .eq("is_active", true);

    if (dbTables && dbTables.length > 0) {
      return dbTables.map((t: { id: number | string; name?: string }) => {
        const rawName = t.name ? t.name.toString() : `Meja ${t.id}`;
        return {
          id: t.id,
          label: rawName,
          name: rawName,
        };
      });
    }
  } catch {
    // Fallback if DB fetch fails
  }

  return [1, 2, 3, 4, 5, 6].map((n) => ({
    id: n,
    label: `Meja ${n}`,
    name: `Meja ${n}`,
  }));
}

export async function getRates(): Promise<RatesData> {
  try {
    const supabase = await createClient();
    const { data: rulesData } = await supabase
      .from("rental_pricing_rules")
      .select(
        "id, day_type, rental_pricing_tiers (id, from_hour, to_hour, price_per_hour, tier_order)"
      );

    if (rulesData && rulesData.length > 0) {
      const weekday: { minHour: number; maxHour: number; rate: number }[] = [];
      const weekend: { minHour: number; maxHour: number; rate: number }[] = [];

      rulesData.forEach(
        (rule: {
          day_type: string;
          rental_pricing_tiers?: Array<{
            from_hour?: number | null;
            to_hour?: number | null;
            price_per_hour: number;
            tier_order?: number;
          }>;
        }) => {
          const tiersList = rule.rental_pricing_tiers || [];
          tiersList.forEach((t) => {
            const item = {
              minHour: t.from_hour ?? 1,
              maxHour: t.to_hour ?? Infinity,
              rate: Number(t.price_per_hour),
            };
            if (rule.day_type === "weekend") {
              weekend.push(item);
            } else {
              weekday.push(item);
            }
          });
        }
      );

      if (weekday.length > 0 || weekend.length > 0) {
        return {
          weekday:
            weekday.length > 0
              ? weekday.sort((a, b) => a.minHour - b.minHour)
              : DEFAULT_RATES.weekday,
          weekend:
            weekend.length > 0
              ? weekend.sort((a, b) => a.minHour - b.minHour)
              : DEFAULT_RATES.weekend,
        };
      }
    }
  } catch {
    // Fallback to DEFAULT_RATES
  }

  return DEFAULT_RATES;
}

export async function getVouchers(): Promise<Record<string, VoucherItem>> {
  try {
    const supabase = await createClient();
    const { data: dbVouchers } = await supabase
      .from("vouchers")
      .select("*")
      .eq("is_active", true);

    if (dbVouchers && dbVouchers.length > 0) {
      const vouchersObj: Record<string, VoucherItem> = {};
      dbVouchers.forEach(
        (v: {
          code: string;
          discount_type: string;
          discount_value: number;
          description?: string;
        }) => {
          const isPercent =
            v.discount_type === "percent" || v.discount_type === "percentage";
          vouchersObj[v.code.toUpperCase()] = {
            type: isPercent ? "percent" : "flat",
            value: Number(v.discount_value),
            label:
              v.description ||
              (isPercent
                ? `${v.discount_value}% off`
                : `Rp${v.discount_value} off`),
          };
        }
      );
      return vouchersObj;
    }
  } catch {
    // Return empty object if fetch fails
  }

  return {};
}
