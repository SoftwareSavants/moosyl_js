/**
 * Pagination metadata returned from list endpoints.
 */
export class PaginationModel {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly totalPages: number;

  constructor(options: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }) {
    this.page = options.page;
    this.limit = options.limit;
    this.total = options.total;
    this.totalPages = options.totalPages;
  }

  static fromMap(map: Record<string, unknown>): PaginationModel {
    const toNum = (v: unknown): number =>
      typeof v === "number" ? v : Number(v ?? 0);
    return new PaginationModel({
      page: toNum(map.page),
      limit: toNum(map.limit),
      total: toNum(map.total),
      totalPages: toNum(map.totalPages),
    });
  }
}

/**
 * Generic paginated response wrapper.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationModel;
}
