import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const STORAGE_KEY = "7s-wishlist";

const getStored = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
};

export const useWishlist = () => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<string[]>(getStored);
  const [synced, setSynced] = useState(false);

  // Sync from DB when user logs in
  useEffect(() => {
    if (!user) {
      setSynced(false);
      return;
    }

    const syncFromDb = async () => {
      const { data } = await supabase
        .from("wishlist")
        .select("product_id")
        .eq("user_id", user.id);

      if (data) {
        const dbIds = data.map((w) => w.product_id);
        // Merge local + db
        const localIds = getStored();
        const merged = Array.from(new Set([...dbIds, ...localIds]));

        // Insert any local-only items to DB
        const newItems = localIds.filter((id) => !dbIds.includes(id));
        if (newItems.length > 0) {
          await supabase.from("wishlist").upsert(
            newItems.map((product_id) => ({ user_id: user.id, product_id })),
            { onConflict: "user_id,product_id" }
          );
        }

        setWishlist(merged);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      }
      setSynced(true);
    };

    syncFromDb();
  }, [user]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  const toggle = useCallback(
    async (id: string) => {
      const isInList = wishlist.includes(id);

      // Optimistic update
      setWishlist((prev) =>
        isInList ? prev.filter((x) => x !== id) : [...prev, id]
      );

      // Persist to DB if logged in
      if (user) {
        if (isInList) {
          await supabase
            .from("wishlist")
            .delete()
            .eq("user_id", user.id)
            .eq("product_id", id);
        } else {
          await supabase
            .from("wishlist")
            .upsert(
              { user_id: user.id, product_id: id },
              { onConflict: "user_id,product_id" }
            );
        }
      }
    },
    [wishlist, user]
  );

  const isFavorite = useCallback(
    (id: string) => wishlist.includes(id),
    [wishlist]
  );

  return { wishlist, toggle, isFavorite, count: wishlist.length };
};
