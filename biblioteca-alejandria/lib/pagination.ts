import { MAX_PAGE_SIZE } from "@/lib/validations/rules";

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function buildSafePagination(page: number, pageSize: number) {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;
  return { safePage, safePageSize, from, to };
}

export function normalizePagination<T>(
  data: T[],
  count: number,
  safePage: number,
  safePageSize: number
): PaginationMeta & { data: T[] } {
  const totalCount = count || 0;
  return {
    data,
    total: totalCount,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.ceil(totalCount / safePageSize),
  };
}