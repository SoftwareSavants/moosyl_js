import { Endpoints, Fetcher, FetcherResponse } from "../helpers/fetcher.js";
import {
  CreateSubscriptionByExternalUserRequest,
  CreateSubscriptionRequest,
  SubscriptionModel,
  SubscriptionStatus,
} from "../models/subscription-model.js";
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
 * Service for managing subscriptions.
 */
export class SubscriptionService {
  constructor(public readonly secretApiKey: string) {}

  async list(params?: {
    status?: SubscriptionStatus;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<SubscriptionModel>> {
    const result = await new Fetcher(this.secretApiKey).get(
      Endpoints.subscriptions(params)
    );
    const { list, pagination } = unwrapList(result);
    return {
      data: list.map((s) => SubscriptionModel.fromMap(s)),
      pagination: PaginationModel.fromMap(pagination),
    };
  }

  async get(id: string): Promise<SubscriptionModel> {
    const result = await new Fetcher(this.secretApiKey).get(
      Endpoints.subscription(id)
    );
    return SubscriptionModel.fromMap(unwrapData(result));
  }

  async create(data: CreateSubscriptionRequest): Promise<SubscriptionModel> {
    const result = await new Fetcher(this.secretApiKey).post(
      Endpoints.subscriptions(),
      data as unknown as Record<string, unknown>
    );
    return SubscriptionModel.fromMap(unwrapData(result));
  }

  async createByExternalUser(
    data: CreateSubscriptionByExternalUserRequest
  ): Promise<SubscriptionModel> {
    const result = await new Fetcher(this.secretApiKey).post(
      Endpoints.subscriptionByExternalUserCreate(),
      data as unknown as Record<string, unknown>
    );
    return SubscriptionModel.fromMap(unwrapData(result));
  }

  async getByExternalUser(externalUserId: string): Promise<SubscriptionModel> {
    const result = await new Fetcher(this.secretApiKey).get(
      Endpoints.subscriptionByExternalUser(externalUserId)
    );
    return SubscriptionModel.fromMap(unwrapData(result));
  }

  async cancel(id: string): Promise<SubscriptionModel> {
    const result = await new Fetcher(this.secretApiKey).post(
      Endpoints.cancelSubscription(id)
    );
    return SubscriptionModel.fromMap(unwrapData(result));
  }
}
