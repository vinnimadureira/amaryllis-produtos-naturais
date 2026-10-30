import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

const Breadcrumbs = ({ items }: BreadcrumbsProps) => (
  <nav aria-label="Breadcrumb" className="mb-6">
    <ol className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
      <li>
        <Link to="/" className="hover:text-primary transition-colors">
          Início
        </Link>
      </li>
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          {item.path ? (
            <Link to={item.path} className="hover:text-primary transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium truncate max-w-[200px]">
              {item.label}
            </span>
          )}
        </li>
      ))}
    </ol>
  </nav>
);

export default Breadcrumbs;
