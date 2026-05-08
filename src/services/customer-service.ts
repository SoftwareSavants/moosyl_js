import { Endpoints, Fetcher, FetcherResponse } from "../helpers/fetcher.js";
import { CustomerModel } from "../models/customer-model.js";
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
 * Service for managing customer records.
 */
export class CustomerService {
  constructor(public readonly secretApiKey: string) {}

  async list(params?: {
    id?: string;
    externalUserId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<CustomerModel>> {
    const result = await new Fetcher(this.secretApiKey).get(
      Endpoints.customers(params)
    );
    const { list, pagination } = unwrapList(result);
    return {
      data: list.map((c) => CustomerModel.fromMap(c)),
      pagination: PaginationModel.fromMap(pagination),
    };
  }

  async create(data: {
    externalUserId: string;
    phone?: string;
  }): Promise<CustomerModel> {
    const result = await new Fetcher(this.secretApiKey).post(
      Endpoints.customers(),
      data as unknown as Record<string, unknown>
    );
    return CustomerModel.fromMap(unwrapData(result));
  }

  async update(
    id: string,
    data: { externalUserId?: string; phone?: string }
  ): Promise<CustomerModel> {
    const result = await new Fetcher(this.secretApiKey).patch(
      Endpoints.customer(id),
      data as unknown as Record<string, unknown>
    );
    return CustomerModel.fromMap(unwrapData(result));
  }
}
