export type PriceInterval = "weekly" | "monthly" | "yearly";

/**
 * A price attached to a product.
 */
export class PriceModel {
  readonly id: string;
  readonly productId: string;
  readonly amount: number;
  readonly interval: PriceInterval;
  readonly active: boolean;
  readonly createdAt: string | null;

  constructor(options: {
    id: string;
    productId: string;
    amount: number;
    interval: PriceInterval;
    active: boolean;
    createdAt?: string | null;
  }) {
    this.id = options.id;
    this.productId = options.productId;
    this.amount = options.amount;
    this.interval = options.interval;
    this.active = options.active;
    this.createdAt = options.createdAt ?? null;
  }

  static fromMap(map: Record<string, unknown>): PriceModel {
    const amount = map.amount;
    return new PriceModel({
      id: String(map.id ?? ""),
      productId: String(map.productId ?? ""),
      amount: typeof amount === "number" ? amount : Number(amount ?? 0),
      interval: String(map.interval ?? "monthly") as PriceInterval,
      active: Boolean(map.active),
      createdAt: map.createdAt == null ? null : String(map.createdAt),
    });
  }
}

/**
 * A product offered to customers.
 */
export class ProductModel {
  readonly id: string;
  readonly organizationId: string;
  readonly environmentId: string | null;
  readonly name: string;
  readonly description: string | null;
  readonly active: boolean;
  readonly createdAt: string | null;

  constructor(options: {
    id: string;
    organizationId: string;
    environmentId?: string | null;
    name: string;
    description?: string | null;
    active: boolean;
    createdAt?: string | null;
  }) {
    this.id = options.id;
    this.organizationId = options.organizationId;
    this.environmentId = options.environmentId ?? null;
    this.name = options.name;
    this.description = options.description ?? null;
    this.active = options.active;
    this.createdAt = options.createdAt ?? null;
  }

  static fromMap(map: Record<string, unknown>): ProductModel {
    return new ProductModel({
      id: String(map.id ?? ""),
      organizationId: String(map.organizationId ?? ""),
      environmentId:
        map.environmentId == null ? null : String(map.environmentId),
      name: String(map.name ?? ""),
      description:
        map.description == null ? null : String(map.description),
      active: Boolean(map.active),
      createdAt: map.createdAt == null ? null : String(map.createdAt),
    });
  }
}

/**
 * Product enriched with its prices.
 */
export class ProductWithPricesModel extends ProductModel {
  readonly prices: PriceModel[];

  constructor(options: {
    id: string;
    organizationId: string;
    environmentId?: string | null;
    name: string;
    description?: string | null;
    active: boolean;
    createdAt?: string | null;
    prices: PriceModel[];
  }) {
    super(options);
    this.prices = options.prices;
  }

  static override fromMap(
    map: Record<string, unknown>
  ): ProductWithPricesModel {
    const base = ProductModel.fromMap(map);
    const rawPrices = map.prices;
    const prices: PriceModel[] = Array.isArray(rawPrices)
      ? rawPrices
          .filter(
            (p): p is Record<string, unknown> =>
              typeof p === "object" && p !== null
          )
          .map((p) => PriceModel.fromMap(p))
      : [];
    return new ProductWithPricesModel({
      id: base.id,
      organizationId: base.organizationId,
      environmentId: base.environmentId,
      name: base.name,
      description: base.description,
      active: base.active,
      createdAt: base.createdAt,
      prices,
    });
  }
}
