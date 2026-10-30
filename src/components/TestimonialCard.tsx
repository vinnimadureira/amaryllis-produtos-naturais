import { forwardRef } from "react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";

interface TestimonialCardProps {
  name: string;
  text: string;
  rating: number;
}

const TestimonialCard = forwardRef<HTMLDivElement, TestimonialCardProps>(({ name, text, rating }, ref) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="bg-card rounded-lg p-6 shadow-soft"
  >
    <div className="flex gap-1 mb-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < rating ? "text-accent fill-accent" : "text-border"}`}
        />
      ))}
    </div>
    <p className="text-sm text-muted-foreground italic leading-relaxed mb-4">"{text}"</p>
    <p className="text-sm font-semibold text-foreground">— {name}</p>
  </motion.div>
));

TestimonialCard.displayName = "TestimonialCard";

export default TestimonialCard;
