import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import logoPath from "@assets/Imagem do WhatsApp de 2025-09-30 à(s) 11.49.20_a02dcb9b_1759262288763.jpg";
import {
  LayoutDashboard,
  Briefcase,
  Truck,
  MapPin,
  DollarSign,
  FileText,
  Shield,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  user: any;
}

export function Sidebar({ user }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      setLocation("/login");
    },
  });

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/portfolio", icon: Briefcase, label: "Minha Carteira" },
    { path: "/assets", icon: Truck, label: "Gestão de Ativos" },
    { path: "/tracking", icon: MapPin, label: "Monitoramento GPS" },
    { path: "/financial", icon: DollarSign, label: "Financeiro" },
    { path: "/reports", icon: FileText, label: "Relatórios" },
    { path: "/compliance", icon: Shield, label: "Compliance" },
  ];

  return (
    <div className="bg-primary text-white border-r border-primary w-64 min-h-screen flex flex-col">
      <div className="p-4 border-b border-white/10 flex items-center space-x-3">
        <img src={logoPath} alt="Opus Rental Capital" className="h-10 w-10 rounded-full" />
        <div>
          <h1 className="text-base font-bold text-white">Opus Rental Capital</h1>
          <p className="text-xs text-white/70 capitalize">{user?.role || "Investidor"}</p>
        </div>
      </div>

      <nav className="p-3 space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={`w-full flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-accent text-white" 
                    : "text-white/90 hover:bg-white/10 hover:text-white"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon className="mr-3 h-4 w-4" />
                {item.label}
              </button>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <button
          className="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium text-white/90 hover:bg-destructive/20 hover:text-white transition-colors"
          onClick={() => logoutMutation.mutate()}
          data-testid="button-logout"
        >
          <LogOut className="mr-3 h-4 w-4" />
          Sair
        </button>
      </div>
    </div>
  );
}
