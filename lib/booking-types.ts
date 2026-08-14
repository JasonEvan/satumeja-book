export interface RateItem {
  minHour: number;
  maxHour: number;
  rate: number;
}

export interface RatesData {
  weekday: RateItem[];
  weekend: RateItem[];
}

export interface TableItem {
  id: number | string;
  label: string;
  name: string;
  outletId?: string;
}

export interface VoucherItem {
  type: "percent" | "flat";
  value: number;
  label: string;
}

export interface StoreSettingsData {
  taxPercentage: number;
  serviceChargePercentage: number;
  weekendDays: number[];
}
