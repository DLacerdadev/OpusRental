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
    <div className={`relative bg-gradient-to-b from-primary via-primary to-primary/95 text-white border-r border-white/10 min-h-screen flex flex-col shadow-2xl transition-all duration-300 ${effectiveCollapsed ? "w-20" : "w-72"}`}>
      {/* Collapse Toggle Button - Hidden on mobile */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden lg:block absolute top-6 right-4 bg-accent hover:bg-accent/90 text-white rounded-full p-1.5 shadow-lg transition-all hover:scale-110 z-20"
        data-testid="button-toggle-sidebar"
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Header with Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          {!effectiveCollapsed && (
            <div className="flex items-center gap-3">
              <img src={logoPath} alt="Opus" className="h-12 w-12 rounded-xl shadow-lg" />
              <div>
                <h1 className="text-base font-bold text-white">Opus Rental</h1>
                <p className="text-xs text-accent">Capital</p>
              </div>
            </div>
          )}
          {effectiveCollapsed && (
            <img src={logoPath} alt="Opus" className="h-10 w-10 rounded-xl shadow-lg mx-auto" />
          )}
        </div>
        
        {!effectiveCollapsed && (
          <div className="bg-gradient-to-r from-accent/20 to-accent/10 border border-accent/40 rounded-xl p-3 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-1">
              <UserCog className="h-4 w-4 text-accent" />
              <p className="text-xs text-accent font-bold">{t('header.profile')}</p>
            </div>
            <p className="text-sm text-white font-semibold capitalize">
              {t(`roles.${user?.role || 'investor'}`)}
            </p>
            {user?.email && <p className="text-xs text-white/70 mt-1 truncate">{user.email}</p>}
          </div>
        )}
        {effectiveCollapsed && (
          <div className="bg-accent/20 border border-accent/40 rounded-xl p-2 mt-2">
            <UserCog className="h-5 w-5 text-accent mx-auto" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <button
                onClick={onNavigate}
                className={`w-full flex items-center ${effectiveCollapsed ? "justify-center px-2" : "px-4"} py-3 rounded-xl text-sm font-semibold transition-all group active:opacity-80 ${
                  isActive 
                    ? "bg-accent text-white shadow-lg scale-105" 
                    : "text-white/80 hover:bg-white/10 hover:text-white hover:scale-102"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon className={`h-5 w-5 ${effectiveCollapsed ? "" : "mr-3"} ${isActive ? "animate-pulse" : ""}`} />
                {!effectiveCollapsed && <span>{item.label}</span>}
              </button>
            </Link>
          );
        })}
      </nav>

      {/* Settings Section */}
      <div className="p-4 border-t border-white/20 space-y-2 bg-black/10">
        <div className={`${effectiveCollapsed ? "hidden" : "block"} text-xs font-bold text-white/90 mb-3 px-2 tracking-wider`}>
          {t('nav.logout').toUpperCase().includes('SAIR') ? 'SISTEMA' : 'SYSTEM'}
        </div>
        
        {filteredSettingsItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <button
                onClick={onNavigate}
                className={`w-full flex items-center ${effectiveCollapsed ? "justify-center px-2" : "px-4"} py-3 rounded-xl text-sm font-semibold transition-all active:opacity-80 ${
                  isActive 
                    ? "bg-accent text-white shadow-lg" 
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <Icon className={`h-5 w-5 ${effectiveCollapsed ? "" : "mr-3"}`} />
                {!effectiveCollapsed && <span>{item.label}</span>}
              </button>
            </Link>
          );
        })}

        <button
          className={`w-full flex items-center ${effectiveCollapsed ? "justify-center px-2" : "px-4"} py-3 rounded-xl text-sm font-semibold text-white/80 hover:bg-secondary/30 hover:text-white transition-all active:opacity-80`}
          onClick={() => logoutMutation.mutate()}
          data-testid="button-logout"
        >
          <LogOut className={`h-5 w-5 ${effectiveCollapsed ? "" : "mr-3"}`} />
          {!effectiveCollapsed && <span>{t('nav.logout')}</span>}
        </button>
      </div>
    </div>
  );
}
