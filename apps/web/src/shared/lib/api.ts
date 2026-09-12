import type { ZodType } from "zod";
import { config } from "@/app/config";
import { useAccountStore } from "@/stores/account.store";

export class ApiError extends Error {}

export async function api<T>(
  path: string,
  schema: ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${config.apiUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      token: useAccountStore.getState().token,
      ...init?.headers,
    },
  });

  const body = await response.json();

  if (!response.ok) {
    throw new ApiError(body?.error ?? `Request failed with ${response.status}`);
  }

  return schema.parse(body);
}
