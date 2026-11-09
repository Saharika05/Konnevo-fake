import { ApiError, request } from "@/lib/api/client";
import type { LoginAs, OAuthProvider, SessionUser } from "@/lib/api/types";

export const authService = {
  /** The signed-in person, or null for a visitor (the API answers 401). */
  async me(): Promise<SessionUser | null> {
    try {
      const data = await request<{ user: SessionUser }>("/api/auth/me");
      return data.user;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  },

  /** Starts Google or GitHub login. Go to the returned url. */
  oauth(provider: OAuthProvider, intent: LoginAs, callbackUrl: string) {
    return request<{ url: string }>(`/api/auth/${provider}`, {
      method: "POST",
      body: { intent, callback_url: callbackUrl },
    });
  },

  login(input: { email: string; password: string; intent: LoginAs }) {
    return request<{ user: SessionUser }>("/api/auth/login", { method: "POST", body: input });
  },

  logout() {
    return request<void>("/api/auth/logout", { method: "POST" });
  },

  createPassword(input: { password: string }) {
    return request<void>("/api/auth/password/create", { method: "POST", body: input });
  },

  /** For people who already have a password. */
  changePassword(input: { currentPassword: string; password: string }) {
    return request<void>("/api/auth/password/change", {
      method: "POST",
      body: { current_password: input.currentPassword, password: input.password },
    });
  },

  forgotPassword(input: { email: string }) {
    return request<void>("/api/auth/password/forgot", { method: "POST", body: input });
  },

  resetPassword(input: { token: string; password: string }) {
    return request<void>("/api/auth/password/reset", { method: "POST", body: input });
  },
};
