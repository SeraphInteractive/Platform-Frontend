export interface ApiErrorResponse {
  error?: {
    code: string;
    message: string;
    status?: number;
  };
  errors?: Array<{ message: string; field?: string }>;
  message?: string;
}

const DEFAULT_API_URL = (import.meta as unknown as { env: { VITE_API_URL?: string } }).env?.VITE_API_URL || '/api/v1';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('mcs_api_base_url');
    // Clear out deprecated Google Cloud IP if stored
    if (saved && (saved.includes('35.192.18.39') || saved.includes('undefined') || saved.includes('null'))) {
      localStorage.removeItem('mcs_api_base_url');
      return DEFAULT_API_URL;
    }
    if (saved) return saved;
  }
  return DEFAULT_API_URL;
}

export function setApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (!url || url.includes('35.192.18.39')) {
      localStorage.removeItem('mcs_api_base_url');
    } else {
      localStorage.setItem('mcs_api_base_url', url);
    }
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${cleanEndpoint}`;

  const token = typeof window !== 'undefined' ? localStorage.getItem('mcs_auth_token') : null;

  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try {
      errorData = await response.json();
    } catch {
      // Non-JSON error
    }

    const message =
      errorData?.error?.message ||
      errorData?.message ||
      errorData?.errors?.[0]?.message ||
      `HTTP Error ${response.status}: ${response.statusText}`;

    const error = new Error(message) as Error & { status: number; code?: string };
    error.status = response.status;
    error.code = errorData?.error?.code;
    throw error;
  }

  if (response.status === 204) {
    return {} as T;
  }

  const json = await response.json();
  return (json.data !== undefined ? json.data : json) as T;
}
