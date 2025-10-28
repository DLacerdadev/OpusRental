import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
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
  Users,
} from "lucide-react";

interface SidebarProps {
  user: any;
  onNavigate?: () => void;
  isMobile?: boolean;
}

export function Sidebar({ user, onNavigate, isMobile = false }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Always expand on mobile
  const effectiveCollapsed = isMobile ? false : isCollapsed;

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
    { path: "/dashboard", icon: LayoutDashboard, label: t('nav.dashboard'), roles: ["investor", "manager", "admin"] },
    { path: "/portfolio", icon: Briefcase, label: t('nav.portfolio'), roles: ["investor"] },
    { path: "/investor-shares", icon: Users, label: t('nav.investors'), roles: ["manager", "admin"] },
    { path: "/assets", icon: Truck, label: t('nav.assets'), roles: ["manager", "admin"] },
    { path: "/tracking", icon: MapPin, label: t('nav.tracking'), roles: ["manager", "admin"] },
    { path: "/financial", icon: DollarSign, label: t('nav.financial'), roles: ["manager", "admin"] },
    { path: "/reports", icon: FileText, label: t('nav.reports'), roles: ["manager", "admin"] },
    { path: "/compliance", icon: Shield, label: t('nav.compliance'), roles: ["manager", "admin"] },
  ];

  const settingsItems = [
    { path: "/approvals", icon: CheckCircle, label: t('nav.approvals'), roles: ["manager", "admin"] },
    { path: "/settings", icon: Settings, label: t('nav.settings'), roles: ["investor", "manager", "admin"] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user?.role || "investor"));
  const filteredSettingsItems = settingsItems.filter(item => item.roles.includes(user?.role || "investor"));

  return (
    <div className={`relative bg-card border-r border-border min-h-screen flex flex-col shadow-lg transition-all duration-300 ${effectiveCollapsed ? "w-20" : "w-72"}`}>
      {/* Collapse Toggle Button - Hidden on mobile */}
      {!isMobile && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-8 bg-background border border-border rounded-full p-1 shadow-md hover:shadow-lg transition-all hover:scale-110 z-20 items-center justify-center"
          data-testid="button-toggle-sidebar"
        >
          {isCollapsed ? <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      )}

      {/* Header with Logo */}
      <div className="p-5 border-b border-border">
        {!effectiveCollapsed && (
          <div className="flex items-center gap-3 mb-4">
            <img src={logoPath} alt="Opus" className="h-11 w-11 rounded-lg shadow-sm" />
            <div>
              <h1 className="text-base font-bold text-foreground">Opus Rental Capital</h1>
              <p className="text-xs text-muted-foreground">Investment Platform</p>
            </div>
          </div>
        )}
        {effectiveCollapsed && (
          <img src={logoPath} alt="Opus" className="h-10 w-10 rounded-lg shadow-sm mx-auto mb-3" />
        )}
        
        {!effectiveCollapsed && (
          <div className="bg-accent/5 border border-accent/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t('header.profile')}</p>
            </div>
            <p className="text-sm text-foreground font-semibold capitalize">
              {t(`roles.${user?.role || 'investor'}`)}
            </p>
            {user?.email && <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>}
          </div>
        )}
        {effectiveCollapsed && (
          <div className="bg-accent/10 rounded-lg p-2">
            <UserCog className="h-5 w-5 text-accent mx-auto" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <button
                onClick={onNavigate}
                className={`w-full flex items-center ${effectiveCollapsed ? "justify-center px-2" : "px-3"} py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive 
                    ? "bg-accent text-accent-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon className={`h-4.5 w-4.5 ${effectiveCollapsed ? "" : "mr-3"} flex-shrink-0`} />
                {!effectiveCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            </Link>
          );
        })}
      </nav>

      {/* Settings Section */}
      <div className="p-3 border-t border-border space-y-1 bg-muted/30">
        {!effectiveCollapsed && (
          <div className="text-xs font-semibold text-muted-foreground mb-2 px-3 uppercase tracking-wide">
            {t('nav.logout').toUpperCase().includes('SAIR') ? 'Sistema' : 'System'}
          </div>
        )}
        
        {filteredSettingsItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <button
                onClick={onNavigate}
                className={`w-full flex items-center ${effectiveCollapsed ? "justify-center px-2" : "px-3"} py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? "bg-accent text-accent-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon className={`h-4.5 w-4.5 ${effectiveCollapsed ? "" : "mr-3"} flex-shrink-0`} />
                {!effectiveCollapsed && <span className="truncate">{item.label}</span>}
              </button>
            </Link>
          );
        })}

        <button
          className={`w-full flex items-center ${effectiveCollapsed ? "justify-center px-2" : "px-3"} py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all`}
          onClick={() => logoutMutation.mutate()}
          data-testid="button-logout"
        >
          <LogOut className={`h-4.5 w-4.5 ${effectiveCollapsed ? "" : "mr-3"} flex-shrink-0`} />
          {!effectiveCollapsed && <span>{t('nav.logout')}</span>}
        </button>
      </div>
    </div>
  );
}
