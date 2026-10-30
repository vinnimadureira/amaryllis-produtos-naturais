import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteMediaMeta = {
  name?: string;
  tag?: string;
  description?: string;
  [k: string]: any;
};

export type SiteMediaRow = {
  key: string;
  page: string;
  label: string;
  type: "image" | "video";
  url: string | null;
  meta: SiteMediaMeta;
  updated_at: string;
};

const QUERY_KEY = ["site-media"] as const;

export function useSiteMedia() {
  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase.from("site_media").select("*");
      if (error) throw error;
      return ((data || []) as any[]).map((r) => ({
        ...r,
        meta: (r.meta || {}) as SiteMediaMeta,
      })) as SiteMediaRow[];
    },
    staleTime: 60_000,
  });

  const map = new Map<string, SiteMediaRow>();
  (query.data || []).forEach((r) => map.set(r.key, r));

  return {
    ...query,
    rows: query.data || [],
    /** Returns the override URL if set, otherwise the bundled fallback. */
    getMedia: (key: string, fallback: string) => map.get(key)?.url || fallback,
    getRow: (key: string) => map.get(key),
    getMeta: (key: string) => map.get(key)?.meta || {},
  };
}

export function useUpdateSiteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      key,
      url,
      meta,
    }: {
      key: string;
      url?: string | null;
      meta?: SiteMediaMeta;
    }) => {
      const payload: Record<string, any> = {};
      if (url !== undefined) payload.url = url;
      if (meta !== undefined) payload.meta = meta;
      const { error } = await (supabase.from("site_media") as any)
        .update(payload)
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/** Helper for the admin: only the rows for a given page. */
export function useSiteMediaByPage(page: string) {
  const { rows, ...rest } = useSiteMedia();
  return { ...rest, rows: rows.filter((r) => r.page === page) };
}
