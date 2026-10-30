import { Loader2, Home } from "lucide-react";
import { useSiteMediaByPage } from "@/hooks/useSiteMedia";
import MediaSlot from "./MediaSlot";
import heroVideoAsset from "@/assets/hero-pizza-cone-v3.mp4.asset.json";
import massaCruaImg from "@/assets/produtos/massa-crua-pack.jpg.asset.json";
import massaAssadaImg from "@/assets/produtos/massa-preassada.jpg.asset.json";
import kitDiyImg from "@/assets/produtos/kit-diy.jpg.asset.json";

const FALLBACKS: Record<string, string> = {
  "home.hero_video_desktop": heroVideoAsset.url,
  "home.hero_video_mobile": heroVideoAsset.url,
  "home.produto_massa_crua": massaCruaImg.url,
  "home.produto_massa_assada": massaAssadaImg.url,
  "home.produto_kit_diy": kitDiyImg.url,
};

const ORDER = [
  "home.hero_video_desktop",
  "home.hero_video_mobile",
  "home.produto_massa_crua",
  "home.produto_massa_assada",
  "home.produto_kit_diy",
];

const HomeMediaTab = () => {
  const { rows, isLoading } = useSiteMediaByPage("home");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const visible = ORDER
    .map((key) => rows.find((r) => r.key === key))
    .filter((r): r is NonNullable<typeof r> => !!r);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Home className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="font-serif text-base font-semibold text-foreground">Mídias da Home</h2>
          <p className="text-xs text-muted-foreground">Vídeo do hero, poster e fotos dos produtos da página inicial</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visible.map((row) => (
          <MediaSlot key={row.key} row={row} fallbackUrl={FALLBACKS[row.key] || ""} />
        ))}
      </div>
    </div>
  );
};

export default HomeMediaTab;
