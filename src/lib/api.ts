const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;

export type Kind = "income" | "expense";

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  kind: Kind;
  created_at: string;
};

export type Transaction = {
  id: string;
  amount: number;
  category_id: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  kind: Kind;
  note: string;
  date: string;
  created_at: string;
};

export type CategorySummary = {
  category_id: string;
  category_name: string;
  category_color: string;
  category_icon: string;
  total: number;
  count: number;
};

export type MonthlyPoint = { month: string; income: number; expense: number; net: number };

export type Totals = {
  month_expense: number;
  month_income: number;
  month_net: number;
  month_count: number;
  all_time_expense: number;
  all_time_income: number;
  all_time_net: number;
  current_month: string;
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  listCategories: (kind?: Kind) =>
    request<Category[]>(`/categories${kind ? `?kind=${kind}` : ""}`),
  createCategory: (data: { name: string; icon?: string; color?: string; kind?: Kind }) =>
    request<Category>("/categories", { method: "POST", body: JSON.stringify(data) }),
  deleteCategory: (id: string) =>
    request<{ ok: boolean }>(`/categories/${id}`, { method: "DELETE" }),

  listExpenses: (params?: { month?: string; kind?: Kind }) => {
    const q = new URLSearchParams();
    if (params?.month) q.set("month", params.month);
    if (params?.kind) q.set("kind", params.kind);
    const s = q.toString();
    return request<Transaction[]>(`/expenses${s ? `?${s}` : ""}`);
  },
  createExpense: (data: {
    amount: number;
    category_id: string;
    kind?: Kind;
    note?: string;
    date?: string;
  }) =>
    request<Transaction>("/expenses", { method: "POST", body: JSON.stringify(data) }),
  deleteExpense: (id: string) =>
    request<{ ok: boolean }>(`/expenses/${id}`, { method: "DELETE" }),

  summaryByCategory: (params?: { month?: string; kind?: Kind }) => {
    const q = new URLSearchParams();
    if (params?.month) q.set("month", params.month);
    if (params?.kind) q.set("kind", params.kind);
    const s = q.toString();
    return request<CategorySummary[]>(`/summary/by-category${s ? `?${s}` : ""}`);
  },
  summaryMonthly: (months: number = 6) =>
    request<MonthlyPoint[]>(`/summary/monthly?months=${months}`),
  summaryTotals: () => request<Totals>("/summary/totals"),
};

export function formatDKK(amount: number): string {
  return `kr. ${amount.toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatSignedDKK(amount: number): string {
  const sign = amount < 0 ? "-" : amount > 0 ? "+" : "";
  return `${sign}${formatDKK(Math.abs(amount))}`;
}

export function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function formatMonthLabel(m: string): string {
  const [y, mo] = m.split("-");
  const date = new Date(Number(y), Number(mo) - 1, 1);
  return date.toLocaleString("en-US", { month: "short" });
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
