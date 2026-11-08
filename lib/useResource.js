"use client";

// Lightweight stale-while-revalidate data cache + hook (no external deps).
//
// Goal: dashboard navigation feels instant when data is already cached. When a
// page re-mounts, cached data is returned synchronously and a background
// revalidation runs only if the entry is stale. Concurrent requests for the
// same key are de-duplicated, and all mounted consumers of a key update together.

import { useCallback, useEffect, useRef, useState } from "react";

const store = new Map(); // key -> { data, error, time }
const inflight = new Map(); // key -> Promise
const listeners = new Map(); // key -> Set<fn>

const DEFAULT_TTL = 60_000; // 1 min: within this window we skip refetching

function notify(key) {
  const subs = listeners.get(key);
  if (subs) {
    for (const fn of subs) fn();
  }
}

export function getCached(key) {
  return store.get(key);
}

export function setCached(key, data) {
  store.set(key, { data, error: undefined, time: Date.now() });
  notify(key);
}

// Invalidate + revalidate a key (or all keys with a given prefix). Call after
// a mutation (create/update/delete) so lists refetch fresh data on next view.
export function invalidate(prefix) {
  for (const key of store.keys()) {
    if (key === prefix || key.startsWith(prefix)) {
      store.delete(key);
      notify(key);
    }
  }
}

function runFetch(key, fetcher) {
  if (inflight.has(key)) return inflight.get(key);

  const p = Promise.resolve()
    .then(() => fetcher())
    .then((data) => {
      store.set(key, { data, error: undefined, time: Date.now() });
      return data;
    })
    .catch((error) => {
      const existing = store.get(key);
      store.set(key, { data: existing?.data, error, time: Date.now() });
      throw error;
    })
    .finally(() => {
      inflight.delete(key);
      notify(key);
    });

  inflight.set(key, p);
  return p;
}

/**
 * useResource(key, fetcher, options)
 * - key: stable string (include filters/search so variants cache separately);
 *        pass null/"" to disable fetching.
 * - fetcher: () => Promise<data>
 * - options: { ttl }
 * Returns { data, error, loading, refreshing, refresh }.
 */
export function useResource(key, fetcher, { ttl = DEFAULT_TTL } = {}) {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const [, forceRender] = useState(0);
  const rerender = useCallback(() => forceRender((n) => n + 1), []);

  const enabled = Boolean(key);

  const revalidate = useCallback(
    (force = false) => {
      if (!key) return Promise.resolve();
      const cached = store.get(key);
      const fresh = cached && Date.now() - cached.time < ttl && !cached.error;
      if (!force && fresh) return Promise.resolve(cached.data);
      return runFetch(key, fetcherRef.current).catch(() => {});
    },
    [key, ttl]
  );

  useEffect(() => {
    if (!enabled) return undefined;

    let set = listeners.get(key);
    if (!set) {
      set = new Set();
      listeners.set(key, set);
    }
    set.add(rerender);

    // Revalidate on mount/key change (skipped internally if still fresh).
    revalidate(false);

    return () => {
      set.delete(rerender);
      if (set.size === 0) listeners.delete(key);
    };
  }, [key, enabled, revalidate, rerender]);

  const cached = enabled ? store.get(key) : undefined;
  const hasData = cached?.data !== undefined;

  return {
    data: cached?.data,
    error: cached?.error,
    loading: enabled && !hasData && !cached?.error,
    refreshing: enabled && hasData && inflight.has(key),
    refresh: () => revalidate(true),
  };
}
