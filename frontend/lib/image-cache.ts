"use client";

import { useEffect, useState } from "react";

type CacheEntry = {
  expiresAt: number;
  lastUsedAt: number;
};

type CacheManifest = Record<string, CacheEntry>;

const IMAGE_CACHE_NAME = "hira-image-cache-v1";
const IMAGE_CACHE_STORAGE_KEY = "hira-image-cache-manifest-v1";
const DEFAULT_IMAGE_CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const MAX_IMAGE_CACHE_ITEMS = 40;

const memoryObjectUrlCache = new Map<string, { url: string; expiresAt: number }>();
const pendingCacheRequests = new Map<string, Promise<string>>();

function isBrowser() {
  return typeof window !== "undefined";
}

function isCacheableImageSrc(src: string) {
  return typeof src === "string" && src.length > 0 && /^(https?:\/\/|\/)/.test(src);
}

function readManifest(): CacheManifest {
  if (!isBrowser()) {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(IMAGE_CACHE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CacheManifest) : {};
  } catch {
    return {};
  }
}

function writeManifest(manifest: CacheManifest) {
  if (!isBrowser()) {
    return;
  }

  try {
    window.localStorage.setItem(
      IMAGE_CACHE_STORAGE_KEY,
      JSON.stringify(manifest)
    );
  } catch {
    // Ignore storage quota issues and keep rendering.
  }
}

function pruneManifest(manifest: CacheManifest) {
  const entries = Object.entries(manifest);
  if (entries.length <= MAX_IMAGE_CACHE_ITEMS) {
    return manifest;
  }

  const sortedEntries = entries.sort(
    (left, right) => right[1].lastUsedAt - left[1].lastUsedAt
  );

  return Object.fromEntries(sortedEntries.slice(0, MAX_IMAGE_CACHE_ITEMS));
}

function touchManifestEntry(src: string, ttlMs: number) {
  const manifest = readManifest();
  const now = Date.now();
  manifest[src] = {
    expiresAt: now + ttlMs,
    lastUsedAt: now,
  };
  writeManifest(pruneManifest(manifest));
}

function deleteManifestEntry(src: string) {
  const manifest = readManifest();
  if (manifest[src]) {
    delete manifest[src];
    writeManifest(manifest);
  }
}

function rememberObjectUrl(src: string, url: string, ttlMs: number) {
  const now = Date.now();

  if (memoryObjectUrlCache.has(src)) {
    const existing = memoryObjectUrlCache.get(src);
    if (existing?.url && existing.url !== url) {
      URL.revokeObjectURL(existing.url);
    }
    memoryObjectUrlCache.delete(src);
  }

  memoryObjectUrlCache.set(src, {
    url,
    expiresAt: now + ttlMs,
  });

  if (memoryObjectUrlCache.size > MAX_IMAGE_CACHE_ITEMS) {
    const oldestKey = memoryObjectUrlCache.keys().next().value;
    if (oldestKey) {
      const oldestEntry = memoryObjectUrlCache.get(oldestKey);
      if (oldestEntry?.url) {
        URL.revokeObjectURL(oldestEntry.url);
      }
      memoryObjectUrlCache.delete(oldestKey);
    }
  }
}

async function readResponseAsObjectUrl(src: string, ttlMs: number) {
  const cache = await window.caches.open(IMAGE_CACHE_NAME);
  const cachedResponse = await cache.match(src);

  if (cachedResponse) {
    const blob = await cachedResponse.blob();
    const objectUrl = URL.createObjectURL(blob);
    rememberObjectUrl(src, objectUrl, ttlMs);
    touchManifestEntry(src, ttlMs);
    return objectUrl;
  }

  const response = await fetch(src, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`Unable to cache image: ${response.status}`);
  }

  await cache.put(src, response.clone());
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  rememberObjectUrl(src, objectUrl, ttlMs);
  touchManifestEntry(src, ttlMs);
  return objectUrl;
}

export function getCachedImageEntry(src: string) {
  if (!isBrowser() || !isCacheableImageSrc(src)) {
    return null;
  }

  const manifest = readManifest();
  const entry = manifest[src];
  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    delete manifest[src];
    writeManifest(manifest);
    return null;
  }

  return entry;
}

export async function resolveCachedImageSrc(
  src: string,
  ttlMs: number = DEFAULT_IMAGE_CACHE_TTL_MS
) {
  if (!isBrowser() || !isCacheableImageSrc(src)) {
    return src;
  }

  const memoryEntry = memoryObjectUrlCache.get(src);
  if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
    return memoryEntry.url;
  }

  if (pendingCacheRequests.has(src)) {
    return pendingCacheRequests.get(src)!;
  }

  const request = (async () => {
    try {
      return await readResponseAsObjectUrl(src, ttlMs);
    } catch (error) {
      console.warn("Image cache warmup failed:", error);
      deleteManifestEntry(src);
      return src;
    } finally {
      pendingCacheRequests.delete(src);
    }
  })();

  pendingCacheRequests.set(src, request);
  return request;
}

export function useCachedImageSrc(src: string, ttlMs: number = DEFAULT_IMAGE_CACHE_TTL_MS) {
  const [resolvedSrc, setResolvedSrc] = useState<string>("");

  useEffect(() => {
    let active = true;

    if (!isCacheableImageSrc(src)) {
      setResolvedSrc(src);
      return;
    }

    const cacheEntry = getCachedImageEntry(src);
    if (!cacheEntry) {
      setResolvedSrc(src);
      void resolveCachedImageSrc(src, ttlMs);
      return;
    }

    setResolvedSrc("");
    void resolveCachedImageSrc(src, ttlMs)
      .then((cachedSrc) => {
        if (active) {
          setResolvedSrc(cachedSrc);
        }
      })
      .catch(() => {
        if (active) {
          setResolvedSrc(src);
        }
      });

    return () => {
      active = false;
    };
  }, [src, ttlMs]);

  return resolvedSrc;
}
