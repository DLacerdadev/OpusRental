import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface QuickAction {
  icon: LucideIcon;
  label: string;
  description: string;
  href: string;
  color?: string;
}

interface QuickActionsProps {
  title?: string;
  actions: QuickAction[];
}

export function QuickActions({ title, actions }: QuickActionsProps) {
  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <Link key={index} href={action.href}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.2 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="h-full border-2 hover:border-accent/50 transition-all cursor-pointer group">
                <CardContent className="p-4 sm:p-6">
                  <div className={`w-12 h-12 rounded-xl ${action.color || 'bg-accent/10'} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <action.icon className={`h-6 w-6 ${action.color ? 'text-white' : 'text-accent'}`} />
                  </div>
                  <h4 className="font-bold text-foreground mb-1 group-hover:text-accent transition-colors">
                    {action.label}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
