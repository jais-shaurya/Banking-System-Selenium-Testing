// CitiBank API Client Service

export interface User {
  id: number;
  name: string;
  email: string;
  phNumber: string;
}

export interface Account {
  id: number;
  accountNumber: string | number;
  balance: string | number;
}

export interface Transaction {
  id: number;
  amount: string | number;
  status: 'pending' | 'completed' | 'failed' | string;
  type: 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL' | string;
  createdAt: string;
  from: string | number | null;
  to: string | number | null;
  direction: 'debit' | 'credit';
}

export interface AuthResponse {
  message: string;
  token?: string;
  user: User;
}

export interface AccountsResponse {
  message: string;
  accounts: Account[];
}

export interface AccountResponse {
  message: string;
  account: Account;
}

export interface TransferResponse {
  message: string;
  transaction: {
    id: number;
    payerAccountId: number | null;
    payeeAccountId: number | null;
    amount: string | number;
    status: string;
    createdAt: string;
  };
}

export interface TransactionsResponse {
  message: string;
  transactions: Transaction[];
}

export interface TransactionResponse {
  message: string;
  transaction: Transaction;
}

const TOKEN_KEY = 'citibank_auth_token';
const USER_KEY = 'citibank_auth_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getUser(): User | null {
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson) as User;
  } catch {
    return null;
  }
}

export function setUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function removeUser(): void {
  localStorage.removeItem(USER_KEY);
}

export function clearAuth(): void {
  removeToken();
  removeUser();
}

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');
const API_KEY = import.meta.env.VITE_API_KEY || '1aad6647db2a212bc6fa121e5df9e8a1';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  // API Key header (required for every backend request)
  if (!headers.has('x-api-key')) {
    headers.set('x-api-key', API_KEY);
  }

  // Auth Bearer token header
  if (!options.skipAuth) {
    const token = getToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // JSON Content-Type
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${BASE_URL}${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let errorMessage = data.error || response.statusText || 'Request failed';
    if (data.details && Array.isArray(data.details)) {
      const issues = data.details
        .map((issue: { message?: string; path?: (string | number)[] }) => {
          if (issue.message && issue.path && issue.path.length > 0) {
            return `${issue.path.join('.')}: ${issue.message}`;
          }
          return issue.message || JSON.stringify(issue);
        })
        .join(', ');
      if (issues) {
        errorMessage = `${errorMessage} (${issues})`;
      }
    }
    throw new Error(errorMessage);
  }

  return data as T;
}

export const api = {
  auth: {
    register: (data: { name: string; email: string; phNumber: string; password: string }) =>
      request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
        skipAuth: true,
      }),

    login: async (credentials: { email: string; password: string }) => {
      const result = await request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
        skipAuth: true,
      });
      if (result.token) {
        setToken(result.token);
      }
      if (result.user) {
        setUser(result.user);
      }
      return result;
    },

    logout: () => {
      clearAuth();
      window.location.href = '/';
    },
  },

  users: {
    getMe: () => request<{ message: string; user: User }>('/users/me'),
    updateMe: (data: { name?: string; email?: string; phNumber?: string }) =>
      request<{ message: string; user: User }>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  accounts: {
    list: () => request<AccountsResponse>('/accounts'),
    get: (accountId: number | string) => request<AccountResponse>(`/accounts/${accountId}`),
    create: () =>
      request<AccountResponse>('/accounts', {
        method: 'POST',
      }),
    deposit: (accountId: number | string, amount: number | string) =>
      request<{ message: string; accountId: number; amount: string; balance: string }>(
        `/accounts/${accountId}/deposit`,
        {
          method: 'POST',
          body: JSON.stringify({ amount }),
        }
      ),
    withdraw: (accountId: number | string, amount: number | string, password: string) =>
      request<{ message: string; accountId: number; amount: string; balance: string }>(
        `/accounts/${accountId}/withdraw`,
        {
          method: 'POST',
          body: JSON.stringify({ amount, password }),
        }
      ),
    delete: (accountId: number | string, password: string) =>
      request<{ message: string; accountId: number }>(`/accounts/${accountId}`, {
        method: 'DELETE',
        body: JSON.stringify({ password }),
      }),
  },

  transfers: {
    create: (data: { payerAccountId: number | string; payeeAccountNumber: string; amount: number | string }) =>
      request<TransferResponse>('/transfers', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  transactions: {
    list: () => request<TransactionsResponse>('/transactions'),
    listByAccount: (accountId: number | string) =>
      request<TransactionsResponse>(`/transactions/account/${accountId}`),
    get: (transactionId: number | string) =>
      request<TransactionResponse>(`/transactions/${transactionId}`),
  },
};
