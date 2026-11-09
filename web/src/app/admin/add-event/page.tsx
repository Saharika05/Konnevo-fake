import { redirect } from "next/navigation";

/** The old address. The brief's address is /admin/events/new. */
export default function Page() {
  redirect("/admin/events/new");
}
