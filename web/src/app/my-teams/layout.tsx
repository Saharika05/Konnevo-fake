import { RequireRole } from "@/components/route-guard";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <RequireRole role="student">{children}</RequireRole>;
}
