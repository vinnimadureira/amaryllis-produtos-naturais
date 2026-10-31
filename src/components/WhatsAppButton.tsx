import { forwardRef } from "react";
import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useCompanyInfo } from "@/hooks/useCompanyInfo";
import { AMARYLLIS_COMPANY } from "@/lib/amaryllisFallbackData";

const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");

const FloatingContactButton = forwardRef<HTMLAnchorElement>((_, ref) => {
  const company = useCompanyInfo();
  const digits = onlyDigits(company.whatsapp) || AMARYLLIS_COMPANY.whatsapp;
  const waLink = digits
    ? `https://wa.me/${digits}?text=${encodeURIComponent(
        "Olá, Amaryllis Produtos Naturais! Gostaria de consultar produtos ou fazer um pedido."
      )}`
    : null;

  const commonClass =
    "flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba59] text-white shadow-xl hover:shadow-2xl transition-all";

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      animate={{ y: [0, -6, 0] }}
      transition={{ y: { repeat: Infinity, duration: 2.5, ease: "easeInOut" } }}
    >
      {waLink ? (
        <a
          ref={ref}
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className={commonClass}
          aria-label="Falar com a Amaryllis no WhatsApp (19) 99351-2766"
          title="WhatsApp Amaryllis (19) 99351-2766"
        >
          <MessageCircle className="w-7 h-7 text-white" />
        </a>
      ) : (
        <Link
          ref={ref}
          to="/contato"
          className={commonClass}
          aria-label="Falar com a Amaryllis"
        >
          <MessageCircle className="w-7 h-7 text-white" />
        </Link>
      )}
    </motion.div>
  );
});

FloatingContactButton.displayName = "FloatingContactButton";

export default FloatingContactButton;
