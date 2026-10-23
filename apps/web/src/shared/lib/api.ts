import type { ZodType } from "zod";
import { config } from "@/app/config";
import { useAccountStore } from "@/stores/account.store";

export class ApiError extends Error {}

function createAuthHeaders(token: string): Record<string, string> {
  if (!token) return {};
  return { token, Authorization: `Bearer ${token}` };
}

function checkAuthStatus(status: number): void {
  const isAuthError = status === 401 || status === 403;
  if (isAuthError && useAccountStore.getState().token) {
    useAccountStore.getState().clearToken();
  }
}

export async function api<T>(
  path: string,
  schema: ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const token = useAccountStore.getState().token;
  const authHeaders = createAuthHeaders(token);

  const response = await fetch(`${config.apiUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...init?.headers,
    },
  });

  checkAuthStatus(response.status);

  const body = await response.json();

  if (!response.ok) {
    throw new ApiError(body?.error ?? body?.message ?? `Request failed with ${response.status}`);
  }

  return schema.parse(body);
}

