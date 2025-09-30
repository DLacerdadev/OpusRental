import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import logoPath from "@assets/image_1759264185138.png";
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
    <div className="bg-primary text-white border-r border-border w-72 min-h-screen flex flex-col shadow-xl">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3 mb-4">
          <img src={logoPath} alt="Opus Rental Capital" className="h-12 w-12" />
          <div>
            <h1 className="text-lg font-bold text-white">Opus Rental Capital</h1>
          </div>
        </div>
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
          <p className="text-xs text-accent font-medium mb-1">Perfil</p>
          <p className="text-sm text-white capitalize">{user?.role || "Investidor"}</p>
        </div>
      </div>

      <nav className="p-4 space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={`w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-accent text-primary shadow-lg" 
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </button>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          className="w-full flex items-center px-4 py-3 rounded-lg text-sm font-medium text-white/80 hover:bg-destructive/20 hover:text-white transition-all"
          onClick={() => logoutMutation.mutate()}
          data-testid="button-logout"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sair
        </button>
      </div>
    </div>
  );
}
