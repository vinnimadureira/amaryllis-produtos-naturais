import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const AdminPagination = ({ page, totalPages, onPageChange }: AdminPaginationProps) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" /> Anterior
      </button>
      <span className="text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
      >
        Próxima <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default AdminPagination;
