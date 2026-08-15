export const DEFAULT_PAYMENT_GATEWAY_ENABLED = true;
export const PAYMENT_PROOF_BUCKET = "payment-proofs";

export interface PaymentGatewaySettings {
  paymentGatewayEnabled: boolean;
}

export interface StoreSettingsRowLike {
  tax_percentage?: number | null;
  service_charge_percentage?: number | null;
  weekend_days?: number[] | null;
  payment_gateway_enabled?: boolean | null;
}

export function getPaymentGatewayEnabled(
  row?: Pick<StoreSettingsRowLike, "payment_gateway_enabled"> | null,
) {
  return row?.payment_gateway_enabled ?? DEFAULT_PAYMENT_GATEWAY_ENABLED;
}
