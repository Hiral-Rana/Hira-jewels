import { env } from "@/lib/env";

export function getApiBaseUrl() {
  const configuredUrl = env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");

  if (configuredUrl) {
    return configuredUrl;
  }

  if (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    return "https://hira-jewels.onrender.com";
  }

  return "http://localhost:5000";
}

export function apiUrl(path: string) {
  return `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}