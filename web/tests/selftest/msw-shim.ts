export class HttpResponse extends Response {
  static json(body: unknown, init?: ResponseInit) {
    return new HttpResponse(JSON.stringify(body), {
      ...init,
      headers: { "content-type": "application/json" },
    });
  }
}
type Route = { method: string; re: RegExp; resolver: (a: any) => any; path: string };
function make(method: string) {
  return (path: string, resolver: (a: any) => any): Route => {
    const re = new RegExp(
      "^" +
        path
          .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
          .replace(/\*/g, ".*")
          .replace(/:(\w+)/g, "(?<$1>[^/?]+)") +
        "(\\?.*)?$",
    );
    return { method: method.toUpperCase(), re, resolver, path };
  };
}
export const http = {
  get: make("get"),
  post: make("post"),
  patch: make("patch"),
  put: make("put"),
  delete: make("delete"),
};
