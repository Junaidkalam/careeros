export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export interface ApiErrorResponse {
  status: number;
  error: string;
  detail: string;
}

export class ApiError extends Error {
  public status: number;
  public error: string;
  public detail: string;

  constructor(response: ApiErrorResponse) {
    super(response.detail || response.error || 'Unknown error');
    this.name = 'ApiError';
    this.status = response.status;
    this.error = response.error;
    this.detail = response.detail;
  }
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (window.__token) {
    headers['Authorization'] = `Bearer ${window.__token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorData: ApiErrorResponse;
    try {
      errorData = await response.json();
    } catch {
      errorData = {
        status: response.status,
        error: response.statusText,
        detail: 'An unexpected error occurred.',
      };
    }
    throw new ApiError(errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

declare global {
  interface Window {
    __token: string | null;
  }
}