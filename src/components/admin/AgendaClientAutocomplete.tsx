import { useState, useMemo, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Check, X, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
  id: string;
  name: string;
  phone: string | null;
  email?: string | null;
  address?: string | null;
}

interface Props {
  clients: Client[];
  value: string;
  selectedName: string;
  onSelect: (id: string, name: string, client?: Client | null) => void;
  maxSuggestions?: number;
}

const AgendaClientAutocomplete = ({
  clients,
  value,
  selectedName,
  onSelect,
  maxSuggestions = 5,
}: Props) => {
  const [query, setQuery] = useState(selectedName || "");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external selection back to input
  useEffect(() => {
    setQuery(selectedName || "");
  }, [selectedName, value]);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const onlyDigits = q.replace(/\D/g, "");
    if (!q) return clients.slice(0, maxSuggestions);
    return clients
      .filter((c) => {
        const name = c.name.toLowerCase();
        const phoneDigits = (c.phone || "").replace(/\D/g, "");
        return (
          name.includes(q) ||
          (onlyDigits.length >= 2 && phoneDigits.includes(onlyDigits))
        );
      })
      .slice(0, maxSuggestions);
  }, [clients, query, maxSuggestions]);

  const handleSelect = (c: Client) => {
    onSelect(c.id, c.name, c);
    setQuery(c.name);
    setOpen(false);
  };

  const handleClear = () => {
    onSelect("", "", null);
    setQuery("");
    setOpen(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions[highlight]) handleSelect(suggestions[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setHighlight(0);
            if (!e.target.value) onSelect("", "", null);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Digite o nome ou telefone..."
          className={cn("pr-8", value && "border-primary/40")}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted text-muted-foreground"
            aria-label="Limpar cliente"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
          {suggestions.map((c, i) => {
            const isActive = i === highlight;
            const isSelected = value === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(c);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors",
                  isActive ? "bg-accent text-accent-foreground" : "hover:bg-muted/50"
                )}
              >
                <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="flex-1 min-w-0 truncate">
                  <span className="font-medium">{c.name}</span>
                  {c.phone && <span className="text-muted-foreground ml-2">· {c.phone}</span>}
                </span>
                {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}

      {open && query && suggestions.length === 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 bg-popover border border-border rounded-md shadow-lg p-3 text-sm text-muted-foreground">
          Nenhum cliente encontrado.
        </div>
      )}
    </div>
  );
};

export default AgendaClientAutocomplete;
