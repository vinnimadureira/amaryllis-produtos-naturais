import { Loader2, Info } from "lucide-react";
import { useSiteMediaByPage } from "@/hooks/useSiteMedia";
import MediaSlot from "./MediaSlot";
import handsImgAsset from "@/assets/mrcone-hands.jpg.asset.json";
const handsImg = handsImgAsset.url;

const FALLBACKS: Record<string, string> = {
  "sobre.hands_image": handsImg,
};

const ORDER = ["sobre.hands_image"];

const SobreMediaTab = () => {
  const { rows, isLoading } = useSiteMediaByPage("sobre");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const visible = ORDER
    .map((k) => rows.find((r) => r.key === k))
    .filter((r): r is NonNullable<typeof r> => !!r);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Info className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-serif text-base font-semibold text-foreground">Mídias da página Sobre</h2>
          <p className="text-xs text-muted-foreground">Imagens exibidas na página /sobre</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {visible.map((row) => (
          <MediaSlot key={row.key} row={row} fallbackUrl={FALLBACKS[row.key] || ""} />
        ))}
      </div>
    </div>
  );
};

export default SobreMediaTab;
