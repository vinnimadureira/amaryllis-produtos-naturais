import { motion } from "framer-motion";

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
}

const SectionTitle = ({ title, subtitle, centered = true }: SectionTitleProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className={`mb-10 ${centered ? "text-center" : ""}`}
  >
    <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">{title}</h2>
    {subtitle && (
      <p className="text-muted-foreground mt-3 text-base md:text-lg max-w-2xl mx-auto">
        {subtitle}
      </p>
    )}
    <div className={`mt-4 h-0.5 w-16 bg-primary rounded-full ${centered ? "mx-auto" : ""}`} />
  </motion.div>
);

export default SectionTitle;
