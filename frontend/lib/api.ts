import { env } from "@/lib/env";

export function getApiBaseUrl() {
  return (env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
}

export function apiUrl(path: string) {
  return `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}