import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export interface PageSection {
  id: string;
  page_key: string;
  section_key: string;
  type: string;
  content: Record<string, any>;
  display_order: number;
  active: boolean;
}

/**
 * Reads editable page sections for a given page (e.g. "home").
 * Returns active sections ordered by display_order. Components should
 * use the helper `getSection` with a fallback so the page never breaks
 * if a row is missing.
 *
 * Preview mode: when the URL contains `?preview=1`, drafts saved by
 * the admin editor in sessionStorage under `preview:<pageKey>` are
 * merged on top of the persisted content. This lets editors see
 * unsaved changes without publishing them.
 */
export function usePageContent(pageKey: string) {
  const location = useLocation();
  const isPreview = useMemo(
    () => new URLSearchParams(location.search).get("preview") === "1",
    [location.search],
  );

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["page-sections", pageKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_sections")
        .select("*")
        .eq("page_key", pageKey)
        .eq("active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as PageSection[];
    },
  });

  // Apply preview overrides from sessionStorage when ?preview=1 is set.
  const previewedSections = useMemo<PageSection[]>(() => {
    if (!isPreview) return sections;
    try {
      const raw = sessionStorage.getItem(`preview:${pageKey}`);
      if (!raw) return sections;
      const overrides = JSON.parse(raw) as Record<
        string,
        { content?: Record<string, any>; active?: boolean } | null
      >;
      return sections.map((s) => {
        const o = overrides[s.section_key];
        if (o === undefined || o === null) return s;
        return {
          ...s,
          content: o.content ? { ...s.content, ...o.content } : s.content,
          active: o.active ?? s.active,
        };
      });
    } catch {
      return sections;
    }
  }, [sections, isPreview, pageKey]);

  function getSection<T extends Record<string, any> = Record<string, any>>(
    sectionKey: string,
    fallback: T
  ): T {
    const found = previewedSections.find((s) => s.section_key === sectionKey);
    if (!found) return fallback;
    return { ...fallback, ...(found.content as T) };
  }

  function isSectionVisible(sectionKey: string, defaultVisible = true): boolean {
    const found = previewedSections.find((s) => s.section_key === sectionKey);
    if (!found) return defaultVisible;
    return found.active;
  }

  return { sections: previewedSections, isLoading, getSection, isSectionVisible, isPreview };
}
