import { request } from "@/lib/api/client";

export type BlockedPerson = { id: string; name: string; college?: string };

export const accountService = {
  blocked() {
    return request<{ blocked: BlockedPerson[] }>("/api/blocks");
  },

  unblock(userId: string) {
    return request<void>(`/api/blocks/${encodeURIComponent(userId)}`, { method: "DELETE" });
  },

  /** Deletes the account and everything on it. The API wants the word DELETE as confirmation. */
  deleteAccount() {
    return request<void>("/api/account", { method: "DELETE", body: { confirm: "DELETE" } });
  },
};
