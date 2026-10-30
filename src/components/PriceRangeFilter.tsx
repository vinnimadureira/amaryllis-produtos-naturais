import { Slider } from "@/components/ui/slider";

interface PriceRangeFilterProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PriceRangeFilter = ({ min, max, value, onChange }: PriceRangeFilterProps) => {
  if (min === max) return null;

  return (
    <div className="max-w-sm mx-auto mb-8 px-2">
      <p className="text-xs font-medium text-muted-foreground text-center mb-3">
        Faixa de preço: {formatBRL(value[0])} — {formatBRL(value[1])}
      </p>
      <Slider
        min={min}
        max={max}
        step={1}
        value={value}
        onValueChange={(v) => onChange(v as [number, number])}
        className="w-full"
      />
    </div>
  );
};

export default PriceRangeFilter;
