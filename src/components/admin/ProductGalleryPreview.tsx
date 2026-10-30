import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ImageIcon } from "lucide-react";

interface ProductGalleryPreviewProps {
  productId: string;
  mainImageUrl?: string | null;
}

const isVideo = (url: string) => /\.(mp4|webm|mov|avi)$/i.test(url);

const ProductGalleryPreview = ({ productId, mainImageUrl }: ProductGalleryPreviewProps) => {
  const { data: extraImages = [], isLoading } = useQuery({
    queryKey: ["admin-product-images", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_images")
        .select("id, image_url, display_order")
        .eq("product_id", productId)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (extraImages.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground italic p-3 rounded-lg bg-muted/40 border border-dashed border-border">
        <ImageIcon className="w-4 h-4" />
        Nenhuma foto adicional cadastrada.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <strong>Galeria adicional:</strong>
        <span className="text-xs text-muted-foreground">{extraImages.length} {extraImages.length === 1 ? "item" : "itens"}</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {extraImages.map((img) => (
          <a
            key={img.id}
            href={img.image_url}
            target="_blank"
            rel="noopener noreferrer"
            className="aspect-square rounded-lg overflow-hidden border border-border bg-muted hover:ring-2 hover:ring-primary transition-all relative group"
            title="Abrir em nova aba"
          >
            {isVideo(img.image_url) ? (
              <video src={img.image_url} className="w-full h-full object-cover" muted />
            ) : (
              <img src={img.image_url} alt="Foto adicional" className="w-full h-full object-cover" loading="lazy" />
            )}
          </a>
        ))}
      </div>
    </div>
  );
};

export default ProductGalleryPreview;
