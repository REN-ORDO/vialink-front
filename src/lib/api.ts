const env = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;

export const BASE_URL = env.VITE_API_URL ?? 'http://localhost:3000';
export const WS_URL = env.VITE_WS_URL ?? 'ws://localhost:3000';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new ApiError(res.status, `${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}
