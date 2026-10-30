import { motion } from "framer-motion";
import { Heart, Gift, Sparkles, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import MobileCarousel from "@/components/MobileCarousel";

const WHATSAPP_URL = "https://wa.me/5519993512766?text=";

const iconMap: Record<string, React.ElementType> = {
  heart: Heart,
  gift: Gift,
  sparkles: Sparkles,
};

const CampaignBanners = () => {
  const { data: campaigns } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("active", true)
        .order("display_order");
      if (error) throw error;
      return data;
    },
  });

  if (!campaigns || campaigns.length === 0) return null;

  return (
    <section className="container py-16">
      <div className="text-center mb-10">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-2">
          Campanhas Especiais
        </h2>
        <p className="text-muted-foreground">Datas que merecem produtos únicos</p>
      </div>
      <div className="md:hidden">
        <MobileCarousel itemWidthClass="w-[86%]">
          {campaigns.map((campaign, i) => {
            const Icon = iconMap[campaign.icon] || Heart;
            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative overflow-hidden rounded-2xl p-8 text-center"
                style={{
                  background: `linear-gradient(135deg, hsl(${campaign.gradient_from}), hsl(${campaign.gradient_to}))`,
                }}
              >
                {campaign.badge && (
                  <span className="absolute top-4 right-4 bg-card/90 text-foreground text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                    {campaign.badge}
                  </span>
                )}
                <div className="w-14 h-14 rounded-full bg-card/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-7 h-7 text-card" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-card mb-2">
                  {campaign.title}
                </h3>
                <p className="text-card/85 text-sm mb-6 leading-relaxed">
                  {campaign.subtitle}
                </p>
                <Button
                  asChild
                  size="sm"
                  className="bg-card text-foreground hover:bg-card/90 gap-1.5"
                >
                  <a
                    href={`${WHATSAPP_URL}Olá! Quero saber sobre ${encodeURIComponent(campaign.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Quero saber mais
                  </a>
                </Button>
              </motion.div>
            );
          })}
        </MobileCarousel>
      </div>

      <div className="hidden md:grid grid-cols-3 gap-6">
        {campaigns.map((campaign, i) => {
          const Icon = iconMap[campaign.icon] || Heart;
          return (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative overflow-hidden rounded-2xl p-8 text-center"
              style={{
                background: `linear-gradient(135deg, hsl(${campaign.gradient_from}), hsl(${campaign.gradient_to}))`,
              }}
            >
              {campaign.badge && (
                <span className="absolute top-4 right-4 bg-card/90 text-foreground text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                  {campaign.badge}
                </span>
              )}
              <div className="w-14 h-14 rounded-full bg-card/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
                <Icon className="w-7 h-7 text-card" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-card mb-2">
                {campaign.title}
              </h3>
              <p className="text-card/85 text-sm mb-6 leading-relaxed">
                {campaign.subtitle}
              </p>
              <Button
                asChild
                size="sm"
                className="bg-card text-foreground hover:bg-card/90 gap-1.5"
              >
                <a
                  href={`${WHATSAPP_URL}Olá! Quero saber sobre ${encodeURIComponent(campaign.title)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="w-4 h-4" />
                  Quero saber mais
                </a>
              </Button>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default CampaignBanners;
