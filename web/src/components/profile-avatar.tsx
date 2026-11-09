import { PersonAvatar } from "@/components/person-avatar";
import { cn } from "@/lib/utils";

/** The person's photo when they have one, otherwise the initial in a circle. */
export function ProfileAvatar({
  name,
  photoUrl,
  className,
}: {
  name: string;
  photoUrl?: string;
  className?: string;
}) {
  if (!photoUrl) return <PersonAvatar name={name} className={className} />;
  return (
    // A plain img because mock photos are data URLs. The real API will serve normal image links.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photoUrl} alt="" className={cn("h-8 w-8 shrink-0 rounded-full object-cover", className)} />
  );
}
