import { getTokenFromCookie } from "./cookies";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://arca-dh-main.onrender.com";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private async send<T>(path: string, init: RequestInit): Promise<T> {
    const token = getTokenFromCookie();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
      ...(token ? { Authorization: token } : {}),
    };

    const res = await fetch(`${this.baseUrl}${path}`, { ...init, headers });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new ApiError(body?.message ?? "Request failed", res.status);
    }

    return res.status === 204 ? (undefined as T) : res.json();
  }

  get<T>(path: string, init?: Omit<RequestInit, "method" | "body">): Promise<T> {
    return this.send<T>(path, { ...init, method: "GET" });
  }

  post<T>(path: string, body?: unknown, init?: Omit<RequestInit, "method" | "body">): Promise<T> {
    return this.send<T>(path, {
      ...init,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: unknown, init?: Omit<RequestInit, "method" | "body">): Promise<T> {
    return this.send<T>(path, {
      ...init,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: unknown, init?: Omit<RequestInit, "method" | "body">): Promise<T> {
    return this.send<T>(path, {
      ...init,
      method: "PATCH",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string, init?: Omit<RequestInit, "method">): Promise<T> {
    return this.send<T>(path, { ...init, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
