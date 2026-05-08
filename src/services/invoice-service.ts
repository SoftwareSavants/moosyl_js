import { Endpoints, Fetcher, FetcherResponse } from "../helpers/fetcher.js";
import { InvoiceModel } from "../models/invoice-model.js";
import {
  PaginatedResponse,
  PaginationModel,
} from "../models/pagination-model.js";

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
 * Service for listing invoices.
 */
export class InvoiceService {
  constructor(public readonly secretApiKey: string) {}

  async list(params?: {
    id?: string;
    externalUserId?: string;
    subscriptionId?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<InvoiceModel>> {
    const result = await new Fetcher(this.secretApiKey).get(
      Endpoints.invoices(params)
    );
    const { list, pagination } = unwrapList(result);
    return {
      data: list.map((i) => InvoiceModel.fromMap(i)),
      pagination: PaginationModel.fromMap(pagination),
    };
  }
}
