// Helpers for seeding the backend during e2e runs.
//
// These talk directly to the backend REST API (the same one the app uses) to
// create a fresh user with a budget plan, a category and a transaction, then
// return the login token so a test can be authenticated without going through
// the login form every time.
//
// The backend base URL is taken from E2E_API_URL (falling back to the local
// docker-compose backend on :3001). Authenticated specs are skipped entirely
// when no backend is configured — see e2e/support/fixtures.ts.

export const API_URL = process.env.E2E_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type SeededUser = {
  id: number;
  token: string;
  email: string;
  password: string;
  username: string;
  planId: string;
  planName: string;
  categoryId: string;
  categoryName: string;
};

type RegisterBody = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
};

async function api<T>(path: string, init: RequestInit & { token?: string } = {}): Promise<T> {
  const { token, headers, ...rest } = init;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
      ...(headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${init.method ?? "GET"} ${path} failed: ${res.status} ${body}`);
  }

  // 201/204 responses may have no JSON body.
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

// A short unique suffix keeps each run's user/plan names from colliding.
// Username is capped at 20 chars and password at 18 by the backend validators.
function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`.slice(-10);
}

/**
 * Create a brand-new user with a plan (set as current), one category and one
 * transaction, and return the credentials + ids. Everything is created through
 * the public API so no database access is needed from the test runner.
 */
export async function seedUserWithPlan(): Promise<SeededUser> {
  const suffix = uniqueSuffix();
  const email = `e2e_${suffix}@example.com`;
  const username = `e2e_${suffix}`.slice(0, 20);
  const password = `Pw_${suffix}`.slice(0, 18);

  const registerBody: RegisterBody = {
    firstName: "E2E",
    lastName: "Tester",
    username,
    email,
    password,
  };

  await api<void>("/users", { method: "POST", body: JSON.stringify(registerBody) });

  const { id, token } = await api<{ id: number; token: string }>("/users/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  // Current month as YYYY-MM so the plan's data shows on the default view.
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const planName = `E2E Plan ${suffix}`;

  const plan = await api<{ id: string; name: string }>("/plans", {
    method: "POST",
    token,
    body: JSON.stringify({ name: planName, month }),
  });

  // Make it the user's current plan so the plan-scoped pages have data to load.
  await api<void>("/plans/current", {
    method: "PUT",
    token,
    body: JSON.stringify({ planId: plan.id }),
  });

  const categoryName = "Food";
  const category = await api<{ id: string; name: string }>(`/plans/${plan.id}/categories`, {
    method: "POST",
    token,
    body: JSON.stringify({ name: categoryName, maxBudget: "600.00" }),
  });

  // One expense so the transactions/overview pages aren't empty.
  await api<void>(`/plans/${plan.id}/transactions`, {
    method: "POST",
    token,
    body: JSON.stringify({
      amount: "-42.50",
      date: `${month}-15`,
      type: "EXPENSE",
      description: "Seed groceries",
      categoryId: category.id,
    }),
  });

  return {
    id,
    token,
    email,
    password,
    username,
    planId: plan.id,
    planName,
    categoryId: category.id,
    categoryName,
  };
}

/** True when a backend looks reachable; used to skip authed specs gracefully. */
export async function backendReachable(): Promise<boolean> {
  try {
    // Any response (even 404) means the server is up and answering.
    await fetch(`${API_URL}/plans/current`, { method: "GET" });
    return true;
  } catch {
    return false;
  }
}
