import { ReactNode } from "react";
import { Breadcrumbs } from "./breadcrumbs";
import { motion } from "framer-motion";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  icon?: ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions, icon }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mb-6 sm:mb-8"
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} />
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 text-accent flex-shrink-0">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground" data-testid="page-title">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm sm:text-base text-muted-foreground mt-1" data-testid="page-subtitle">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  );
}
