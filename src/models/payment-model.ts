/**
 * Payment creation and Gimtel (bank transfer) models.
 */

/**
 * Status of a payment as reported by `GET /payment/{id}/status`.
 */
export type GimtelPaymentStatus =
  | "pending"
  | "completed"
  | "expired"
  | "cancelled"
  | "failed";

export const GIMTEL_PAYMENT_STATUSES: readonly GimtelPaymentStatus[] = [
  "pending",
  "completed",
  "expired",
  "cancelled",
  "failed",
];

/**
 * Maps a backend status string to a `GimtelPaymentStatus`. Unknown values map
 * to `"pending"` so that pollers keep polling (until `claimExpiresAt`) instead
 * of treating an unrecognised status as terminal.
 */
export function gimtelPaymentStatusFromString(
  status: unknown,
): GimtelPaymentStatus {
  return typeof status === "string" &&
    (GIMTEL_PAYMENT_STATUSES as readonly string[]).includes(status)
    ? (status as GimtelPaymentStatus)
    : "pending";
}

/**
 * Transfer instructions returned by `pay()` for Gimtel payment methods.
 */
export interface GimtelInstructions {
  readonly kind: "gimtel_transfer";
  /** Phone number (account) the payer must transfer to. */
  readonly receivingPhone: string;
  /** Bank that holds the receiving account. */
  readonly receivingBank: string;
  /** Exact amount the payer must transfer. */
  readonly amount: number;
  /** Phone number the transfer must come from. */
  readonly payerPhone: string;
  readonly paymentId: string;
  /** ISO timestamp after which the payment can no longer be claimed. */
  readonly claimExpiresAt: string;
}

/** Parameters for `pay()` (object form). */
export interface PayParams {
  /** Configuration ID from `getPaymentMethods()`. */
  configurationId: string;
  transactionId: string;
  /** Phone number the payer pays from. */
  phoneNumber: string;
  /** Native methods only (e.g. Bankily passcode). Omit for Gimtel methods; the key is not sent when undefined. */
  passCode?: string;
}

/** Payment returned by `pay()` (object form). */
export interface PayResult {
  id: string;
  /** Raw payment status (e.g. `"pending"`, `"completed"`). */
  status: string;
  referenceId: string | null;
  metadata?: Record<string, unknown>;
  /** Present for Gimtel methods: where and how much the payer must transfer. */
  instructions?: GimtelInstructions;
}

/** Result of `getPaymentStatus()`. */
export interface PaymentStatusResult {
  id: string;
  /** Normalised status; unknown backend values become `"pending"`. */
  status: GimtelPaymentStatus;
  /** Status string exactly as returned by the backend. */
  rawStatus: string;
  referenceId: string | null;
  /** ISO timestamp after which the payment can no longer be claimed (Gimtel only). */
  claimExpiresAt: string | null;
}

export type SimulateTransferOutcome = "matched" | "unmatched" | "skipped";

export const SIMULATE_TRANSFER_OUTCOMES: readonly SimulateTransferOutcome[] = [
  "matched",
  "unmatched",
  "skipped",
];

/** Result of `simulateTransfer()` (sandbox only). */
export interface SimulateTransferResult {
  outcome: SimulateTransferOutcome;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Returns the payment object from a response body, accepting both the bare
 * object and a `{ data: {...} }` envelope.
 */
export function unwrapPaymentBody(body: unknown): Record<string, unknown> {
  if (!isRecord(body)) return {};
  if (!("id" in body) && isRecord(body.data)) return body.data;
  return body;
}

function optionalString(value: unknown): string | null {
  return value == null ? null : String(value);
}

function nonEmptyString(value: unknown): string | undefined {
  if (typeof value === "number") return String(value);
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

/**
 * Parses Gimtel instructions. Returns `undefined` unless the fields a payer
 * needs are present: `receivingPhone`, `paymentId` and a finite `amount`
 * (a numeric string is accepted).
 */
export function gimtelInstructionsFromMap(
  value: unknown,
): GimtelInstructions | undefined {
  if (!isRecord(value)) return undefined;
  if (value.kind != null && value.kind !== "gimtel_transfer") return undefined;
  const receivingPhone = nonEmptyString(value.receivingPhone);
  const paymentId = nonEmptyString(value.paymentId);
  const amount =
    typeof value.amount === "number"
      ? value.amount
      : typeof value.amount === "string" && value.amount.trim() !== ""
        ? Number(value.amount)
        : NaN;
  if (!receivingPhone || !paymentId || !Number.isFinite(amount)) {
    return undefined;
  }
  return {
    kind: "gimtel_transfer",
    receivingPhone,
    receivingBank: String(value.receivingBank ?? ""),
    amount,
    payerPhone: String(value.payerPhone ?? ""),
    paymentId,
    claimExpiresAt: String(value.claimExpiresAt ?? ""),
  };
}

export function payResultFromMap(map: Record<string, unknown>): PayResult {
  const result: PayResult = {
    id: String(map.id ?? ""),
    status: String(map.status ?? ""),
    referenceId: optionalString(map.referenceId),
  };
  if (isRecord(map.metadata)) result.metadata = map.metadata;
  const instructions = gimtelInstructionsFromMap(map.instructions);
  if (instructions) result.instructions = instructions;
  return result;
}

export function paymentStatusResultFromMap(
  map: Record<string, unknown>,
): PaymentStatusResult {
  return {
    id: String(map.id ?? ""),
    status: gimtelPaymentStatusFromString(map.status),
    rawStatus: String(map.status ?? ""),
    referenceId: optionalString(map.referenceId),
    claimExpiresAt: optionalString(map.claimExpiresAt),
  };
}
