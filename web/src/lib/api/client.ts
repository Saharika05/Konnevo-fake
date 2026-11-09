import { API_URL } from "@/lib/env";

/** The error shape every API error uses: { error: { code, message, fields } } */
type ErrorBody = {
  error?: { code?: string; message?: string; fields?: Record<string, string> };
};

export class ApiError extends Error {
  status: number;
  code: string;
  fields: Record<string, string>;

  constructor(status: number, code: string, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** Sent as JSON. */
  body?: unknown;
  /** Sent as multipart (uploads). */
  formData?: FormData;
  query?: Record<string, string | number | boolean | string[] | undefined>;
  signal?: AbortSignal;
};

export function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === "") continue;
    if (Array.isArray(value)) value.forEach((item) => search.append(key, item));
    else search.append(key, String(value));
  }
  const text = search.toString();
  return `${API_URL}${path}${text ? `?${text}` : ""}`;
}

/**
 * The one place that talks to the API. It adds the base URL, sends the login
 * cookie, and turns every failure into a typed ApiError.
 * No component calls fetch directly. Use the files in lib/services.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, formData, query, signal } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  let payload: BodyInit | undefined;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: payload,
      credentials: "include",
      signal,
    });
  } catch {
    throw new ApiError(0, "network_error", "Could not reach the server. Check your connection.");
  }

  if (response.status === 204) return undefined as T;

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (data as ErrorBody | null)?.error;
    throw new ApiError(
      response.status,
      error?.code ?? "unknown_error",
      error?.message ?? "Something went wrong. Please try again.",
      error?.fields ?? {},
    );
  }

  return data as T;
}

/** A clear message for the status codes every screen has to handle. */
export function friendlyMessage(error: unknown): string {
  if (!(error instanceof ApiError)) return "Something went wrong. Please try again.";
  switch (error.status) {
    case 0:
      return error.message;
    case 401:
      return "Please log in to continue.";
    case 403:
      return error.message || "You do not have permission to do that.";
    case 404:
      return "We could not find that.";
    case 409:
      return error.message || "That conflicts with something that already exists.";
    case 429:
      return "Too many tries. Please wait a moment and try again.";
    default:
      return error.message || "Something went wrong. Please try again.";
  }
}

/**
 * For file downloads (the events CSV). Same base URL, same cookie, same typed errors as `request`.
 */
export async function requestBlob(
  path: string,
  query?: RequestOptions["query"],
): Promise<{ blob: Blob; fileName?: string }> {
  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), { credentials: "include" });
  } catch {
    throw new ApiError(0, "network_error", "Could not reach the server. Check your connection.");
  }
  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as ErrorBody | null;
    throw new ApiError(
      response.status,
      data?.error?.code ?? "unknown_error",
      data?.error?.message ?? "Something went wrong. Please try again.",
      data?.error?.fields ?? {},
    );
  }
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const fileName = /filename="?([^";]+)"?/i.exec(disposition)?.[1];
  return { blob: await response.blob(), fileName };
}
