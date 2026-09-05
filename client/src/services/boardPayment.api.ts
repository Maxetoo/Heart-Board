import { api, cleanParams } from '../lib/api';
import type { BoardTier, PaginationDTO } from '../types/api';

export interface BoardPaymentDTO {
  _id: string;
  board: string;
  user: string;
  fromTier: BoardTier;
  toTier: BoardTier;
  amount?: number;
  currency?: string;
  status: 'pending' | 'succeeded' | 'failed';
  createdAt: string;
}

/** Called after a RevenueCat purchase succeeds client-side. */
export async function createBoardUpgrade(boardId: string, toTier: BoardTier, appUserId: string) {
  const { data } = await api.post<{ message: string; payment: BoardPaymentDTO }>(
    `/board/payments/${boardId}/upgrade`,
    { toTier, appUserId },
  );
  return data;
}

export async function getBoardPayments(boardId: string) {
  const { data } = await api.get<{ payments: BoardPaymentDTO[] }>(
    `/board/payments/${boardId}/payments`,
  );
  return data.payments ?? [];
}

/** Admin only. */
export async function listAllBoardPayments(
  params: { page?: number; limit?: number; status?: string } = {},
) {
  const { data } = await api.get<{ payments: BoardPaymentDTO[]; pagination: PaginationDTO }>(
    '/board/payments/all',
    { params: cleanParams({ page: 1, limit: 20, ...params }) },
  );
  return data;
}
