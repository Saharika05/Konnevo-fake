import { request } from "@/lib/api/client";
import type { FeedbackInput } from "@/lib/api/types";

export const feedbackService = {
  send(input: FeedbackInput) {
    return request<void>("/api/feedback", { method: "POST", body: input });
  },
};
