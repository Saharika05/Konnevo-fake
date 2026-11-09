import { useQuery } from "@tanstack/react-query";
import { teamsService } from "@/lib/services/teams";
import { useSession } from "@/lib/session";

export const TEAMS_KEY = ["teams", "mine"] as const;
export const MATCHES_KEY = ["matches", "mine"] as const;

/** My teams and pending invites. Only asks while a student is logged in. */
export function useTeams() {
  const { role } = useSession();
  return useQuery({
    queryKey: TEAMS_KEY,
    queryFn: teamsService.list,
    enabled: role === "student",
  });
}
