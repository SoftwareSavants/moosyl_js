import { Endpoints, Fetcher, FetcherResponse } from "../helpers/fetcher.js";
import {
  ProductModel,
  ProductWithPricesModel,
} from "../models/product-model.js";
import {
  PaginatedResponse,
  PaginationModel,
} from "../models/pagination-model.js";

function unwrapData(result: FetcherResponse): Record<string, unknown> {
  const data = result.data as
    | { data?: unknown }
    | Record<string, unknown>
    | undefined;
  const payload =
    data && typeof data === "object" && "data" in data ? data.data : data;
  return typeof payload === "object" && payload !== null
    ? (payload as Record<string, unknown>)
    : {};
}

function unwrapList(result: FetcherResponse): {
  list: Record<string, unknown>[];
  pagination: Record<string, unknown>;
} {
  const body = (result.data as Record<string, unknown>) ?? {};
  const rawList = body.data;
  const list = Array.isArray(rawList)
    ? rawList.filter(
        (item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null
      )
    : [];
  const pagination =
    typeof body.pagination === "object" && body.pagination !== null
      ? (body.pagination as Record<string, unknown>)
      : {};
  return { list, pagination };
}

/**
 * Service for managing products and their prices.
 */
export class ProductService {
  constructor(public readonly secretApiKey: string) {}

  async list(params?: {
    id?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ProductWithPricesModel>> {
    const result = await new Fetcher(this.secretApiKey).get(
      Endpoints.products(params)
    );
    const { list, pagination } = unwrapList(result);
    return {
      data: list.map((p) => ProductWithPricesModel.fromMap(p)),
      pagination: PaginationModel.fromMap(pagination),
    };
  }

  async get(id: string): Promise<ProductWithPricesModel> {
    const result = await new Fetcher(this.secretApiKey).get(
      Endpoints.product(id)
    );
    return ProductWithPricesModel.fromMap(unwrapData(result));
  }

  async create(data: {
    name: string;
    description?: string;
  }): Promise<ProductModel> {
    const result = await new Fetcher(this.secretApiKey).post(
      Endpoints.products(),
      data as unknown as Record<string, unknown>
    );
    return ProductModel.fromMap(unwrapData(result));
  }

  async update(
    id: string,
    data: { name?: string; description?: string; active?: boolean }
  ): Promise<ProductModel> {
    const result = await new Fetcher(this.secretApiKey).patch(
      Endpoints.product(id),
      data as unknown as Record<string, unknown>
    );
    return ProductModel.fromMap(unwrapData(result));
  }

  async archive(id: string): Promise<{ success: boolean }> {
    const result = await new Fetcher(this.secretApiKey).patch(
      Endpoints.archiveProduct(id)
    );
    const body = (result.data as Record<string, unknown>) ?? {};
    return { success: Boolean(body.success ?? result.success) };
  }
}
