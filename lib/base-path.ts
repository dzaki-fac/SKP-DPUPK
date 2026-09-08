// Base path deployment (Laragon: bolak-balik via subpath /skp-dpupk).
// Harus sama dengan `basePath` di next.config.ts.
export const BASE_PATH = "/skp-dpupk";

/** Prefix path absolut internal (mis. filePath "/uploads/x.pdf" dari DB) dengan base path. */
export function withBase(p: string): string {
  if (!p.startsWith("/") || p.startsWith(BASE_PATH + "/") || p === BASE_PATH) return p;
  return BASE_PATH + p;
}

/**
 * Patch sekali: fetch("/api/...") di client otomatis jadi "/skp-dpupk/api/...".
 * Dipanggil di lib/store.tsx (modul client yang dimuat semua halaman),
 * supaya 40+ call site fetch tidak perlu diubah satu per satu.
 */
export function installFetchPrefix(): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { __skpFetchPatched?: boolean };
  if (w.__skpFetchPatched) return;
  w.__skpFetchPatched = true;
  const orig = window.fetch.bind(window);
  window.fetch = ((input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    if (typeof input === "string" && input.startsWith("/api/")) {
      return orig(withBase(input), init);
    }
    return orig(input as never, init);
  }) as typeof fetch;
}
