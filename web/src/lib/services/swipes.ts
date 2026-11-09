import { request } from "@/lib/api/client";
import type { SwipeDirection, SwipeResponse } from "@/lib/api/types";

export const swipesService = {
  /** A swipe. If the other person already swiped right, the answer says `matched`. */
  swipe(input: { eventId: string; targetId: string; direction: SwipeDirection }) {
    return request<SwipeResponse>("/api/swipes", {
      method: "POST",
      body: { event_id: input.eventId, target_id: input.targetId, direction: input.direction },
    });
  },
};
