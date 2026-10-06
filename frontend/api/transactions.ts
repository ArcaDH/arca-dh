import { parseKronorToOre } from "@/lib/money";
import type {
  Category,
  MonthlyPayment,
  NewTag,
  NewTransaction,
  Tag,
  Transaction,
  TransactionFilters,
} from "@/types/transaction";
import { requestHelper } from "./request";

function monthRange(month: string): { from: string; to: string } {
  const [year, m] = month.split("-").map(Number);
  const lastDay = new Date(year, m, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, "0")}` };
}

export const transactionsApi = {
  /** One month of transactions, narrowed down by the filters. */
  list: (month: string, filters: TransactionFilters, limit: number) => {
    const params = new URLSearchParams({
      ...monthRange(month),
      sort: filters.sort,
      dir: filters.dir,
      limit: String(limit),
    });
    if (filters.q.trim()) params.set("q", filters.q.trim());
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.tagIds.length > 0) {
      params.set("tagIds", filters.tagIds.join(","));
      params.set("tagMode", filters.tagMode);
    }
    const min = parseKronorToOre(filters.minKr);
    const max = parseKronorToOre(filters.maxKr);
    if (min !== null) params.set("minAmount", String(min));
    if (max !== null) params.set("maxAmount", String(max));
    return requestHelper<{ items: Transaction[]; hasMore: boolean }>(`/transactions?${params}`);
  },

  monthTotal: (month: string) =>
    requestHelper<{ month: string; total: number }>(`/transactions/summary?month=${month}`),

  formOptions: () => requestHelper<{ categories: Category[]; tags: Tag[] }>("/transactions/form-options"),

  create: (body: NewTransaction) =>
    requestHelper<Transaction>("/transactions", { method: "POST", body: JSON.stringify(body) }),

  remove: (id: string, stopRecurring: boolean) =>
    requestHelper<void>(`/transactions/${id}?stopRecurring=${stopRecurring}`, { method: "DELETE" }),

  createTag: (body: NewTag) => requestHelper<Tag>("/tags", { method: "POST", body: JSON.stringify(body) }),

  monthlyPayments: () => requestHelper<MonthlyPayment[]>("/recurring"),

  stopMonthlyPayment: (id: string) => requestHelper<void>(`/recurring/${id}/stop`, { method: "POST" }),
};
