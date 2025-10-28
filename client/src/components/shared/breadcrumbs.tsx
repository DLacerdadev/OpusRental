import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { useTranslation } from "react-i18next";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const { t } = useTranslation();

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
      <Link href="/dashboard">
        <a className="flex items-center gap-1 hover:text-foreground transition-colors" data-testid="breadcrumb-home">
          <Home className="h-4 w-4" />
        </a>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4" />
          {item.href ? (
            <Link href={item.href}>
              <a className="hover:text-foreground transition-colors" data-testid={`breadcrumb-${index}`}>
                {item.label}
              </a>
            </Link>
          ) : (
            <span className="text-foreground font-medium" data-testid={`breadcrumb-current-${index}`}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
