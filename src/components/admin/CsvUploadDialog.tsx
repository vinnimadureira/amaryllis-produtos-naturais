import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const CSV_TEMPLATE = "nome,descricao,preco,preco_exibicao,categoria,ativo,destaque\nExemplo Produto,Descrição aqui,89.90,R$ 89.90,Personalizados,sim,não";

const CsvUploadDialog = () => {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) throw new Error("CSV precisa ter cabeçalho + pelo menos 1 linha");
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const required = ["nome"];
    for (const r of required) {
      if (!headers.includes(r)) throw new Error(`Coluna obrigatória "${r}" não encontrada`);
    }
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = values[i] || ""; });
      return row;
    });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const rows = parseCSV(ev.target?.result as string);
        setPreview(rows);
      } catch (err: any) {
        setError(err.message);
        setPreview([]);
      }
    };
    reader.readAsText(file, "UTF-8");
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      const products = preview.map((row) => ({
        name: row.nome || row.name || "",
        description: row.descricao || row.description || null,
        price: parseFloat(row.preco || row.price || "0") || 0,
        price_display: row.preco_exibicao || row.price_display || `R$ ${(parseFloat(row.preco || "0") || 0).toFixed(2).replace(".", ",")}`,
        category: row.categoria || row.category || "Personalizados",
        active: !["não", "nao", "false", "0", "no"].includes((row.ativo || row.active || "sim").toLowerCase()),
        featured: ["sim", "true", "1", "yes"].includes((row.destaque || row.featured || "não").toLowerCase()),
      }));

      const valid = products.filter((p) => p.name.length > 0);
      if (valid.length === 0) throw new Error("Nenhum produto válido encontrado");

      const { error } = await supabase.from("products").insert(valid);
      if (error) throw error;

      toast({ title: `${valid.length} produto(s) importado(s) com sucesso!` });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setOpen(false);
      setPreview([]);
    } catch (err: any) {
      toast({ title: "Erro na importação", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob(["\uFEFF" + CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template-produtos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setPreview([]); setError(""); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <FileSpreadsheet className="w-4 h-4" /> Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Importar Produtos via CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Envie um arquivo CSV com colunas: <code className="text-xs bg-muted px-1 py-0.5 rounded">nome, descricao, preco, preco_exibicao, categoria, ativo, destaque</code>
          </p>

          <Button variant="link" size="sm" className="p-0 h-auto text-primary" onClick={downloadTemplate}>
            📥 Baixar template CSV
          </Button>

          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
          <Button variant="outline" className="w-full gap-2" onClick={() => fileRef.current?.click()}>
            <Upload className="w-4 h-4" /> Selecionar arquivo CSV
          </Button>

          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {preview.length > 0 && (
            <>
              <div className="border border-border rounded-lg overflow-auto max-h-48">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left">Nome</th>
                      <th className="p-2 text-left">Preço</th>
                      <th className="p-2 text-left">Categoria</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="p-2">{row.nome || row.name}</td>
                        <td className="p-2">{row.preco_exibicao || row.price_display || row.preco || row.price}</td>
                        <td className="p-2">{row.categoria || row.category}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {preview.length > 10 && (
                  <p className="text-xs text-muted-foreground p-2">...e mais {preview.length - 10} produto(s)</p>
                )}
              </div>

              <Button onClick={handleImport} disabled={importing} className="w-full bg-primary text-primary-foreground hover:bg-rose-dark">
                {importing ? "Importando..." : `Importar ${preview.length} produto(s)`}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CsvUploadDialog;
