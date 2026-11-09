import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import { ApiError, friendlyMessage } from "@/lib/api/client";

/**
 * Shows server errors the way the brief says: field errors under the field,
 * everything else in a toast. Returns the message when the caller wants to show it inline.
 */
export function showServerError<T extends FieldValues>(
  error: unknown,
  setError?: UseFormSetError<T>,
  options: { inlineCodes?: string[] } = {},
): string | null {
  if (error instanceof ApiError) {
    const entries = Object.entries(error.fields);
    if (entries.length > 0 && setError) {
      for (const [name, message] of entries) setError(name as Path<T>, { type: "server", message });
      return null;
    }
    if (options.inlineCodes?.includes(error.code)) return error.message;
  }
  toast.error(friendlyMessage(error));
  return null;
}
