import { useState, useEffect, useCallback } from "react";

export interface AuthUser {
  id: number;
  username: string;
  plan: string;
  isActivated: boolean;
}

const TOKEN_KEY = "phisphere_auth_token";
const USER_KEY = "phisphere_auth_user";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const token = getStoredToken();
  return fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const isAuthenticated = !!user;

  const storeAuth = (token: string, userData: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  const signup = useCallback(async (username: string, password: string, activationCode: string, plan: string): Promise<boolean> => {
    setIsLoading(true);
    setError("");
    try {
      const res = await apiFetch("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ username, password, activationCode, plan }),
      });
      const data = await res.json() as { token?: string; user?: AuthUser; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Signup failed. Please try again.");
        return false;
      }
      storeAuth(data.token!, data.user!);
      return true;
    } catch {
      setError("Network error. Please check your connection.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError("");
    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json() as { token?: string; user?: AuthUser; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Login failed. Please try again.");
        return false;
      }
      storeAuth(data.token!, data.user!);
      return true;
    } catch {
      setError("Network error. Please check your connection.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const token = getStoredToken();
    if (token) {
      await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    }
    clearAuth();
  }, []);

  return { user, isAuthenticated, isLoading, error, setError, signup, login, logout };
}

export function useRequireAuth(redirectTo: string) {
  const token = getStoredToken();
  const user = getStoredUser();
  return { isAuthenticated: !!(token && user), user };
}
