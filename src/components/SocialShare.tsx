import { MessageCircle, Facebook, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface SocialShareProps {
  title: string;
  text: string;
  url: string;
}

const SocialShare = ({ title, text, url }: SocialShareProps) => {
  const [copied, setCopied] = useState(false);

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`, "_blank");
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground mr-1">Compartilhar:</span>
      <Button variant="outline" size="icon" className="w-9 h-9 rounded-full border-border hover:border-primary hover:text-primary" onClick={shareWhatsApp} title="WhatsApp">
        <MessageCircle className="w-4 h-4" />
      </Button>
      <Button variant="outline" size="icon" className="w-9 h-9 rounded-full border-border hover:border-primary hover:text-primary" onClick={shareFacebook} title="Facebook">
        <Facebook className="w-4 h-4" />
      </Button>
      <Button variant="outline" size="icon" className="w-9 h-9 rounded-full border-border hover:border-primary hover:text-primary" onClick={copyLink} title="Copiar link">
        {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Link2 className="w-4 h-4" />}
      </Button>
    </div>
  );
};

export default SocialShare;
