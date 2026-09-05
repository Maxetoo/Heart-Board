import { api, cleanParams } from '../lib/api';
import type { PaginationDTO, SubscriptionDTO } from '../types/api';

export async function getMySubscription() {
  const { data } = await api.get<{ subscription: SubscriptionDTO }>('/subscription/mine');
  return data.subscription ?? (data as unknown as SubscriptionDTO);
}

export async function verifyPurchase(appUserId: string, plan: string) {
  const { data } = await api.post<{ message: string; subscription: SubscriptionDTO }>(
    '/subscription/verify',
    { appUserId, plan },
  );
  return data;
}

export async function cancelSubscription() {
  const { data } = await api.post<{ message: string }>('/subscription/cancel', {});
  return data;
}

/** Admin only. */
export async function listSubscriptions(
  params: { plan?: string; status?: string; page?: number; limit?: number } = {},
) {
  const { data } = await api.get<{ subscriptions: SubscriptionDTO[]; pagination: PaginationDTO }>(
    '/subscription',
    { params: cleanParams({ page: 1, limit: 20, ...params }) },
  );
  return data;
}
