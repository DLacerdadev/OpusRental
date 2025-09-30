import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import logoPath from "@assets/image_1759264185138.png";
import { useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Truck,
  MapPin,
  DollarSign,
  FileText,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings,
  CheckCircle,
  UserCog,
} from "lucide-react";

interface SidebarProps {
  user: any;
}

export function Sidebar({ user }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Logout realizado",
        description: "Você saiu com sucesso",
      });
      setLocation("/login");
    },
  });

  const isManager = user?.role === "manager" || user?.role === "admin";

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: "Dashboard", roles: ["investor", "manager", "admin"] },
    { path: "/portfolio", icon: Briefcase, label: "Minha Carteira", roles: ["investor", "manager", "admin"] },
    { path: "/assets", icon: Truck, label: "Gestão de Ativos", roles: ["manager", "admin"] },
    { path: "/tracking", icon: MapPin, label: "Rastreamento", roles: ["manager", "admin"] },
    { path: "/financial", icon: DollarSign, label: "Financeiro", roles: ["manager", "admin"] },
    { path: "/reports", icon: FileText, label: "Relatórios", roles: ["investor", "manager", "admin"] },
    { path: "/compliance", icon: Shield, label: "Compliance", roles: ["manager", "admin"] },
  ];

  const settingsItems = [
    { path: "/approvals", icon: CheckCircle, label: "Aprovações", roles: ["manager", "admin"] },
    { path: "/settings", icon: Settings, label: "Configurações", roles: ["investor", "manager", "admin"] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role || "investor"));
  const filteredSettingsItems = settingsItems.filter(item => item.roles.includes(user?.role || "investor"));

  return (
    <div className={`bg-gradient-to-b from-primary via-primary to-primary/95 text-white border-r border-white/10 min-h-screen flex flex-col shadow-2xl transition-all duration-300 ${isCollapsed ? "w-20" : "w-72"}`}>
      {/* Header with Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <img src={logoPath} alt="Opus" className="h-12 w-12 rounded-xl shadow-lg" />
              <div>
                <h1 className="text-base font-bold text-white">Opus Rental</h1>
                <p className="text-xs text-accent">Capital</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <img src={logoPath} alt="Opus" className="h-10 w-10 rounded-xl shadow-lg mx-auto" />
          )}
        </div>
        
        {!isCollapsed && (
          <div className="bg-gradient-to-r from-accent/20 to-accent/10 border border-accent/40 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <UserCog className="h-4 w-4 text-accent" />
              <p className="text-xs text-accent font-bold">PERFIL</p>
            </div>
            <p className="text-sm text-white font-semibold capitalize">{user?.role || "Investidor"}</p>
            {user?.email && <p className="text-xs text-white/70 mt-1 truncate">{user.email}</p>}
          </div>
        )}
        {isCollapsed && (
          <div className="bg-accent/20 border border-accent/40 rounded-xl p-2 mt-2">
            <UserCog className="h-5 w-5 text-accent mx-auto" />
          </div>
        )}
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-6 -right-3 bg-accent hover:bg-accent/90 text-white rounded-full p-1.5 shadow-lg transition-all hover:scale-110 z-10"
        data-testid="button-toggle-sidebar"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Navigation */}
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={`w-full flex items-center ${isCollapsed ? "justify-center px-2" : "px-4"} py-3 rounded-xl text-sm font-semibold transition-all group ${
                  isActive 
                    ? "bg-accent text-white shadow-lg scale-105" 
                    : "text-white/80 hover:bg-white/10 hover:text-white hover:scale-102"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"} ${isActive ? "animate-pulse" : ""}`} />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            </Link>
          );
        })}
      </nav>

      {/* Settings Section */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <div className={`${isCollapsed ? "hidden" : "block"} text-xs font-bold text-white/50 mb-3 px-2`}>
          SISTEMA
        </div>
        
        {filteredSettingsItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={`w-full flex items-center ${isCollapsed ? "justify-center px-2" : "px-4"} py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive 
                    ? "bg-accent text-white shadow-lg" 
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`} />
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            </Link>
          );
        })}

        <button
          className={`w-full flex items-center ${isCollapsed ? "justify-center px-2" : "px-4"} py-3 rounded-xl text-sm font-semibold text-white/80 hover:bg-secondary/30 hover:text-white transition-all`}
          onClick={() => logoutMutation.mutate()}
          data-testid="button-logout"
        >
          <LogOut className={`h-5 w-5 ${isCollapsed ? "" : "mr-3"}`} />
          {!isCollapsed && <span>Sair</span>}
        </button>
      </div>
    </div>
  );
}
